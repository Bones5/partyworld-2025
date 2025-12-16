/**
 * Clerk.io Recommendations Module
 *
 * Fetches product recommendations from Clerk.io and renders them
 * using BigCommerce's Storefront GraphQL API for full product data.
 * Uses DOM-based templates for maintainability and consistency with theme markup.
 */

// TEMPORARY: Import production to staging ID mapping for local development
// TODO: Remove this import once Clerk.io is configured for staging
import { PRODUCTION_TO_STAGING_ID_MAP } from './product-id-mapping';

const GRAPHQL_ENDPOINT = '/graphql';

/**
 * GraphQL query to fetch products by their IDs
 */
const PRODUCTS_BY_IDS_QUERY = `
    query ProductsById($entityIds: [Int!], $currencyCode: currencyCode!) {
        site {
            products(entityIds: $entityIds, first: 50) {
                edges {
                    node {
                        entityId
                        name
                        sku
                        path
                        addToCartUrl
                        prices(currencyCode: $currencyCode) {
                            price {
                                value
                                currencyCode
                            }
                            salePrice {
                                value
                                currencyCode
                            }
                            retailPrice {
                                value
                                currencyCode
                            }
                            priceRange {
                                min { value }
                                max { value }
                            }
                        }
                        defaultImage {
                            url320wide: url(width: 320)
                            url640wide: url(width: 640)
                            altText
                        }
                        brand {
                            name
                            path
                        }
                        reviewSummary {
                            summationOfRatings
                            numberOfReviews
                        }
                        inventory {
                            isInStock
                            aggregated {
                                availableToSell
                            }
                        }
                        productOptions {
                            edges {
                                node {
                                    entityId
                                    displayName
                                }
                            }
                        }
                        availabilityV2 {
                            status
                            description
                        }
                    }
                }
            }
            currency(currencyCode: $currencyCode) {
                display {
                    symbol
                    decimalPlaces
                }
            }
        }
    }
`;

/**
 * Clerk.io REST API endpoint
 */
const CLERK_API_URL = 'https://api.clerk.io/v2';

/**
 * Translate production product IDs to staging IDs
 * @param {number[]} productIds - Array of production product IDs from Clerk
 * @returns {number[]} Array of staging product IDs
 */
function translateProductIds(productIds) {
    if (Object.keys(PRODUCTION_TO_STAGING_ID_MAP).length === 0) {
        // No mapping defined, return original IDs
        return productIds;
    }

    const translatedIds = productIds.map(id => {
        const stagingId = PRODUCTION_TO_STAGING_ID_MAP[id];
        if (stagingId) {
            console.log(`[Clerk] Translated product ID: ${id} → ${stagingId}`);
            return stagingId;
        }
        console.warn(`[Clerk] No staging mapping for production ID: ${id}`);
        return id; // Keep original if no mapping
    });

    return translatedIds;
}

/**
 * Call Clerk.io REST API directly (bypasses JS SDK domain restrictions)
 * @param {string} endpoint - API endpoint (e.g., 'recommendations/popular')
 * @param {Object} params - Request parameters
 * @param {string} apiKey - Clerk.io public API key
 * @returns {Promise<Object>} API response
 */
async function callClerkApi(endpoint, params, apiKey) {
    const url = new URL(`${CLERK_API_URL}/${endpoint}`);

    // Add API key and visitor
    const requestParams = {
        key: apiKey,
        visitor: getOrCreateVisitorId(),
        ...params,
    };

    // Convert params to query string for GET request
    Object.entries(requestParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(`${key}[]`, v));
        } else if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    console.log('[Clerk API] Calling:', url.toString());

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Clerk API] Error response:', errorText);
        throw new Error(`Clerk API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Clerk API] Response:', data);
    return data;
}

/**
 * Get or create a visitor ID for Clerk.io tracking
 * @returns {string} Visitor ID
 */
function getOrCreateVisitorId() {
    const storageKey = 'clerk_visitor_id';
    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
        // Generate a random visitor ID
        visitorId = `v_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
}

/**
 * Fetch products from BigCommerce Storefront GraphQL API
 * @param {number[]} productIds - Array of product entity IDs
 * @param {string} token - Storefront API token
 * @param {string} currencyCode - Currency code (e.g., 'EUR', 'GBP')
 * @returns {Promise<Object[]>} Array of product objects
 */
