import 'focus-within-polyfill';

import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import carousel from './common/carousel';
import svgInjector from './global/svg-injector';
import { initNewsletter } from './global/newsletter';
import { initAllClerkRecommendations } from './common/clerk-recommendations';
import riveLogo from './global/rive-logo';
import klaviyoNewsletter from './common/klaviyo-newsletter';

export default class Global extends PageManager {
    onReady() {
        const { cartId, secureBaseUrl } = this.context;
        cartPreview(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        svgInjector();
        initNewsletter();

        // Initialize Rive logo animation
        if (window.riveLogoSrc) {
            riveLogo(window.riveLogoSrc);
        }

        // Initialize Clerk.io recommendations if enabled
        if (this.context.clerkEnabled) {
            initAllClerkRecommendations(this.context);
        }

        // Initialize Klaviyo newsletter form (when using native form)
        klaviyoNewsletter();
    }
}
