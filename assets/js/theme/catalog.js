import Url from 'url';
import _ from 'lodash';
import PageManager from './page-manager';
import urlUtils from './common/utils/url-utils';

export default class CatalogPage extends PageManager {
    constructor(context) {
        super(context);

        this.requestOptions = null; // Will be set by child classes

        window.addEventListener('beforeunload', () => {
            if (document.activeElement.id === 'sort') {
                window.localStorage.setItem('sortByStatus', 'selected');
            }
        });
    }

    arrangeFocusOnSortBy() {
        const $sortBySelector = $('[data-sort-by="product"] #sort');

        if (window.localStorage.getItem('sortByStatus')) {
            $sortBySelector.trigger('focus');
            window.localStorage.removeItem('sortByStatus');
        }
    }

    initFilterControls() {
        const urlParams = new URLSearchParams(window.location.search);

        // Populate search query from URL
        const searchQuery = urlParams.get('search_query') || '';
        const $searchInput = $('[data-filter-search]');
        const $clearButton = $('[data-filter-clear]');

        $searchInput.val(searchQuery);

        // Populate limit from URL (default to theme setting or 12)
        const limit = urlParams.get('limit') || this.context?.categoryProductsPerPage || 12;
        $('[data-filter-limit]').val(limit);

        // Populate page selector
        this.initPageSelector();

        // Handle products per page (limit) change
        const $limitSelect = $('[data-filter-limit]');
        $limitSelect.on('change', (event) => {
            event.preventDefault(); // Prevent stencil-utils sortBy hook from firing
            event.stopPropagation();
            this.onLimitChange(event);
        });

        // Handle page change
        const $pageSelect = $('[data-filter-page]');
        $pageSelect.on('change', (event) => {
            event.preventDefault(); // Prevent stencil-utils sortBy hook from firing
            event.stopPropagation();
            this.onPageChange(event);
        });

        // Handle real-time text filtering (debounced)
        const debouncedFilter = _.debounce((query) => this.filterProducts(query), 300);

        $searchInput.on('input', (event) => {
            const query = $(event.currentTarget).val();
            this.toggleClearButton(query);
            debouncedFilter(query);
        });

        // Handle clear button click
        $clearButton.on('click', () => {
            $searchInput.val('').trigger('focus');
            this.toggleClearButton('');
            this.filterProducts('');
        });

        // Handle text filter form submission
        const $filterForm = $('[data-product-filter]');
        $filterForm.on('submit', (event) => {
            event.preventDefault();
            const query = $searchInput.val();
            this.filterProducts(query);
        });

        // Apply initial filter if search_query exists in URL
        if (searchQuery) {
            this.toggleClearButton(searchQuery);
        }
    }

    initPageSelector() {
        const $pageSelect = $('[data-filter-page]');
        if (!$pageSelect.length) return;

        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page'), 10) || 1;

        // Get total pages from pagination data attribute or DOM
        const $pagination = $('.pagination');
        let totalPages = 1;

        if ($pagination.length) {
            // Try to get from last page link
            const $lastPageLink = $pagination.find('.pagination-item:not(.pagination-item--next):not(.pagination-item--previous)').last().find('a');
            if ($lastPageLink.length) {
                const lastPageText = $lastPageLink.text().trim();
                const lastPageNum = parseInt(lastPageText, 10);
                if (!isNaN(lastPageNum)) {
                    totalPages = lastPageNum;
                }
            }
        }

        // Build page options
        $pageSelect.empty();
        for (let i = 1; i <= totalPages; i++) {
            const $option = $('<option></option>').val(i).text(i);
            if (i === currentPage) {
                $option.attr('selected', 'selected');
            }
            $pageSelect.append($option);
        }
    }

    toggleClearButton(query) {
        const $clearButton = $('[data-filter-clear]');
        if (query && query.length > 0) {
            $clearButton.addClass('is-visible');
        } else {
            $clearButton.removeClass('is-visible');
        }
    }