async function fetchProductsByIds(productIds, token, currencyCode = 'EUR') {
    if (!productIds || productIds.length === 0) {
        return [];
    }

    try {
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                query: PRODUCTS_BY_IDS_QUERY,
                variables: {
                    entityIds: productIds.map(id => parseInt(id, 10)),
                    currencyCode,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`GraphQL request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error('GraphQL query returned errors');
        }

        const products = data.data.site.products.edges.map(edge => edge.node);
        const currency = data.data.site.currency;

        // Maintain the order from Clerk (most relevant first)
        const productMap = new Map(products.map(p => [p.entityId, p]));
        const orderedProducts = productIds
            .map(id => productMap.get(parseInt(id, 10)))
            .filter(Boolean);

        return { products: orderedProducts, currency };
    } catch (error) {
        console.error('Error fetching products from GraphQL:', error);
        return { products: [], currency: null };
    }
}

/**
 * Format price for display
 * @param {Object} priceObj - Price object from GraphQL
 * @param {Object} currency - Currency display settings
 * @returns {string} Formatted price string
 */
function formatPrice(priceObj, currency) {
    if (!priceObj || !priceObj.value) return '';

    const symbol = currency?.display?.symbol || '€';
    const decimals = currency?.display?.decimalPlaces ?? 2;

    return `${symbol}${priceObj.value.toFixed(decimals)}`;
}

/**
 * Calculate star rating percentage for display
 * @param {Object} reviewSummary - Review summary from GraphQL
 * @returns {number} Rating as percentage (0-100)
 */
function calculateRatingPercentage(reviewSummary) {
    if (!reviewSummary || reviewSummary.numberOfReviews === 0) {
        return 0;
    }
    const avgRating = reviewSummary.summationOfRatings / reviewSummary.numberOfReviews;
    return (avgRating / 5) * 100;
}

/**
 * Get the product card template from the DOM
 * @returns {HTMLTemplateElement|null}
 */
function getCardTemplate() {
    return document.getElementById('clerk-product-card-template');
}

/**
 * Render a product card using the DOM template
 * @param {Object} product - Product data from GraphQL
 * @param {Object} currency - Currency display settings
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} Cloned and populated card element
 */
function renderProductCard(product, currency, options = {}) {
    const {
        showRating = true,
        showBrand = true,
        showQuickView = true,
    } = options;

    const template = getCardTemplate();

    // Fallback to string-based rendering if template not found
    if (!template) {
        return renderProductCardFallback(product, currency, options);
    }

    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('article.card');

    const hasOptions = product.productOptions?.edges?.length > 0;
    const isInStock = product.inventory?.isInStock !== false;
    const stockLevel = product.inventory?.aggregated?.availableToSell ?? 999;
    const prices = product.prices || {};
    const hasSalePrice = prices.salePrice?.value && prices.salePrice.value < prices.price?.value;
    const ratingPercentage = calculateRatingPercentage(product.reviewSummary);
    const numberOfReviews = product.reviewSummary?.numberOfReviews || 0;

    // Set card data attributes
    card.setAttribute('data-test', `card-${product.entityId}`);
    card.setAttribute('data-entity-id', product.entityId);
    card.setAttribute('data-name', product.name);
    card.setAttribute('data-product-brand', product.brand?.name || '');

    // Image
    const imageUrl = product.defaultImage?.url320wide || '/assets/img/ProductDefault.gif';
    const imageAlt = product.defaultImage?.altText || product.name;
    const img = card.querySelector('.card-image');
    img.setAttribute('data-src', imageUrl);
    img.setAttribute('alt', imageAlt);
    img.setAttribute('title', product.name);
    if (product.defaultImage?.url640wide) {
        img.setAttribute('data-srcset', `${product.defaultImage.url320wide} 320w, ${product.defaultImage.url640wide} 640w`);
    }

    // Links
    const figureLink = card.querySelector('.card-figure__link');
    figureLink.setAttribute('href', product.path);
    figureLink.setAttribute('aria-label', product.name);

    const titleLink = card.querySelector('.card-title a');
    titleLink.setAttribute('href', product.path);
    titleLink.textContent = product.name;

    // Badge
    const badgeContainer = card.querySelector('.card-badge-container');
    if (stockLevel === 0 || !isInStock) {
        badgeContainer.innerHTML = `
            <div class="product-badge product-badge--sold-out">
                <span class="product-badge-text">Sold Out</span>
            </div>
        `;
    } else if (hasSalePrice) {
        badgeContainer.innerHTML = `
            <div class="product-badge product-badge--sale">
                <span class="product-badge-text">On Sale!</span>
            </div>
        `;
    }

    // Rating
    const ratingEl = card.querySelector('.card-rating');
    if (showRating && numberOfReviews > 0) {
        ratingEl.hidden = false;
        const ratingFill = ratingEl.querySelector('.rating-fill');
        const ratingSpan = ratingEl.querySelector('.rating');
        ratingFill.style.width = `${ratingPercentage}%`;
        ratingSpan.setAttribute('aria-label', `Rated ${(ratingPercentage / 20).toFixed(1)} out of 5 stars`);
    }

    // Brand
    const brandEl = card.querySelector('.card-brand');
    if (showBrand && product.brand?.name) {
        brandEl.hidden = false;
        brandEl.textContent = product.brand.name;
    }

    // Price
    const priceContainer = card.querySelector('.card-price');
    if (hasSalePrice) {
        priceContainer.innerHTML = `
            <span class="price-section price-section--withoutTax non-sale-price--withoutTax">
                <span data-product-non-sale-price-without-tax class="price price--non-sale">${formatPrice(prices.price, currency)}</span>
            </span>
            <span class="price-section price-section--withoutTax">
                <span data-product-price-without-tax class="price price--withoutTax">${formatPrice(prices.salePrice, currency)}</span>
            </span>
        `;
    } else if (prices.price?.value) {
        priceContainer.innerHTML = `
            <span class="price-section price-section--withoutTax">
                <span data-product-price-without-tax class="price price--withoutTax">${formatPrice(prices.price, currency)}</span>
            </span>
        `;
    }

    // Actions (Quick view, Add to cart, Choose options)
    const actionsContainer = card.querySelector('.card-figcaption-body');
    let actionsHtml = '';

    if (showQuickView) {
        actionsHtml += `
            <button type="button" class="button button--small card-figcaption-button quickview" 
                    data-event-type="product-click" 
                    data-product-id="${product.entityId}" 
                    aria-label="Quick view - ${product.name}">
                Quick view
            </button>
        `;
    }

    if (!hasOptions && isInStock && product.addToCartUrl) {
        actionsHtml += `
            <a href="${product.addToCartUrl}" 
               data-event-type="product-click" 
               data-button-type="add-cart" 
               class="button button--small card-figcaption-button">
                Add to Cart
            </a>
        `;
    } else if (hasOptions) {
        actionsHtml += `
            <a href="${product.path}" 
               data-event-type="product-click" 
               class="button button--small card-figcaption-button" 
               data-product-id="${product.entityId}">
                Choose Options
            </a>
        `;
    }

    actionsContainer.innerHTML = actionsHtml;

    // CTA button link
    const ctaLink = card.querySelector('.card-cta');
    if (ctaLink) {
        ctaLink.setAttribute('href', product.path);
    }

    return card;
}

/**
 * Fallback string-based rendering if template is not in DOM
 * @param {Object} product - Product data from GraphQL
 * @param {Object} currency - Currency display settings
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} Card element created from string
 */
function renderProductCardFallback(product, currency, options = {}) {
    const {
        showRating = true,
        showBrand = true,
        showQuickView = true,
    } = options;

    const hasOptions = product.productOptions?.edges?.length > 0;
    const isInStock = product.inventory?.isInStock !== false;
    const stockLevel = product.inventory?.aggregated?.availableToSell ?? 999;

    const prices = product.prices || {};
    const hasSalePrice = prices.salePrice?.value && prices.salePrice.value < prices.price?.value;

    const ratingPercentage = calculateRatingPercentage(product.reviewSummary);
    const numberOfReviews = product.reviewSummary?.numberOfReviews || 0;

    // Badge HTML
    let badgeHtml = '';
    if (stockLevel === 0 || !isInStock) {
        badgeHtml = `
            <div class="product-badge product-badge--sold-out">
                <span class="product-badge-text">Sold Out</span>
            </div>
        `;
    } else if (hasSalePrice) {
        badgeHtml = `
            <div class="product-badge product-badge--sale">
                <span class="product-badge-text">On Sale!</span>
            </div>
        `;
    }

    // Rating HTML
    let ratingHtml = '';
    if (showRating && numberOfReviews > 0) {
        ratingHtml = `
            <p class="card-text card-rating" data-test-info-type="productRating">
                <span class="rating--small">
                    <span class="rating" role="img" aria-label="Rated ${(ratingPercentage / 20).toFixed(1)} out of 5 stars">
                        <span class="rating-background"></span>
                        <span class="rating-fill" style="width: ${ratingPercentage}%;"></span>
                    </span>
                </span>
            </p>
        `;
    }

    // Brand HTML
    let brandHtml = '';
    if (showBrand && product.brand?.name) {
        brandHtml = `<p class="card-text card-brand" data-test-info-type="brandName">${escapeHtml(product.brand.name)}</p>`;
    }

    // Price HTML
    let priceHtml = '';
    if (hasSalePrice) {
        priceHtml = `
            <span class="price-section price-section--withoutTax non-sale-price--withoutTax">
                <span data-product-non-sale-price-without-tax class="price price--non-sale">${formatPrice(prices.price, currency)}</span>
            </span>
            <span class="price-section price-section--withoutTax">
                <span data-product-price-without-tax class="price price--withoutTax">${formatPrice(prices.salePrice, currency)}</span>
            </span>
        `;
    } else if (prices.price?.value) {
        priceHtml = `
            <span class="price-section price-section--withoutTax">
                <span data-product-price-without-tax class="price price--withoutTax">${formatPrice(prices.price, currency)}</span>
            </span>
        `;
    }

    // Quick view / Add to cart buttons
    let actionsHtml = '';
    if (showQuickView) {
        actionsHtml = `
            <button type="button" class="button button--small card-figcaption-button quickview" 
                    data-event-type="product-click" 
                    data-product-id="${product.entityId}" 
                    aria-label="Quick view - ${escapeHtml(product.name)}">
                Quick view
            </button>
        `;
    }
    if (!hasOptions && isInStock && product.addToCartUrl) {
        actionsHtml += `
            <a href="${product.addToCartUrl}" 
               data-event-type="product-click" 
               data-button-type="add-cart" 
               class="button button--small card-figcaption-button">
                Add to Cart
            </a>
        `;
    } else if (hasOptions) {
        actionsHtml += `
            <a href="${product.path}" 
               data-event-type="product-click" 
               class="button button--small card-figcaption-button" 
               data-product-id="${product.entityId}">
                Choose Options
            </a>
        `;
    }

    // Image
    const imageUrl = product.defaultImage?.url320wide || '/assets/img/ProductDefault.gif';
    const imageAlt = product.defaultImage?.altText || product.name;
    const imageSrcset = product.defaultImage?.url640wide
        ? `${product.defaultImage.url320wide} 320w, ${product.defaultImage.url640wide} 640w`
        : '';

    const htmlString = `
        <article class="card" 
                 data-test="card-${product.entityId}" 
                 data-event-type="list" 
                 data-entity-id="${product.entityId}"
                 data-name="${escapeHtml(product.name)}"
                 data-product-brand="${escapeHtml(product.brand?.name || '')}">
            <figure class="card-figure">
                ${badgeHtml}
                <a href="${product.path}" 
                   class="card-figure__link" 
                   aria-label="${escapeHtml(product.name)}"
                   data-event-type="product-click">
                    <div class="card-img-container">
                        <img class="card-image lazyload" 
                             data-src="${imageUrl}" 
                             ${imageSrcset ? `data-srcset="${imageSrcset}"` : ''} 
                             data-sizes="auto"
                             alt="${escapeHtml(imageAlt)}"
                             title="${escapeHtml(product.name)}">
                    </div>
                </a>
                <figcaption class="card-figcaption">
                    <div class="card-figcaption-body">
                        ${actionsHtml}
                    </div>
                </figcaption>
            </figure>
            <div class="card-body">
                ${ratingHtml}
                ${brandHtml}
                <h3 class="card-title">
                    <a href="${product.path}" data-event-type="product-click">
                        ${escapeHtml(product.name)}
                    </a>
                </h3>
                <div class="card-text card-price" data-test-info-type="price">
                    ${priceHtml}
                </div>
                <a href="${product.path}" class="card-cta" data-event-type="product-click">Shop Now</a>
            </div>
        </article>
    `;

    // Convert string to DOM element
    const temp = document.createElement('div');
    temp.innerHTML = htmlString.trim();
    return temp.firstChild;
}

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Initialize Clerk recommendations for a container element
 * @param {HTMLElement} container - Container element with data attributes
 * @param {Object} context - Theme context with API token
 */
async function initClerkRecommendations(container, context) {
    const {
        clerkType,
        clerkProducts,
        clerkCategory,
        clerkKeywords,
        clerkLimit = 8,
    } = container.dataset;

    if (!context.clerkPublicKey) {
        console.warn('[Clerk] No API key configured');
        return;
    }

    if (!context.storefrontApiToken) {
        console.error('[Clerk] Storefront API token not available');
        return;
    }

    // Build Clerk API endpoint based on type
    let endpoint;
    const params = { limit: parseInt(clerkLimit, 10) };

    switch (clerkType) {
    case 'popular':
        endpoint = 'recommendations/popular';
        break;
    case 'trending':
        endpoint = 'recommendations/trending';
        break;
    case 'new':
        endpoint = 'recommendations/new';
        break;
    case 'visitor':
        endpoint = 'recommendations/visitor/complementary';
        break;
    case 'similar':
        endpoint = 'recommendations/similar';
        if (clerkProducts) {
            params.products = clerkProducts.split(',').map(id => parseInt(id, 10));
        }
        break;
    case 'complementary':
        endpoint = 'recommendations/complementary';
        if (clerkProducts) {
            params.products = clerkProducts.split(',').map(id => parseInt(id, 10));
        }
        break;
    case 'category':
        endpoint = 'recommendations/category/popular';
        if (clerkCategory) {
            params.category = clerkCategory;
        }
        break;
    case 'keywords':
        endpoint = 'recommendations/keywords/popular';
        if (clerkKeywords) {
            params.keywords = clerkKeywords.split(',');
        }
        break;
    default:
        endpoint = 'recommendations/popular';
    }

    // Show loading state
    container.classList.add('is-loading');

    try {
        // Call Clerk REST API directly (no domain restrictions)
        const clerkResponse = await callClerkApi(endpoint, params, context.clerkPublicKey);

        let productIds = clerkResponse?.result || [];

        if (productIds.length === 0) {
            console.log('[Clerk] No products returned');
            container.innerHTML = '';
            container.classList.remove('is-loading');
            container.classList.add('is-empty');
            container.closest('.c-clerkRecommendations')?.classList.add('is-empty');
            return;
        }

        console.log('[Clerk] Product IDs from Clerk:', productIds);

        // TEMPORARY: Translate production IDs to staging IDs
        productIds = translateProductIds(productIds);
        console.log('[Clerk] Product IDs after translation:', productIds);

        // Fetch full product data from BigCommerce
        const { products, currency } = await fetchProductsByIds(
            productIds,
            context.storefrontApiToken,
            context.currencyCode || 'EUR',
        );

        if (products.length === 0) {
            container.innerHTML = '';
            container.classList.remove('is-loading');
            container.classList.add('is-empty');
            container.closest('.c-clerkRecommendations')?.classList.add('is-empty');
            return;
        }

        // Create product grid
        const productGrid = document.createElement('div');
        productGrid.className = 'productGrid clerk-product-grid';

        // Render product cards using template
        products.forEach(product => {
            const cardEl = renderProductCard(product, currency, {
                showRating: true,
                showBrand: true,
                showQuickView: context.showQuickView !== false,
            });
            productGrid.appendChild(cardEl);
        });

        // Remove skeleton, add product grid
        const skeletonGrid = container.querySelector('.clerk-skeleton-grid');
        if (skeletonGrid) {
            skeletonGrid.remove();
        }
        container.appendChild(productGrid);

        container.classList.remove('is-loading');
        container.classList.add('is-loaded');
        container.closest('.c-clerkRecommendations')?.classList.add('is-loaded');

        // Initialize slick carousel if jQuery is available
        if (window.jQuery && window.jQuery.fn.slick) {
            window.jQuery(productGrid).slick({
                infinite: false,
                mobileFirst: true,
                slidesToShow: 2,
                slidesToScroll: 2,
                arrows: true,
                dots: false,
                responsive: [
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 4,
                            slidesToScroll: 4,
                        },
                    },
                    {
                        breakpoint: 800,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3,
                        },
                    },
                    {
                        breakpoint: 550,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2,
                        },
                    },
                ],
            });
        }

        // Trigger lazysizes if available
        if (window.lazySizes) {
            window.lazySizes.init();
        }
    } catch (error) {
        console.error('[Clerk] Error loading recommendations:', error);
        container.innerHTML = '';
        container.classList.remove('is-loading');
        container.classList.add('is-error');
        container.closest('.c-clerkRecommendations')?.classList.add('is-error');
    }
}

/**
 * Initialize all Clerk recommendation containers on the page
 * @param {Object} context - Theme context
 */
function initAllClerkRecommendations(context) {
    if (!context.clerkEnabled) {
        return;
    }

    const containers = document.querySelectorAll('[data-clerk-container]');
    containers.forEach(container => {
        initClerkRecommendations(container, context);
    });
}

export {
    initClerkRecommendations,
    initAllClerkRecommendations,
    fetchProductsByIds,
    renderProductCard,
};
