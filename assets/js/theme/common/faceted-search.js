import { hooks, api } from "@bigcommerce/stencil-utils";
import _ from "lodash";
import Url from "url";
import urlUtils from "./utils/url-utils";
import modalFactory from "../global/modal";
import collapsibleFactory from "./collapsible";
import { Validators } from "./utils/form-utils";
import nod from "./nod";

const defaultOptions = {
  accordionToggleSelector:
    "#facetedSearch .accordion-navigation, #facetedSearch .facetedSearch-toggle",
  blockerSelector: "#facetedSearch .blocker",
  clearFacetSelector: "#facetedSearch .facetedSearch-clearLink",
  componentSelector: "#facetedSearch-navList",
  facetNavListSelector: "#facetedSearch .navList",
  priceRangeErrorSelector: "#facet-range-form .form-inlineMessage",
  priceRangeFieldsetSelector: "#facet-range-form .form-fieldset",
  priceRangeFormSelector: "#facet-range-form",
  priceRangeMaxPriceSelector: $("#facetedSearch").length
    ? "#facet-range-form [name=max_price]"
    : "#facet-range-form [name=price_max]",
  priceRangeMinPriceSelector: $("#facetedSearch").length
    ? "#facet-range-form [name=min_price]"
    : "#facet-range-form [name=price_min]",
  showMoreToggleSelector: "#facetedSearch .accordion-content .toggleLink",
  facetedSearchFilterItems: "#facetedSearch-filterItems .form-input",
  modal: modalFactory("#modal")[0],
  modalOpen: false,
};

/**
 * Returns the currency symbol for a given ISO 4217 currency code using Intl.NumberFormat.
 * Falls back to an empty string if the code is invalid or the API is unavailable.
 *
 * @param {string} currencyCode - e.g. "USD", "GBP", "EUR"
 * @returns {string} e.g. "$", "£", "€"
 */
function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return "";
  try {
    const parts = Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    const part = parts.find((p) => p.type === "currency");
    return part ? part.value : "";
  } catch (e) {
    return "";
  }
}

/**
 * Faceted search view component
 */
class FacetedSearch {
  /**
   * @param {object} requestOptions - Object with options for the ajax requests
   * @param {function} callback - Function to execute after fetching templates
   * @param {object} options - Configurable options
   * @example
   *
   * let requestOptions = {
   *      templates: {
   *          productListing: 'category/product-listing',
   *          sidebar: 'category/sidebar'
   *     }
   * };
   *
   * let templatesDidLoad = function(content) {
   *     $productListingContainer.html(content.productListing);
   *     $facetedSearchContainer.html(content.sidebar);
   * };
   *
   * let facetedSearch = new FacetedSearch(requestOptions, templatesDidLoad);
   */
  constructor(requestOptions, callback, options) {
    // Private properties
    this.requestOptions = requestOptions;
    this.callback = callback;
    this.options = _.extend({}, defaultOptions, options);
    this.collapsedFacets = [];
    this.collapsedFacetItems = [];

    // Init collapsibles
    collapsibleFactory();

    // Init price validator
    this.initPriceValidator();

    // Derive currency symbol from ISO code stored in the range form's data attribute.
    const currencyCode = $("#facet-range-form").data("currencyCode") || "";
    this.currencySymbol = getCurrencySymbol(currencyCode);
    this.applyCurrencyPrefixSymbol();

    // Pre-populate price inputs from URL params on initial page load
    const initParams = new URLSearchParams(window.location.search);
    const initMin =
      initParams.get("price_min") || initParams.get("min_price") || "";
    const initMax =
      initParams.get("price_max") || initParams.get("max_price") || "";
    if (initMin || initMax) {
      $('input[name="price_min"], input[name="min_price"]')
        .val(initMin)
        .attr("value", initMin);
      $('input[name="price_max"], input[name="max_price"]')
        .val(initMax)
        .attr("value", initMax);
    }

    // Inject selected price range into selected facets UI.
    this.renderSelectedPriceFacet();
    this.updatePriceResetVisibility();

    // Show limited items by default
    $(this.options.facetNavListSelector).each((index, navList) => {
      this.collapseFacetItems($(navList));
    });

    // Mark initially collapsed accordions
    $(this.options.accordionToggleSelector).each((index, accordionToggle) => {
      const $accordionToggle = $(accordionToggle);
      const collapsible = $accordionToggle.data("collapsibleInstance");

      if (collapsible.isCollapsed) {
        this.collapsedFacets.push(collapsible.targetId);
      }
    });

    // Collapse all facets if initially hidden
    // NOTE: Need to execute after Collapsible gets bootstrapped
    setTimeout(() => {
      if ($(this.options.componentSelector).is(":hidden")) {
        this.collapseAllFacets();
      }
    });

    // Observe user events
    this.onStateChange = this.onStateChange.bind(this);
    this.onToggleClick = this.onToggleClick.bind(this);
    this.onAccordionToggle = this.onAccordionToggle.bind(this);
    this.onClearFacet = this.onClearFacet.bind(this);
    this.onFacetClick = this.onFacetClick.bind(this);
    this.onRangeSubmit = this.onRangeSubmit.bind(this);
    this.onSortBySubmit = this.onSortBySubmit.bind(this);
    this.filterFacetItems = this.filterFacetItems.bind(this);

    this.bindEvents();
  }

