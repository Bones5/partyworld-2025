/**
 * Klaviyo Newsletter Form Handler
 *
 * Handles newsletter subscriptions when using the native theme form
 * with Klaviyo's client-side API integration.
 *
 * @module klaviyo-newsletter
 */

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show a message to the user
 * @param {HTMLElement} element - Message container element
 * @param {string} message - Message text
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(element, message, type) {
    if (!element) return;

    const el = element;
    el.textContent = message;
    el.className = `newsletter-message newsletter-message--${type}`;
    el.style.display = 'block';

    // Hide message after 5 seconds for errors
    if (type === 'error') {
        setTimeout(() => {
            el.style.display = 'none';
        }, 5000);
    }
}

export default function klaviyoNewsletter() {
    const form = document.querySelector('[data-klaviyo-newsletter-form]');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput?.value?.trim();
        const messageDiv = form.querySelector('[data-newsletter-message]');
        const successDiv = form.closest('.newsletter')?.querySelector('[data-newsletter-success]');
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton?.textContent;

        // Validate email
        if (!email || !isValidEmail(email)) {
            showMessage(messageDiv, 'Please enter a valid email address.', 'error');
            return;
        }

        // Disable submit button during processing
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Subscribing...';
        }

        try {
            // Use Klaviyo's client-side API
            if (typeof window._learnq !== 'undefined') {
                // Identify the subscriber
                window._learnq.push(['identify', { $email: email }]);

                // Track subscription event
                window._learnq.push(['track', 'Newsletter Signup', {
                    source: 'footer',
                    $email: email,
                }]);

                // Show success message
                if (successDiv) {
                    form.style.display = 'none';
                    successDiv.style.display = 'block';
                } else {
                    showMessage(messageDiv, 'Thank you for subscribing to our newsletter!', 'success');
                }
                emailInput.value = '';
            } else {
                throw new Error('Klaviyo is not loaded');
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Klaviyo subscription error:', error);
            showMessage(messageDiv, 'An error occurred. Please try again later.', 'error');
        } finally {
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}
