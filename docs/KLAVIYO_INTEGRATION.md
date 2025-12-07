# Klaviyo Integration for Newsletter Signup

This guide provides step-by-step instructions for integrating Klaviyo with the Partyworld 2025 newsletter signup form.

## Overview

Klaviyo is a powerful email marketing platform that will handle newsletter subscriptions, segmentation, and email campaigns for the Partyworld store. This integration replaces or supplements the native BigCommerce newsletter functionality with Klaviyo's advanced features.

## Prerequisites

- Active Klaviyo account
- Klaviyo Public API Key (Site ID)
- Klaviyo Private API Key (for backend operations)
- Access to BigCommerce store admin panel
- Access to theme files

## Table of Contents

1. [Klaviyo Account Setup](#klaviyo-account-setup)
2. [BigCommerce Configuration](#bigcommerce-configuration)
3. [Theme Integration](#theme-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Advanced Configuration](#advanced-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Klaviyo Account Setup

### 1. Create Klaviyo Account

If you don't have a Klaviyo account:
1. Go to [klaviyo.com](https://www.klaviyo.com/)
2. Sign up for a new account
3. Complete the onboarding process
4. Select "E-commerce" as your business type

### 2. Get Your API Keys

1. Log in to Klaviyo
2. Navigate to **Account** → **Settings** → **API Keys**
3. Note your **Public API Key** (also called Site ID) - starts with a 6-character code
4. Create a **Private API Key**:
   - Click "Create Private API Key"
   - Name it "BigCommerce Integration"
   - Set appropriate permissions (Full Access recommended for full integration)
   - Save the key securely (you won't be able to see it again)

### 3. Create a Newsletter List

1. In Klaviyo, go to **Lists & Segments**
2. Click **Create List**
3. Name it "Newsletter Subscribers" or similar
4. Add a description (optional)
5. Note the **List ID** (found in the list settings)

---

## BigCommerce Configuration

### Option 1: Using Klaviyo App (Recommended)

1. **Install Klaviyo App from BigCommerce App Marketplace**
   - Go to your BigCommerce admin
   - Navigate to **Apps** → **Marketplace**
   - Search for "Klaviyo"
   - Click **Install** on the official Klaviyo app
   - Follow the authorization process to connect your Klaviyo account

2. **Configure App Settings**
   - Once installed, open the Klaviyo app from your Apps menu
   - Verify your API keys are correctly configured
   - Enable desired features (product sync, order tracking, etc.)

### Option 2: Manual Integration via Script Manager

If you prefer not to use the app or want more control:

1. **Add Klaviyo JavaScript SDK**
   - Go to **Storefront** → **Script Manager** in BigCommerce admin
   - Click **Create a Script**
   - Configure:
     - **Name:** "Klaviyo Integration"
     - **Location:** Header
     - **Select pages:** All pages
     - **Script category:** Essential
     - **Script type:** Script
   - Paste this code:
   ```html
   <script async type="text/javascript" src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=YOUR_PUBLIC_KEY"></script>
   ```
   - Replace `YOUR_PUBLIC_KEY` with your actual Klaviyo Public API Key
   - Click **Save**

---

## Theme Integration

The Partyworld 2025 theme has an existing newsletter signup form at `templates/components/common/subscription-form.html`. You can either:
- Modify the existing form to submit to Klaviyo
- Add a parallel Klaviyo form
- Use Klaviyo's embedded form

### Method 1: Modify Existing Form (Recommended)

Update the subscription form to POST directly to Klaviyo's API:

1. **Edit the subscription form**
   
   File: `templates/components/common/subscription-form.html`

   Replace the entire form with:

   ```handlebars
   <h3 class="footer-info-heading">{{lang 'newsletter.subscribe'}}</h3>
   <p>{{lang 'newsletter.subscribe_intro'}}</p>

   <form class="form klaviyo-newsletter-form" id="klaviyoNewsletterForm">
       <fieldset class="form-fieldset">
           <div class="form-field">
               <label class="form-label is-srOnly" for="klaviyo_email">{{lang 'common.email_address'}}</label>
               <div class="form-prefixPostfix wrap">
                   <input class="form-input"
                          id="klaviyo_email"
                          name="email"
                          type="email"
                          value="{{customer.email}}"
                          placeholder="{{lang 'newsletter.email_placeholder'}}"
                          aria-describedby="klaviyo-message"
                          aria-required="true"
                          autocomplete="email"
                          required
                   >
                   <button class="button button--primary form-prefixPostfix-button--postfix"
                           type="submit">
                       {{lang 'newsletter.subscribe_submit'}}
                   </button>
               </div>
               {{#if settings.show_newsletter_summary }}
                   <div class="footer-newsletter-summary">{{settings.newsletter_summary}}</div>
               {{/if}}
               <div id="klaviyo-message" class="klaviyo-message" style="display: none;"></div>
           </div>
       </fieldset>
   </form>
   ```

2. **Add JavaScript handler**

   Create a new file: `assets/js/theme/common/klaviyo-newsletter.js`

   ```javascript
   export default function klaviyoNewsletter() {
       const form = document.getElementById('klaviyoNewsletterForm');
       if (!form) return;

       form.addEventListener('submit', async (e) => {
           e.preventDefault();

           const emailInput = document.getElementById('klaviyo_email');
           const email = emailInput.value.trim();
           const messageDiv = document.getElementById('klaviyo-message');
           const submitButton = form.querySelector('button[type="submit"]');
           const originalButtonText = submitButton.textContent;

           // Validate email using browser's built-in validation with fallback
           if (!email || (emailInput.validity && !emailInput.validity.valid)) {
               showMessage(messageDiv, 'Please enter a valid email address.', 'error');
               return;
           }
           
           // Additional regex validation as fallback
           const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
           if (!emailRegex.test(email)) {
               showMessage(messageDiv, 'Please enter a valid email address.', 'error');
               return;
           }

           // Disable submit button during processing
           submitButton.disabled = true;
           submitButton.textContent = 'Subscribing...';

           try {
               // Use Klaviyo's client-side API
               // Note: This example uses Klaviyo's identify + track approach
               // which is the recommended method for client-side implementations
               if (typeof window._learnq !== 'undefined') {
                   window._learnq.push(['identify', { '$email': email }]);
                   
                   // Track subscription event
                   // Klaviyo will automatically create/update the profile
                   window._learnq.push(['track', 'Newsletter Signup', {
                       'source': 'footer',
                       '$email': email
                   }]);
                   
                   // Show success message
                   showMessage(messageDiv, 'Thank you for subscribing to our newsletter!', 'success');
                   emailInput.value = '';
                   
                   // Note: To add to a specific list, you'll need server-side integration
                   // See "Method 3: Use Klaviyo's API with Server-Side Processing" below
                   // Server-side approach would require:
                   // 1. Creating a serverless function or webhook
                   // 2. Using Klaviyo v3 API with your Private API Key
                   // 3. Example endpoint: POST to your backend at '/webhook/klaviyo-subscribe'
                   //    which then calls Klaviyo's API server-to-server

               } else {
                   throw new Error('Klaviyo is not loaded');
               }
           } catch (error) {
               console.error('Klaviyo subscription error:', error);
               showMessage(messageDiv, 'An error occurred. Please try again later.', 'error');
           } finally {
               // Re-enable submit button with original text
               submitButton.disabled = false;
               submitButton.textContent = originalButtonText;
           }
       });

       function showMessage(element, message, type) {
           element.textContent = message;
           element.className = `klaviyo-message klaviyo-message--${type}`;
           element.style.display = 'block';
           
           // Hide message after 5 seconds
           setTimeout(() => {
               element.style.display = 'none';
           }, 5000);
       }
   }
   ```

3. **Import the JavaScript module**

   Add to `assets/js/theme/global.js`:

   ```javascript
   import klaviyoNewsletter from './common/klaviyo-newsletter';
   
   export default class Global extends PageManager {
       onReady() {
           // ... existing code ...
           
           klaviyoNewsletter();
       }
   }
   ```

4. **Add CSS styling**

   Create `assets/scss/components/klaviyo/_klaviyo-newsletter.scss`:

   ```scss
   .klaviyo-newsletter-form {
       .klaviyo-message {
           margin-top: spacing("single");
           padding: spacing("half");
           border-radius: 3px;
           font-size: fontSize("smallest");
           
           &--success {
               background-color: stencilColor("success-backgroundColor");
               color: stencilColor("success-color");
               border: 1px solid stencilColor("success-borderColor");
           }
           
           &--error {
               background-color: stencilColor("error-backgroundColor");
               color: stencilColor("error-color");
               border: 1px solid stencilColor("error-borderColor");
           }
       }
   }
   ```

   Then import it in `assets/scss/theme.scss`:

   ```scss
   @import "components/klaviyo/klaviyo-newsletter";
   ```

### Method 2: Use Klaviyo Embedded Form

1. In Klaviyo, go to **Sign-up Forms**
2. Create a new **Embedded Form**
3. Customize the design to match your theme
4. Copy the generated embed code
5. Replace the content of `subscription-form.html` with the Klaviyo embed code

### Method 3: Use Klaviyo's API with Server-Side Processing

For enhanced security and to add subscribers to specific lists, implement server-side processing:

#### Option A: BigCommerce Serverless Functions (Recommended)

BigCommerce doesn't natively support custom API endpoints in themes, but you can use:

1. **BigCommerce Webhooks + External Service**:
   - Set up a serverless function (AWS Lambda, Netlify Functions, Cloudflare Workers)
   - Configure form to POST to the serverless endpoint
   - Serverless function uses Klaviyo v3 API with Private Key to add to list

2. **Script Web API (requires BigCommerce app)**:
   - Create a custom BigCommerce app with API endpoint
   - Form POSTs to your app's endpoint
   - App uses Klaviyo SDK to manage subscriptions

#### Option B: Example Serverless Function

Here's a Node.js serverless function example (AWS Lambda, Netlify, etc.):

```javascript
// serverless-function/klaviyo-subscribe.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Parse request body
    const { email, listId } = JSON.parse(event.body);
    
    // Klaviyo Private API Key (store as environment variable)
    const KLAVIYO_PRIVATE_KEY = process.env.KLAVIYO_PRIVATE_KEY;
    
    try {
        // Klaviyo API v3 - Subscribe to List
        const response = await fetch('https://a.klaviyo.com/api/profiles/', {
            method: 'POST',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
                'Content-Type': 'application/json',
                'revision': '2024-07-15'
            },
            body: JSON.stringify({
                data: {
                    type: 'profile',
                    attributes: {
                        email: email,
                        properties: {
                            'Newsletter Source': 'Website Footer'
                        }
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Klaviyo API error');
        }
        
        // Add profile to list
        const profileData = await response.json();
        const profileId = profileData.data.id;
        
        await fetch(`https://a.klaviyo.com/api/lists/${listId}/relationships/profiles/`, {
            method: 'POST',
            headers: {
                'Authorization': `Klaviyo-API-Key ${KLAVIYO_PRIVATE_KEY}`,
                'Content-Type': 'application/json',
                'revision': '2024-07-15'
            },
            body: JSON.stringify({
                data: [
                    {
                        type: 'profile',
                        id: profileId
                    }
                ]
            })
        });
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
```

Then update your form JavaScript to POST to your serverless endpoint:

```javascript
const response = await fetch('https://your-function-url.netlify.app/.netlify/functions/klaviyo-subscribe', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: email,
        listId: 'YOUR_LIST_ID'
    })
});
```

**Important Security Notes:**
- Never expose Private API Keys in client-side code
- Always use environment variables for sensitive credentials
- Implement rate limiting on serverless functions to prevent abuse
- Add CORS headers appropriately for your domain

---

## Configuration Variables

### Important: API Key Storage

**⚠️ Security Warning**: Never store API keys directly in theme files that are committed to version control.

### Recommended Approach

1. **For Klaviyo App Users**: API keys are securely managed by the app
2. **For Script Manager**: Public Key in script tag is acceptable (it's meant to be public)
3. **For Theme Settings**: Only store non-sensitive configuration

### Theme Configuration (config.json)

You can add non-sensitive settings to `config.json`:

```json
{
  "settings": {
    "klaviyo_enabled": {
      "type": "checkbox",
      "label": "Enable Klaviyo Integration",
      "default": false
    },
    "klaviyo_list_name": {
      "type": "text",
      "label": "Newsletter List Name",
      "default": "Newsletter Subscribers"
    }
  }
}
```

**Never add Private API Keys to config.json or any theme files.**

### Using BigCommerce Store Settings

For sensitive data like API keys (if not using the Klaviyo app):

1. Store in BigCommerce environment variables (requires app development)
2. Use Script Manager for the public-facing script (public key only)
3. Implement server-side functions for operations requiring private keys

### Alternative: Script Manager Variables

If using Script Manager for configuration:

1. Create script with data attributes:
   ```html
   <script 
       data-klaviyo-public-key="YOUR_PUBLIC_KEY" 
       src="/path/to/your-klaviyo-script.js">
   </script>
   ```

2. Access in your JavaScript:
   ```javascript
   const script = document.querySelector('[data-klaviyo-public-key]');
   const publicKey = script.getAttribute('data-klaviyo-public-key');
   ```

**Remember**: Public keys are safe to expose, but Private API Keys must never be in client-side code or theme files.

---

## Testing the Integration

### 1. Basic Functionality Test

1. Navigate to your store's footer where the newsletter form is located
2. Open browser developer tools (F12)
3. Go to the Console tab
4. Enter a test email address in the newsletter form
5. Click Subscribe
6. Verify in the console that:
   - No JavaScript errors appear
   - The Klaviyo API request completes successfully
   - Success message displays to the user

### 2. Verify in Klaviyo Dashboard

1. Log in to Klaviyo
2. Go to **Lists & Segments**
3. Open your newsletter list
4. Confirm the test email appears in the list
5. Check the profile to see tracked events (Newsletter Signup)

### 3. Test Edge Cases

- Empty email field submission
- Invalid email format (e.g., "notanemail")
- Duplicate subscription (should handle gracefully)
- Network failure simulation (disconnect internet)

### 4. Cross-Browser Testing

Test the form on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

---

## Advanced Configuration

### Double Opt-In

To require email confirmation before adding subscribers:

1. In Klaviyo, go to **Lists & Segments**
2. Select your newsletter list
3. Click **Settings**
4. Enable **Double Opt-In**
5. Customize the confirmation email template
6. Update your success message to inform users to check their email

### Segmentation

Create segments for targeted campaigns:

1. **New Subscribers**: Subscribed within last 30 days
2. **Engaged**: Opened at least 3 emails in last 90 days
3. **VIP Customers**: Made 3+ purchases (if integrated with orders)

### Custom Properties

Capture additional data during signup:

```javascript
window._learnq.push(['identify', {
    '$email': email,
    'Newsletter Source': 'Footer Form',
    'Signup Date': new Date().toISOString(),
    'Store': 'Partyworld'
}]);
```

### A/B Testing

Test different form variations:

1. Create multiple Klaviyo forms
2. Use BigCommerce A/B testing tools or manual cookie-based routing
3. Track conversion rates in Klaviyo analytics

---

## Troubleshooting

### Common Issues

#### Issue: Klaviyo script not loading

**Solution:**
- Check that the Public API Key is correct in Script Manager
- Verify the script tag is in the header
- Check browser console for CORS or loading errors
- Ensure ad blockers aren't blocking Klaviyo

#### Issue: Subscribers not appearing in Klaviyo

**Solution:**
- Verify List ID is correct
- Check Klaviyo API status page
- Review browser console for API errors
- Confirm the API key has proper permissions

#### Issue: Form submission doesn't show success message

**Solution:**
- Check JavaScript console for errors
- Verify the message div ID matches the JavaScript selector
- Ensure CSS isn't hiding the message
- Test with browser cache disabled

#### Issue: Duplicate subscriptions create multiple profiles

**Solution:**
- Klaviyo handles duplicates automatically by email
- Check that email is being passed correctly
- Consider using Klaviyo's built-in deduplication

#### Issue: API version compatibility

**Solution:**
- This guide references both client-side (onsite tracking) and API approaches
- Klaviyo has migrated from API v2 to v3 with different authentication methods
- For production implementations, use Klaviyo v3 REST API with Bearer token authentication
- Server-side integrations should use the official Klaviyo SDK or v3 API endpoints
- See [Klaviyo API v3 Documentation](https://developers.klaviyo.com/en/reference/api_overview) for current specifications

### Debug Mode

Add this to your JavaScript for detailed logging:

```javascript
const KLAVIYO_DEBUG = true;

