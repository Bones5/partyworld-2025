/**
 * Fast Simon Recommendations Module
 *
 * Fetches product recommendations from Fast Simon's Upsell/Cross-Sell API
 * and renders them using BigCommerce's Storefront GraphQL API for full product data.
 *
 * Architecture:
 *   1. Fast Simon API returns product IDs via /upsell_cross_sell_recommendation
 *   2. BigCommerce Storefront GraphQL fetches full product data (prices w/ tax, images, reviews, inventory)
 *   3. Native theme product cards render the products with consistent styling
 *   4. Products display in a Slick carousel (responsive: 2→3→4 columns)
 *
 * Uses Fast Simon's widget-based API with configurable widget IDs per page.
 */

/* eslint-disable no-console, no-param-reassign, no-use-before-define */

const GRAPHQL_ENDPOINT = '/graphql';
const FASTSIMON_API_URL = 'https://api.fastsimon.com';

// Session management for Fast Simon event tracking
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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
                        prices(currencyCode: $currencyCode, includeTax: true) {
                            price {
                                value
                                currencyCode
                            }
                            basePrice {
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
 * Get or create an ISP token for Fast Simon tracking
 * @returns {string} ISP token
 */
function getOrCreateIspToken() {
    const storageKey = 'fastsimon_isp_token';
    let token = localStorage.getItem(storageKey);

    if (!token) {
        token = `fs_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
        localStorage.setItem(storageKey, token);
    }

    return token;
}

/**
 * Get or create a session timestamp for Fast Simon
 * Sessions restart after 30 minutes of inactivity.
 * @returns {number} Session start timestamp in seconds
 */
function getSessionTimestamp() {
    const storageKey = 'fastsimon_session';
    const lastActivityKey = 'fastsimon_last_activity';
    const now = Math.floor(Date.now() / 1000);

    const lastActivity = parseInt(localStorage.getItem(lastActivityKey) || '0', 10);
    let session = parseInt(localStorage.getItem(storageKey) || '0', 10);

    // Restart session if inactive for 30+ minutes
    if (!session || (now - lastActivity) > (SESSION_TIMEOUT / 1000)) {
        session = now;
        localStorage.setItem(storageKey, session.toString());
    }

    localStorage.setItem(lastActivityKey, now.toString());
    return session;
}

/**
 * Call Fast Simon Upsell/Cross-Sell Recommendation API
 * @param {Object} params - API parameters
 * @param {string} params.storeId - Fast Simon Store ID
 * @param {string} params.uuid - Fast Simon UUID
 * @param {string[]} params.widgetIds - Array of widget IDs from FS dashboard
 * @param {string|number} [params.productId] - Product ID for PDP context
 * @param {string|number} [params.categoryId] - Category ID for category page context
 * @param {string[]|number[]} [params.products] - Recently viewed / cart product IDs
 * @param {string} [params.cartToken] - Platform cart token
 * @returns {Promise<Object>} API response with widget_responses
 */
async function callFastSimonRecommendations(params) {
    const {
        storeId, uuid, widgetIds, productId, categoryId, products, cartToken,
    } = params;

    const url = new URL(`${FASTSIMON_API_URL}/upsell_cross_sell_recommendation`);
    url.searchParams.set('store_id', storeId);
    url.searchParams.set('UUID', uuid);

    // Widget IDs as a JSON-encoded array string
    url.searchParams.set('widgets_ids', JSON.stringify(widgetIds));

    if (productId) {
        url.searchParams.set('product_id', productId.toString());
    }

    if (categoryId) {
        url.searchParams.set('category_id', categoryId.toString());
    }

    if (products && products.length > 0) {
        url.searchParams.set('products', JSON.stringify(products.map(id => id.toString())));
    }

    if (cartToken) {
        url.searchParams.set('cart_token', cartToken);
    }

    try {
        const response = await fetch(url.toString());

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[FastSimon API] Error response:', errorText);
            throw new Error(`Fast Simon API error: ${response.status} - ${errorText}`);
        }

        return response.json();
    } catch (error) {
        console.error('[FastSimon API] Request failed:', error);
        throw error;
    }
}

/**
 * Extract product IDs from Fast Simon widget response
 * Fast Simon returns full product objects — we extract IDs to hydrate via GraphQL.
 * @param {Object} widgetResponse - A single widget_response from the API
 * @returns {number[]} Array of product IDs
 */
function extractProductIdsFromWidgetResponse(widgetResponse) {
    // Fast Simon response shape can vary — try all known locations
    const items = widgetResponse?.payload
        || widgetResponse?.items
        || widgetResponse?.products
        || widgetResponse?.data
        || [];

    return items
        .map(item => {
            // Fast Simon may return `id` as string or number
            const id = parseInt(item.id || item.product_id || item.entityId, 10);
            return Number.isNaN(id) ? null : id;
        })
        .filter(Boolean);
}

/**
 * Fetch products from BigCommerce Storefront GraphQL API
 * @param {number[]} productIds - Array of product entity IDs
 * @param {string} token - Storefront API token
 * @param {string} currencyCode - Currency code (e.g., 'EUR')
 * @returns {Promise<Object>} { products, currency }
 */
async function fetchProductsByIds(productIds, token, currencyCode = 'EUR') {
    if (!productIds || productIds.length === 0) {
        return { products: [], currency: null };
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
            console.error('[FastSimon] GraphQL errors:', data.errors);
            throw new Error('GraphQL query returned errors');
        }

        const products = data.data.site.products.edges.map(edge => edge.node);
        const currency = data.data.site.currency;

        // Maintain the order from Fast Simon (most relevant first)
        const productMap = new Map(products.map(p => [p.entityId, p]));
        const orderedProducts = productIds
            .map(id => productMap.get(parseInt(id, 10)))
            .filter(Boolean);

        return { products: orderedProducts, currency };
    } catch (error) {
        console.error('[FastSimon] Error fetching products from GraphQL:', error);
        return { products: [], currency: null };
    }
}

/**
 * Format price for display using Intl.NumberFormat
 * @param {Object} priceObj - Price object from GraphQL
 * @param {Object} currency - Currency display settings
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted price string
 */
function formatPrice(priceObj, currency, currencyCode = 'EUR') {
    if (!priceObj || priceObj.value == null) return '';

    const code = priceObj.currencyCode || currencyCode;

    try {
        return new Intl.NumberFormat('en-IE', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: currency?.display?.decimalPlaces ?? 2,
            maximumFractionDigits: currency?.display?.decimalPlaces ?? 2,
        }).format(priceObj.value);
    } catch (e) {
        const symbol = currency?.display?.symbol || '€';
        const decimals = currency?.display?.decimalPlaces ?? 2;
        const value = priceObj.value.toFixed(decimals);
        const parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return `${symbol}${parts.join('.')}`;
    }
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
    return document.getElementById('fastsimon-product-card-template');
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
 * Render a product card using the DOM template
 * @param {Object} product - Product data from GraphQL
 * @param {Object} currency - Currency display settings
 * @param {Object} options - Rendering options
 * @returns {HTMLElement} Cloned and populated card element
 */
function renderProductCard(product, currency, options = {}) {
    const {
        showRating = true,
        showQuickView = true,
        ctaText = 'Shop Now',
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
    const displayPrice = prices.price;
    const displaySalePrice = prices.salePrice;
    const displayPriceRange = prices.priceRange;
    const hasSalePrice = displaySalePrice?.value && displaySalePrice.value < displayPrice?.value;
    const ratingPercentage = calculateRatingPercentage(product.reviewSummary);
    const numberOfReviews = product.reviewSummary?.numberOfReviews || 0;

    // Set card data attributes
    card.setAttribute('data-test', `card-${product.entityId}`);
    card.setAttribute('data-entity-id', product.entityId);
    card.setAttribute('data-name', product.name);
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

    // Price (using tax-inclusive prices)
    const priceContainer = card.querySelector('.card-price');
    if (hasSalePrice) {
        priceContainer.innerHTML = `
            <span class="price-section price-section--withTax non-sale-price--withTax">
                <span data-product-non-sale-price-with-tax class="price price--non-sale">${formatPrice(displayPrice, currency)}</span>
            </span>
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${formatPrice(displaySalePrice, currency)}</span>
            </span>
        `;
    } else if (displayPrice?.value) {
        priceContainer.innerHTML = `
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${formatPrice(displayPrice, currency)}</span>
            </span>
        `;
    } else if (displayPriceRange?.min?.value) {
        const minPrice = displayPriceRange.min.value;
        const maxPrice = displayPriceRange.max?.value ?? minPrice;
        const code = displayPrice?.currencyCode || 'EUR';
        const minFormatted = formatPrice({ value: minPrice, currencyCode: code }, currency);
        const maxFormatted = formatPrice({ value: maxPrice, currencyCode: code }, currency);

        priceContainer.innerHTML = `
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${minPrice !== maxPrice ? `${minFormatted} - ${maxFormatted}` : minFormatted}</span>
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

    actionsContainer.innerHTML = actionsHtml;

    // CTA button link
    const ctaLink = card.querySelector('.card-cta');
    if (ctaLink) {
        ctaLink.setAttribute('href', product.path);
        ctaLink.textContent = ctaText;
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
        showQuickView = true,
        ctaText = 'Shop Now',
    } = options;

    const hasOptions = product.productOptions?.edges?.length > 0;
    const isInStock = product.inventory?.isInStock !== false;
    const stockLevel = product.inventory?.aggregated?.availableToSell ?? 999;

    const prices = product.prices || {};
    const displayPrice = prices.price;
    const displaySalePrice = prices.salePrice;
    const displayPriceRange = prices.priceRange;
    const hasSalePrice = displaySalePrice?.value && displaySalePrice.value < displayPrice?.value;

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

    // Price HTML
    let priceHtml = '';
    if (hasSalePrice) {
        priceHtml = `
            <span class="price-section price-section--withTax non-sale-price--withTax">
                <span data-product-non-sale-price-with-tax class="price price--non-sale">${formatPrice(displayPrice, currency)}</span>
            </span>
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${formatPrice(displaySalePrice, currency)}</span>
            </span>
        `;
    } else if (displayPrice?.value) {
        priceHtml = `
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${formatPrice(displayPrice, currency)}</span>
            </span>
        `;
    } else if (displayPriceRange?.min?.value) {
        const minPrice = displayPriceRange.min.value;
        const maxPrice = displayPriceRange.max?.value ?? minPrice;
        const code = displayPrice?.currencyCode || 'EUR';
        const minFormatted = formatPrice({ value: minPrice, currencyCode: code }, currency);
        const maxFormatted = formatPrice({ value: maxPrice, currencyCode: code }, currency);

        priceHtml = `
            <span class="price-section price-section--withTax">
                <span data-product-price-with-tax class="price price--withTax">${minPrice !== maxPrice ? `${minFormatted} - ${maxFormatted}` : minFormatted}</span>
            </span>
        `;
    }

    // Actions HTML
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
>
            <figure class="card-figure">
                ${badgeHtml}
                <a href="${product.path}"
                   class="card-figure__link"
                   aria-label="${escapeHtml(product.name)}"
                   data-event-type="product-click">
                    <div class="card-img-container">
                        <img class="card-image lazyload"
                             src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
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
                <h3 class="card-title">
                    <a href="${product.path}" data-event-type="product-click">
                        ${escapeHtml(product.name)}
                    </a>
                </h3>
                <div class="card-text card-price" data-test-info-type="price">
                    ${priceHtml}
                </div>
                <a href="${product.path}" class="card-cta" data-event-type="product-click">${escapeHtml(ctaText)}</a>
            </div>
        </article>
    `;

    const temp = document.createElement('div');
    temp.innerHTML = htmlString.trim();
    return temp.firstChild;
}

/**
 * Report a recommendation widget viewed event to Fast Simon
 * @param {Object} context - Theme context
 * @param {string|number} productId - Product ID of the page (if PDP)
 * @param {string} sources - Recommendation sources string
 */
function reportWidgetViewed(context, productId, sources) {
    if (!context.fastsimonStoreId || !context.fastsimonUuid) return;

    const token = getOrCreateIspToken();
    const session = getSessionTimestamp();

    const url = new URL('https://ping.fastsimon.com/post_load');
    url.searchParams.set('store_id', context.fastsimonStoreId);
    url.searchParams.set('UUID', context.fastsimonUuid);
    url.searchParams.set('st', token);
    url.searchParams.set('session', session.toString());
    url.searchParams.set('found_related', '1');

    if (productId) {
        url.searchParams.set('id', productId.toString());
    }
    if (sources) {
        url.searchParams.set('related_sources', sources);
    }

    // Fire and forget — non-blocking
    fetch(url.toString()).catch(() => {});
}

/**
 * Initialize a Fast Simon recommendation container
 * @param {HTMLElement} container - Container element with data-fastsimon-* attributes
 * @param {Object} context - Theme context
 */
async function initFastSimonRecommendation(container, context) {
    const {
        fastsimonWidgetId,
        fastsimonProductId,
        fastsimonCategoryId,
        fastsimonProducts,
        fastsimonLimit = '8',
        fastsimonCtaText = 'Shop Now',
    } = container.dataset;
    const limit = parseInt(fastsimonLimit, 10);

    if (!context.fastsimonStoreId || !context.fastsimonUuid) {
        console.warn('[FastSimon] Store ID or UUID not configured');
        return;
    }

    if (!fastsimonWidgetId) {
        console.warn('[FastSimon] No widget ID specified on container');
        return;
    }

    if (!context.storefrontApiToken) {
        console.error('[FastSimon] Storefront API token not available');
        return;
    }

    // Show loading state
    container.classList.add('is-loading');

    try {
        // Build API params
        const apiParams = {
            storeId: context.fastsimonStoreId,
            uuid: context.fastsimonUuid,
            widgetIds: [fastsimonWidgetId],
        };

        if (fastsimonProductId) {
            apiParams.productId = fastsimonProductId;
        }

        if (fastsimonCategoryId) {
            apiParams.categoryId = fastsimonCategoryId;
        }

        if (fastsimonProducts) {
            apiParams.products = fastsimonProducts.split(',').map(id => id.trim());
        }

        // Call Fast Simon API
        const fsResponse = await callFastSimonRecommendations(apiParams);

        // Extract product IDs from the first widget response
        const widgetResponse = fsResponse?.widget_responses?.[0];
        let productIds = extractProductIdsFromWidgetResponse(widgetResponse);

        if (productIds.length === 0) {
            container.innerHTML = '';
            container.classList.remove('is-loading');
            container.classList.add('is-empty');
            container.closest('.c-fsRecommendations')?.classList.add('is-empty');
            return;
        }

        // Limit results
        productIds = productIds.slice(0, limit);

        // Fetch full product data from BigCommerce GraphQL
        const { products, currency } = await fetchProductsByIds(
            productIds,
            context.storefrontApiToken,
            context.currencyCode || 'EUR',
        );

        if (products.length === 0) {
            container.innerHTML = '';
            container.classList.remove('is-loading');
            container.classList.add('is-empty');
            container.closest('.c-fsRecommendations')?.classList.add('is-empty');
            return;
        }

        // Create product grid
        const productGrid = document.createElement('div');
        productGrid.className = 'productGrid fs-product-grid';

        // Render product cards
        products.forEach(product => {
            const cardEl = renderProductCard(product, currency, {
                showRating: true,
                showQuickView: context.showQuickView !== false,
                ctaText: fastsimonCtaText,
            });
            productGrid.appendChild(cardEl);
        });

        // Remove skeleton, add product grid
        const skeletonGrid = container.querySelector('.fs-skeleton-grid');
        if (skeletonGrid) {
            skeletonGrid.remove();
        }
        container.appendChild(productGrid);

        container.classList.remove('is-loading');
        container.classList.add('is-loaded');
        container.closest('.c-fsRecommendations')?.classList.add('is-loaded');

        // Initialize slick carousel if jQuery + slick available
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

        // Report widget viewed event to Fast Simon
        reportWidgetViewed(context, fastsimonProductId, fastsimonWidgetId);
    } catch (error) {
        console.error('[FastSimon] Error loading recommendations:', error);
        container.innerHTML = '';
        container.classList.remove('is-loading');
        container.classList.add('is-error');
        container.closest('.c-fsRecommendations')?.classList.add('is-error');
    }
}

/**
 * Initialize all Fast Simon recommendation containers on the page
 * @param {Object} context - Theme context
 */
function initAllFastSimonRecommendations(context) {
    if (!context.fastsimonEnabled) {
        return;
    }

    const containers = document.querySelectorAll('[data-fastsimon-container]');
    containers.forEach(container => {
        initFastSimonRecommendation(container, context);
    });
}

export {
    initFastSimonRecommendation,
    initAllFastSimonRecommendations,
    fetchProductsByIds,
    renderProductCard,
    callFastSimonRecommendations,
    getOrCreateIspToken,
    getSessionTimestamp,
};