  // Public methods
  refreshView(content) {
    if (content) {
      this.callback(content);
    }

    // Init collapsibles
    collapsibleFactory();

    // Init price validator
    this.initPriceValidator();

    // Re-apply currency prefix symbol to inputs (sidebar is re-rendered on each AJAX refresh).
    this.applyCurrencyPrefixSymbol();

    // Keep selected price range visible after faceted-content refreshes.
    this.renderSelectedPriceFacet();
    this.updatePriceResetVisibility();

    // Restore view state
    this.restoreCollapsedFacets();
    this.restoreCollapsedFacetItems();

    // Bind events
    this.bindEvents();
  }

  updateView() {
    $(this.options.blockerSelector).show();

    api.getPage(urlUtils.getUrl(), this.requestOptions, (err, content) => {
      $(this.options.blockerSelector).hide();

      if (err) {
        throw new Error(err);
      }

      // Refresh view with new content
      this.refreshView(content);

      // Refresh range view when shop-by-price enabled
      const urlParams = new URLSearchParams(window.location.search);
      const minValue =
        urlParams.get("price_min") || urlParams.get("min_price") || "";
      const maxValue =
        urlParams.get("price_max") || urlParams.get("max_price") || "";

      $('input[name="price_min"], input[name="min_price"]')
        .val(minValue)
        .attr("value", minValue);
      $('input[name="price_max"], input[name="max_price"]')
        .val(maxValue)
        .attr("value", maxValue);

      this.updatePriceResetVisibility();
    });
  }

  /**
   * Populates the `.form-currencyPrefix` spans inside the price range form
   * with the derived currency symbol (e.g. "$"). Called on init and after each
   * AJAX sidebar refresh since the form is re-rendered.
   */
  applyCurrencyPrefixSymbol() {
    if (this.currencySymbol) {
      $(".form-currencyPrefix").text(this.currencySymbol);
    }
  }

  expandFacetItems($navList) {
    const id = $navList.attr("id");

    // Remove
    this.collapsedFacetItems = _.without(this.collapsedFacetItems, id);
  }

  collapseFacetItems($navList) {
    const id = $navList.attr("id");
    const hasMoreResults = $navList.data("hasMoreResults");

    if (hasMoreResults) {
      this.collapsedFacetItems = _.union(this.collapsedFacetItems, [id]);
    } else {
      this.collapsedFacetItems = _.without(this.collapsedFacetItems, id);
    }
  }

  toggleFacetItems($navList) {
    const id = $navList.attr("id");

    // Toggle depending on `collapsed` flag
    if (this.collapsedFacetItems.includes(id)) {
      this.getMoreFacetResults($navList);

      return true;
    }

    this.collapseFacetItems($navList);

    return false;
  }

  getMoreFacetResults($navList) {
    const facet = $navList.data("facet");
    const facetUrl = urlUtils.getUrl();

    if (this.requestOptions.showMore) {
      api.getPage(
        facetUrl,
        {
          template: this.requestOptions.showMore,
          params: {
            list_all: facet,
          },
        },
        (err, response) => {
          if (err) {
            throw new Error(err);
          }

          this.options.modal.open();
          this.options.modalOpen = true;
          this.options.modal.updateContent(response);
        },
      );
    }

    this.collapseFacetItems($navList);

    return false;
  }

  filterFacetItems(event) {
    const $items = $(".navList-item");
    const query = $(event.currentTarget).val().toLowerCase();

    $items.each((index, element) => {
      const text = $(element).text().toLowerCase();
      if (text.indexOf(query) !== -1) {
        $(element).show();
      } else {
        $(element).hide();
      }
    });
  }

  expandFacet($accordionToggle) {
    const collapsible = $accordionToggle.data("collapsibleInstance");

    collapsible.open();
  }

  collapseFacet($accordionToggle) {
    const collapsible = $accordionToggle.data("collapsibleInstance");

    collapsible.close();
  }

  collapseAllFacets() {
    const $accordionToggles = $(this.options.accordionToggleSelector);

    $accordionToggles.each((index, accordionToggle) => {
      const $accordionToggle = $(accordionToggle);

      this.collapseFacet($accordionToggle);
    });
  }

