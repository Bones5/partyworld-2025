/**
 * Newsletter signup form handler
 *
 * Provides client-side validation and accessible error messaging
 * for the newsletter subscription form.
 */
export default class Newsletter {
    constructor($form) {
        this.$form = $form;
        this.$input = $form.find('[name="nl_email"]');
        this.$field = $form.find('[data-newsletter-field]');
        this.$message = $form.find('[data-newsletter-message]');
        this.$formElement = $form.find('[data-newsletter-form-element]');
        this.$success = $form.find('[data-newsletter-success]');

        this.bindEvents();
    }

    /**
     * Bind form submission and input events
     */
    bindEvents() {
        this.$formElement.on('submit', (event) => this.onSubmit(event));
        this.$input.on('blur', () => this.validateEmail());
        this.$input.on('input', () => this.clearError());
    }

    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    onSubmit(event) {
        event.preventDefault();

        if (!this.validateEmail()) {
            return;
        }

        // Submit form via AJAX
        const formData = new FormData(this.$formElement[0]);
        const action = this.$formElement.attr('action');

        fetch(action, {
            method: 'POST',
            body: formData,
        })
            .then((response) => {
                if (response.ok) {
                    this.showSuccess();
                } else {
                    this.showError('newsletter.subscribe_error');
                }
            })
            .catch(() => {
                this.showError('newsletter.subscribe_error');
            });
    }

    /**
     * Validate email input
     * Uses the browser's built-in email validation via checkValidity()
     * as the input has type="email"
     * @returns {boolean} - True if valid, false otherwise
     */
    validateEmail() {
        const email = this.$input.val().trim();
        const inputElement = this.$input[0];

        // Empty check
        if (!email) {
            this.showError('newsletter.email_required');
            return false;
        }

        // Use browser's built-in email validation
        if (!inputElement.checkValidity()) {
            this.showError('newsletter.email_invalid');
            return false;
        }

        this.clearError();
        return true;
    }

    /**
     * Show error message and apply error state
     * @param {string} messageKey - i18n key for error message
     */
    showError(messageKey) {
        this.$field.addClass('newsletter-form-field--error');
        this.$field.removeClass('newsletter-form-field--success');
        this.$input.attr('aria-invalid', 'true');

        // Use stencil-utils for i18n if available, otherwise use fallback
        const message = this.getMessage(messageKey);
        this.$message.text(message);
        this.$message.addClass('newsletter-message--error');
        this.$message.removeClass('newsletter-message--success');
    }

    /**
     * Clear error state
     */
    clearError() {
        this.$field.removeClass('newsletter-form-field--error');
        this.$input.attr('aria-invalid', 'false');
        this.$message.text('');
        this.$message.removeClass('newsletter-message--error newsletter-message--success');
    }

    /**
     * Show success state
     */
    showSuccess() {
        this.$formElement.addClass('newsletter-form--hidden');
        this.$success.addClass('newsletter-success--visible');
        this.$field.addClass('newsletter-form-field--success');
        this.$field.removeClass('newsletter-form-field--error');
    }

    /**
     * Get localized message
     * @param {string} key - Message key
     * @returns {string} - Translated message or fallback
     */
    getMessage(key) {
        // Fallback messages - in Stencil, the actual translation happens
        // server-side in the template via {{lang}} helper. These fallbacks
        // are used only if JavaScript needs to display a message dynamically.
        const fallbacks = {
            'newsletter.email_required': 'Please enter your email address.',
            'newsletter.email_invalid': 'Please enter a valid email address.',
            'newsletter.subscribe_error': 'There was an error subscribing. Please try again.',
            'newsletter.subscribe_success': 'Thank you for subscribing!',
        };

        return fallbacks[key] || key;
    }
}

/**
 * Initialize newsletter forms on the page
 */
export function initNewsletter() {
    const $forms = $('[data-newsletter-form]');

    $forms.each((index, form) => {
        const newsletter = new Newsletter($(form));
        return newsletter;
    });
}