    filterProducts(query) {
        // Build URL with search query
        const url = Url.parse(window.location.href, true);

        if (query && query.trim()) {
            url.query.search_query = query.trim();
        } else {
            delete url.query.search_query;
        }

        // Reset to page 1 when searching
        delete url.query.page;

        const newUrl = Url.format({ pathname: url.pathname, search: urlUtils.buildQueryString(url.query) });

        // Use urlUtils.goToUrl which triggers statechange - FacetedSearch listens to this
        // and will handle the AJAX update
        urlUtils.goToUrl(newUrl);
    }

    reinitFilterControls(currentQuery) {
        // Re-populate the search input after AJAX update
        const $searchInput = $('[data-filter-search]');
        const $clearButton = $('[data-filter-clear]');

        // Set values without triggering events
        $searchInput[0].value = currentQuery || '';
        this.toggleClearButton(currentQuery || '');

        // Re-bind events for new elements
        const urlParams = new URLSearchParams(window.location.search);
        const limit = urlParams.get('limit') || this.context?.categoryProductsPerPage || 12;

        // Set limit value without triggering change event
        const $limitSelect = $('[data-filter-limit]');
        if ($limitSelect.length && $limitSelect[0]) {
            $limitSelect[0].value = limit;
        }

        // Re-bind limit select handler
        $limitSelect.off('change').on('change', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.onLimitChange(event);
        });

        // Re-bind page select handler
        const $pageSelect = $('[data-filter-page]');
        $pageSelect.off('change').on('change', (event) => {
            event.preventDefault();
            event.stopPropagation();
            this.onPageChange(event);
        });

        // Re-bind text filter handlers
        const debouncedFilter = _.debounce((query) => this.filterProducts(query), 300);

        $searchInput.off('input').on('input', (event) => {
            const query = $(event.currentTarget).val();
            this.toggleClearButton(query);
            debouncedFilter(query);
        });

        // Re-bind clear button
        $clearButton.off('click').on('click', () => {
            $searchInput.val('').trigger('focus');
            this.toggleClearButton('');
            this.filterProducts('');
        });

        // Re-bind form submission
        const $filterForm = $('[data-product-filter]');
        $filterForm.off('submit').on('submit', (event) => {
            event.preventDefault();
            const query = $searchInput.val();
            this.filterProducts(query);
        });

        // Re-init page selector
        this.initPageSelector();
    }

    announceFilterResults(query) {
        const $products = $('.productGrid .product, .productList .product');
        const count = $products.length;

        // Create or update live region for screen reader announcement
        let $liveRegion = $('#filter-live-region');
        if (!$liveRegion.length) {
            $liveRegion = $('<div id="filter-live-region" class="u-hiddenVisually" aria-live="polite" aria-atomic="true"></div>');
            $('body').append($liveRegion);
        }

        if (query) {
            $liveRegion.text(`Found ${count} products matching "${query}"`);
        } else {
            $liveRegion.text('Showing all products');
        }
    }

    onLimitChange(event) {
        const url = Url.parse(window.location.href, true);
        const limit = $(event.currentTarget).val();

        url.query.limit = limit;
        delete url.query.page; // Reset to first page when changing limit

        event.preventDefault();

        const newUrl = Url.format({ pathname: url.pathname, search: urlUtils.buildQueryString(url.query) });
        urlUtils.goToUrl(newUrl);
    }

    onPageChange(event) {
        const url = Url.parse(window.location.href, true);
        const page = $(event.currentTarget).val();

        url.query.page = page;

        event.preventDefault();

        const newUrl = Url.format({ pathname: url.pathname, search: urlUtils.buildQueryString(url.query) });
        urlUtils.goToUrl(newUrl);
    }

    onSortBySubmit(event, currentTarget) {
        const url = Url.parse(window.location.href, true);
        const queryParams = $(currentTarget).serialize().split('=');

        url.query[queryParams[0]] = queryParams[1];
        delete url.query.page;

        event.preventDefault();

        const newUrl = Url.format({ pathname: url.pathname, search: urlUtils.buildQueryString(url.query) });
        urlUtils.goToUrl(newUrl);
    }
}
