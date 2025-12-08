/**
 * Simple HTTP server for E2E testing
 * Serves mock HTML pages that represent a typical BigCommerce Stencil theme structure
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const MOCK_HTML_DIR = path.join(__dirname, 'mock-pages');

// Mock HTML template with proper structure that tests expect
const mockHomePage = `<!DOCTYPE html>
<html class="js" lang="en">
<head>
    <title>Test Store - Home</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/assets/css/theme.css">
</head>
<body>
    <!-- SVG Icon Sprite -->
    <svg data-src="assets/img/icon-sprite.svg" class="icons-svg-sprite" style="display: none;">
        <defs>
            <symbol id="icon-cart" viewBox="0 0 24 24">
                <path d="M9 2a1 1 0 0 0 0 2h.001L9 4v.001L9.001 6H4a1 1 0 1 0 0 2h14.001a1 1 0 1 0 0-2H13V4.001L13 4a1 1 0 1 0-2 0l-.001.001V6H9V4.001L9 4V2Z"/>
            </symbol>
            <symbol id="icon-search" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
            </symbol>
            <symbol id="icon-menu" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
            </symbol>
        </defs>
    </svg>

    <!-- Skip Link -->
    <a href="#main-content" class="skip-to-main-link">
        <span class="u-hiddenVisually">Skip to main content</span>
    </a>

    <!-- Header -->
    <header class="header" role="banner">
        <div class="container">
            <!-- Mobile Navigation Toggle -->
            <button class="button mobileMenu-toggle" type="button" aria-label="Toggle navigation">
                <svg class="c-icon" aria-hidden="true" focusable="false">
                    <use href="assets/img/icon-sprite.svg#icon-menu"></use>
                </svg>
                <span class="u-hiddenVisually">Menu</span>
            </button>

            <!-- Search -->
            <div class="navUser-item">
                <a href="/search" class="navUser-action" aria-label="Search">
                    <svg class="navUser-icon c-icon c-icon--sm" aria-hidden="true" focusable="false">
                        <use href="assets/img/icon-sprite.svg#icon-search"></use>
                    </svg>
                    <span class="u-hiddenVisually">Search</span>
                </a>
            </div>

            <!-- Cart -->
            <div class="navUser-item">
                <a href="/cart" class="navUser-action" aria-label="Shopping cart">
                    <svg class="navUser-icon c-icon" aria-hidden="true" focusable="false">
                        <use href="assets/img/icon-sprite.svg#icon-cart"></use>
                    </svg>
                    <span class="u-hiddenVisually">Cart</span>
                </a>
            </div>

            <!-- Navigation -->
            <nav class="navPages" role="navigation">
                <ul class="navPages-list">
                    <li class="navPages-item"><a href="/" class="navPages-action">Home</a></li>
                    <li class="navPages-item"><a href="/products" class="navPages-action">Products</a></li>
                    <li class="navPages-item"><a href="/about" class="navPages-action">About</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <!-- Main Content -->
    <main id="main-content" class="main" role="main">
        <h1>Welcome to Our Store</h1>
        
        <h2>Featured Products</h2>
        
        <p style="line-height: 1.5;">
            This is a test page for the Playwright E2E tests. It includes all the necessary
            components and structures that the design system tests validate.
        </p>
        
        <h3>New Arrivals</h3>

        <!-- Form Example -->
        <form class="form" action="/submit" method="post">
            <div class="form-field">
                <label class="form-label" for="email">
                    Email Address
                    <span class="form-required" aria-label="Required">*</span>
                </label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="form-input" 
                    aria-required="true"
                    aria-label="Email address"
                    required
                />
            </div>

            <div class="form-field">
                <label class="form-label" for="message">Message</label>
                <textarea 
                    id="message" 
                    name="message" 
                    class="form-input"
                    aria-label="Your message"
                ></textarea>
            </div>

            <div class="form-actions">
                <button type="submit" class="button button--primary">Submit</button>
                <button type="reset" class="button button--secondary">Reset</button>
            </div>
        </form>

        <!-- Card Component Example -->
        <div class="c-product-grid">
            <article class="card c-product-card">
                <figure class="card-figure">
                    <img 
                        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3C/svg%3E"
                        alt="Product name" 
                        class="card-image lazyload"
                        loading="lazy"
                        srcset="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23ddd' width='300' height='300'/%3E%3C/svg%3E 300w, data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect fill='%23ddd' width='600' height='600'/%3E%3C/svg%3E 600w"
                        sizes="(max-width: 600px) 300px, 600px"
                    />
                </figure>
                <div class="card-body">
                    <h2 class="card-title">Product Title</h2>
                    <p class="card-text">Product description goes here.</p>
                    <div class="card-price">$19.99</div>
                </div>
            </article>
        </div>

        <!-- Images with lazy loading -->
        <img 
            src="placeholder.jpg" 
            data-src="actual-image.jpg" 
            alt="Lazy loaded image" 
            class="lazyload"
            loading="lazy"
            srcset="placeholder.jpg 300w, actual-image.jpg 600w"
            sizes="(max-width: 600px) 300px, 600px"
        />

        <!-- Responsive image -->
        <img 
            src="image-small.jpg"
            srcset="image-small.jpg 300w, image-medium.jpg 600w, image-large.jpg 1200w"
            sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
            alt="Responsive image example"
        />
    </main>

    <!-- Footer -->
    <footer class="footer" role="contentinfo">
        <div class="container">
            <p>&copy; 2025 Test Store. All rights reserved.</p>
        </div>
    </footer>

    <style>
        /* Basic styles for testing */
        * {
            box-sizing: border-box;
        }

        html,
        body {
            max-width: 100%;
            overflow-x: hidden;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 16px;
            line-height: 1.5;
            color: #333;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }

        /* Skip link */
        .skip-to-main-link {
            position: absolute;
            left: -9999px;
            z-index: 999;
            padding: 1em;
            background-color: #000;
            color: #fff;
        }
        .skip-to-main-link:focus {
            left: 0;
        }

        /* Visually hidden utility */
        .u-hiddenVisually {
            border: 0 !important;
            clip: rect(0, 0, 0, 0) !important;
            height: 1px !important;
            margin: -1px !important;
            overflow: hidden !important;
            padding: 0 !important;
            position: absolute !important;
            width: 1px !important;
        }

        /* Header */
        .header {
            background-color: #f8f8f8;
            padding: 1rem 0;
            border-bottom: 1px solid #ddd;
        }

        /* Navigation */
        .navPages-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            gap: 1rem;
        }

        .navPages-action {
            color: #333;
            text-decoration: none;
            padding: 0.5rem 1rem;
        }

        .navPages-action:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
        }

        /* Icons */
        .c-icon {
            width: 24px;
            height: 24px;
            fill: currentColor;
            display: inline-block;
        }

        .c-icon--sm {
            width: 18px;
            height: 18px;
        }

        .c-icon--lg {
            width: 32px;
            height: 32px;
        }

        .navUser-icon {
            width: 24px;
            height: 24px;
        }

        /* Ensure icon containers have proper touch targets */
        .navUser-action,
        .mobileMenu-toggle {
            min-height: 44px;
            min-width: 44px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem;
        }

        /* Buttons */
        .button {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
            line-height: 1.5;
            border: 1px solid transparent;
            border-radius: 4px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
            background-color: #fff;
            color: #333;
            transition: all 0.2s ease;
            min-height: 44px;
            min-width: 44px;
        }

        .button:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.25);
        }

        .button--primary {
            background-color: #0066cc;
            color: #fff;
            border-color: #0066cc;
        }

        .button--secondary {
            background-color: #6c757d;
            color: #fff;
            border-color: #6c757d;
        }

        /* Form */
        .form {
            max-width: 600px;
            margin: 2rem 0;
        }

        .form-field {
            margin-bottom: 1rem;
        }

        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        .form-input,
        .form-select {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            line-height: 1.5;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .form-input:focus,
        .form-select:focus {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
            border-color: #0066cc;
        }

        .form-required {
            color: #dc3545;
        }

        .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
        }

        /* Cards */
        .card {
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            background-color: #fff;
        }

        .card-figure {
            margin: 0;
        }

        .card-image {
            width: 100%;
            height: auto;
            display: block;
        }

        .card-body {
            padding: 1rem;
        }

        .card-title {
            font-size: 1.25rem;
            margin: 0 0 0.5rem 0;
        }

        .card-text {
            margin: 0 0 0.5rem 0;
        }

        /* Main */
        .main {
            padding: 2rem 0;
            min-height: 50vh;
            max-width: 100%;
            overflow-x: hidden;
        }

        .main h1 {
            font-size: 2rem;
            line-height: 1.2;
            margin: 0 0 1rem 0;
        }

        .main h2 {
            font-size: 1.5rem;
            line-height: 1.3;
            margin: 1.5rem 0 1rem 0;
        }

        .main h3 {
            font-size: 1.25rem;
            line-height: 1.4;
            margin: 1rem 0 0.5rem 0;
        }

        /* Images */
        img {
            max-width: 100%;
            height: auto;
        }

        /* Footer */
        .footer {
            background-color: #333;
            color: #fff;
            padding: 2rem 0;
            margin-top: 4rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
            body {
                font-size: 14px;
            }
            
            .navPages-list {
                flex-direction: column;
            }

            .main h1 {
                font-size: 1.5rem;
            }
        }

        /* Touch targets on mobile */
        @media (hover: none) and (pointer: coarse) {
            .button,
            .navPages-action,
            .navUser-action {
                min-height: 44px;
                min-width: 44px;
            }
        }
    </style>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Set CORS headers for testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve mock home page for all routes
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(mockHomePage);
});

server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}/`);
    console.log('Ready to accept E2E test connections');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