  expandAllFacets() {
    const $accordionToggles = $(this.options.accordionToggleSelector);

    $accordionToggles.each((index, accordionToggle) => {
      const $accordionToggle = $(accordionToggle);

      this.expandFacet($accordionToggle);
    });
  }

  // Private methods
  initPriceValidator() {
    if ($(this.options.priceRangeFormSelector).length === 0) {
      return;
    }

    const validator = nod();
    const selectors = {
      errorSelector: this.options.priceRangeErrorSelector,
      fieldsetSelector: this.options.priceRangeFieldsetSelector,
      formSelector: this.options.priceRangeFormSelector,
      maxPriceSelector: this.options.priceRangeMaxPriceSelector,
      minPriceSelector: this.options.priceRangeMinPriceSelector,
    };

    Validators.setMinMaxPriceValidation(
      validator,
      selectors,
      this.options.validationErrorMessages,
    );

    this.priceRangeValidator = validator;
  }

  getSelectedPriceRangeState() {
    const params = new URLSearchParams(window.location.search);
    let minPrice = params.get("price_min") || params.get("min_price");
    let maxPrice = params.get("price_max") || params.get("max_price");

    // Fall back to current range form values for states where URL params are not present.
    if (!minPrice && !maxPrice) {
      const inputMin =
        $("#facet-range-form [name='price_min']").val() ||
        $("#facet-range-form [name='min_price']").val();
      const inputMax =
        $("#facet-range-form [name='price_max']").val() ||
        $("#facet-range-form [name='max_price']").val();

      minPrice = inputMin ? String(inputMin).trim() : "";
      maxPrice = inputMax ? String(inputMax).trim() : "";
    }

    if (!minPrice && !maxPrice) {
      return null;
    }

    const clearUrl = new URL(window.location.href);

    [
      "price_min",
      "price_max",
      "min_price",
      "max_price",
      "price",
      "page",
    ].forEach((key) => {
      clearUrl.searchParams.delete(key);
    });

    const rangeLabel = (() => {
      const currencySymbol = this.currencySymbol || "";

      if (minPrice && maxPrice) {
        return `${currencySymbol}${minPrice} - ${currencySymbol}${maxPrice}`;
      }

      if (minPrice) {
        return `${currencySymbol}${minPrice}+`;
      }

      return `Up to ${currencySymbol}${maxPrice}`;
    })();

    return {
      clearUrl: `${clearUrl.pathname}${clearUrl.search}`,
      label: rangeLabel,
    };
  }

  renderSelectedPriceFacet() {
    const $selectedFacetsContainer = $(".facetedSearch-refineFilters");

    if ($selectedFacetsContainer.length === 0) {
      return;
    }

    const $existingCustomItem = $selectedFacetsContainer
      .find(".facetLabel--priceRange")
      .closest("li");
    $existingCustomItem.remove();

    const selectedPrice = this.getSelectedPriceRangeState();

    if (!selectedPrice) {
      return;
    }

    let $list = $selectedFacetsContainer.find(".inlineList--labels");

    if ($list.length === 0) {
      $list = $('<ul class="inlineList inlineList--labels"></ul>');
      $selectedFacetsContainer.find("p").remove();
      const $clearAllLink = $selectedFacetsContainer
        .find(".facetedSearch-refineFilters-clearAll")
        .first();

      if ($clearAllLink.length > 0) {
        $clearAllLink.before($list);
      } else {
        $selectedFacetsContainer.append($list);
      }
    }

    const $priceFacetItem = $(
      `<li>
                <a href="${selectedPrice.clearUrl}" class="facetLabel facetLabel--priceRange" rel="nofollow" data-faceted-search-facet>
                    ${_.escape(selectedPrice.label)}
                    <svg class="icon">
                        <use href="#icon-close"></use>
                    </svg>
                </a>
            </li>`,
    );

    $list.append($priceFacetItem);
  }

  updatePriceResetVisibility() {
    const hasSelectedPrice = !!this.getSelectedPriceRangeState();
    $(".reset-filters").css("display", hasSelectedPrice ? "flex" : "none");
  }

  restoreCollapsedFacetItems() {
    const $navLists = $(this.options.facetNavListSelector);

    // Restore collapsed state for each facet
    $navLists.each((index, navList) => {
      const $navList = $(navList);
      const id = $navList.attr("id");
      const shouldCollapse = this.collapsedFacetItems.includes(id);

      if (shouldCollapse) {
        this.collapseFacetItems($navList);
      } else {
        this.expandFacetItems($navList);
      }
    });
  }