if (KLAVIYO_DEBUG) {
    console.log('Klaviyo form initialized');
    console.log('Public Key:', KLAVIYO_PUBLIC_KEY);
    console.log('List ID:', KLAVIYO_LIST_ID);
}
```

### Support Resources

- **Klaviyo Documentation**: [developers.klaviyo.com](https://developers.klaviyo.com/)
- **Klaviyo Support**: support@klaviyo.com
- **BigCommerce + Klaviyo Guide**: [support.bigcommerce.com](https://support.bigcommerce.com/)
- **Klaviyo Community**: [community.klaviyo.com](https://community.klaviyo.com/)

---

## Security Considerations

1. **Never expose Private API Keys**: Only use Public API Keys in client-side code
2. **Validate email addresses**: Both client-side and server-side (if applicable)
3. **Rate limiting**: Consider implementing to prevent spam submissions
4. **GDPR Compliance**: Ensure you have proper consent mechanisms
5. **Data privacy**: Include links to privacy policy near signup form

---

## Migration from Native BigCommerce Newsletter

If migrating from BigCommerce's native newsletter:

1. **Export existing subscribers**:
   - Go to BigCommerce Admin → Customers → Newsletter Subscribers
   - Export to CSV

2. **Import to Klaviyo**:
   - In Klaviyo, go to Lists & Segments
   - Select your newsletter list
   - Click Import
   - Upload the CSV
   - Map email fields correctly

3. **Test both systems** running in parallel initially

4. **Disable BigCommerce newsletter** once Klaviyo is confirmed working:
   - Keep the native form as fallback
   - Monitor for any issues

---

## Next Steps

After successful integration:

1. **Create welcome email flow** in Klaviyo
2. **Set up abandoned cart emails** (if using Klaviyo app)
3. **Configure browse abandonment** campaigns
4. **Design regular newsletter templates**
5. **Set up win-back campaigns** for inactive subscribers
6. **Integrate with product catalog** for personalized recommendations

---

## Maintenance

### Regular Tasks

- **Weekly**: Review new subscriber growth
- **Monthly**: Clean up invalid/bounced emails
- **Quarterly**: Review and optimize email flows
- **As needed**: Update form styling to match theme changes

### Updates

- Monitor Klaviyo API changelog for breaking changes
- Test integration after BigCommerce or theme updates
- Keep Klaviyo app (if used) updated to latest version

---

## Additional Resources

- [Klaviyo BigCommerce Integration Guide](https://help.klaviyo.com/hc/en-us/articles/115005082927)
- [Klaviyo JavaScript API Documentation](https://developers.klaviyo.com/en/docs/javascript-api)
- [BigCommerce Stencil Documentation](https://developer.bigcommerce.com/stencil-docs)

---

## Support

For integration support:
- Theme development questions: Contact Partyworld development team
- Klaviyo-specific questions: Contact Klaviyo support
- BigCommerce platform questions: Contact BigCommerce support

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Maintained By**: Partyworld Development Team