  restoreCollapsedFacets() {
    const $accordionToggles = $(this.options.accordionToggleSelector);

    $accordionToggles.each((index, accordionToggle) => {
      const $accordionToggle = $(accordionToggle);
      const collapsible = $accordionToggle.data("collapsibleInstance");
      const id = collapsible.targetId;
      const shouldCollapse = this.collapsedFacets.includes(id);

      if (shouldCollapse) {
        this.collapseFacet($accordionToggle);
      } else {
        this.expandFacet($accordionToggle);
      }
    });
  }

  bindEvents() {
    // Clean-up
    this.unbindEvents();

    // DOM events
    $(window).on("statechange", this.onStateChange);
    $(window).on("popstate", this.onPopState);
    $(document).on(
      "click",
      this.options.showMoreToggleSelector,
      this.onToggleClick,
    );
    $(document).on(
      "toggle.collapsible",
      this.options.accordionToggleSelector,
      this.onAccordionToggle,
    );
    $(document).on(
      "keyup",
      this.options.facetedSearchFilterItems,
      this.filterFacetItems,
    );
    $(this.options.clearFacetSelector).on("click", this.onClearFacet);

    // Hooks
    hooks.on("facetedSearch-facet-clicked", this.onFacetClick);
    hooks.on("facetedSearch-range-submitted", this.onRangeSubmit);
    hooks.on("sortBy-submitted", this.onSortBySubmit);
  }

  unbindEvents() {
    // DOM events
    $(window).off("statechange", this.onStateChange);
    $(window).off("popstate", this.onPopState);
    $(document).off(
      "click",
      this.options.showMoreToggleSelector,
      this.onToggleClick,
    );
    $(document).off(
      "toggle.collapsible",
      this.options.accordionToggleSelector,
      this.onAccordionToggle,
    );
    $(document).off(
      "keyup",
      this.options.facetedSearchFilterItems,
      this.filterFacetItems,
    );
    $(this.options.clearFacetSelector).off("click", this.onClearFacet);

    // Hooks
    hooks.off("facetedSearch-facet-clicked", this.onFacetClick);
    hooks.off("facetedSearch-range-submitted", this.onRangeSubmit);
    hooks.off("sortBy-submitted", this.onSortBySubmit);
  }

  onClearFacet(event) {
    const $link = $(event.currentTarget);
    const url = $link.attr("href");

    event.preventDefault();
    event.stopPropagation();

    // Update URL
    urlUtils.goToUrl(url);
  }

  onToggleClick(event) {
    const $toggle = $(event.currentTarget);
    const $navList = $($toggle.attr("href"));

    // Prevent default
    event.preventDefault();

    // Toggle visible items
    this.toggleFacetItems($navList);
  }

  onFacetClick(event, currentTarget) {
    const $link = $(currentTarget);
    const url = $link.attr("href");

    event.preventDefault();

    $link.toggleClass("is-selected");

    // Update URL
    urlUtils.goToUrl(url);

    if (this.options.modalOpen) {
      this.options.modal.close();
    }
  }

  onSortBySubmit(event, currentTarget) {
    const url = Url.parse(window.location.href, true);
    const queryParams = $(currentTarget).serialize().split("=");

    url.query[queryParams[0]] = queryParams[1];
    delete url.query.page;

    // Url object `query` is not a traditional JavaScript Object on all systems, clone it instead
    const urlQueryParams = {};
    Object.assign(urlQueryParams, url.query);

    event.preventDefault();

    urlUtils.goToUrl(
      Url.format({
        pathname: url.pathname,
        search: urlUtils.buildQueryString(urlQueryParams),
      }),
    );
  }

  onRangeSubmit(event, currentTarget) {
    event.preventDefault();

    if (!this.priceRangeValidator.areAll(nod.constants.VALID)) {
      return;
    }

    const url = Url.parse(window.location.href, true);
    let queryParams = decodeURI($(currentTarget).serialize()).split("&");
    queryParams = urlUtils.parseQueryParams(queryParams);

    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        url.query[key] = queryParams[key];
      }
    }

    // Url object `query` is not a traditional JavaScript Object on all systems, clone it instead
    const urlQueryParams = {};
    Object.assign(urlQueryParams, url.query);

    urlUtils.goToUrl(
      Url.format({
        pathname: url.pathname,
        search: urlUtils.buildQueryString(urlQueryParams),
      }),
    );
  }

  onStateChange() {
    this.updateView();
  }

  onAccordionToggle(event) {
    const $accordionToggle = $(event.currentTarget);
    const collapsible = $accordionToggle.data("collapsibleInstance");
    const id = collapsible.targetId;

    if (collapsible.isCollapsed) {
      this.collapsedFacets = _.union(this.collapsedFacets, [id]);
    } else {
      this.collapsedFacets = _.without(this.collapsedFacets, id);
    }
  }

  onPopState() {
    if (document.location.hash !== "") return;

    $(window).trigger("statechange");
  }
}

export default FacetedSearch;
