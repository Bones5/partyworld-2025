# UX Audit Action Todo

Source feedback was consolidated from these PDFs in `/Users/bones/Downloads/uxfindingspartyworld`:

- `Checkout - partyworld.pdf`
- `Homepage - Partyworld.pdf`
- `Homepage - mobile - Partyworld.pdf`
- `Product Category - Partyworld.pdf`
- `Product Category Mobile - partyworld.pdf`
- `Product Page 1 - partyworld.pdf`

## Priority Order

## Checkout / 3DS Implementation Routes

### Current BigCommerce implementation constraints

- The live checkout in this repo is the standard BigCommerce Optimized Checkout shell, not a local custom checkout app.
- [templates/pages/checkout.html](/Users/bones/Sites/partyworld-2025/templates/pages/checkout.html) only renders `checkout.checkout_head`, `checkout.checkout_content`, and `optimized-checkout.css`.
- [assets/scss/optimized-checkout.scss](/Users/bones/Sites/partyworld-2025/assets/scss/optimized-checkout.scss) is theme-side styling only. It does not contain payment logic, Braintree setup, or 3DS callbacks.
- This means payment-step behavior is currently owned by BigCommerce's hosted Optimized Checkout implementation, not by code in this theme.

### Braintree documentation findings for no-custom-checkout options

- **Client summary:** The main issue is that too many customers are being pushed into a full 3D Secure bank challenge, and a large number of them are dropping out before finishing it. Because this store uses BigCommerce's hosted Optimized Checkout, the simplest route is not a custom checkout rebuild, but Braintree's **3D Secure Rules Manager**.
- **What Rules Manager does:** It lets Braintree decide when to apply normal 3D Secure, when to request an exemption for low-risk orders, and when to avoid forcing a challenge where the card issuer allows it. This is important because most failed 3DS attempts in the transaction data were low-value orders where a full challenge is likely hurting conversion more than helping risk control.
- **Recommended client position:** Keep the existing BigCommerce checkout, turn Rules Manager into the first line of improvement, and use it to reduce unnecessary challenges on low-risk baskets. That is the fastest and lowest-risk route because it is configured in Braintree rather than requiring a custom checkout project.
- **Expected outcome:** If BigCommerce's hosted Braintree flow honors the rules, this should reduce avoidable checkout friction and recover some of the failed payments without changing the storefront theme or payment-page architecture.
- **Main caveat:** Braintree also documents that if the hosted checkout explicitly requests a challenge, that can override the rule. So the solution is: configure Rules Manager first, then confirm with BigCommerce and Braintree support that the hosted checkout is not forcing challenge behavior.

- Braintree's strongest documented no-code lever is **3D Secure Rules Manager**, configured in the Braintree Control Panel under Gear icon -> Fraud Management -> 3D Secure Rules -> Options.
- Rules Manager is documented as automatically enabled for merchants and evaluated whenever `verifyCard()` is called. This matters for BigCommerce Optimized Checkout because the hosted checkout is still expected to call Braintree's 3DS flow when 3DS is enabled.
- Rules Manager can configure actions without extra development work: apply 3DS, apply 3DS and request a challenge, apply low-value exemption, apply TRA exemption, skip 3DS where applicable, and apply data-only 3DS.
- Rule criteria include transaction amount, payment method type, issuer country, BIN range, client platform, and rule name. Custom-field rules exist, but those require values to be passed in the `verifyCard()` call, so they are not a no-custom-checkout route unless BigCommerce already passes useful custom fields.
- Braintree explicitly warns that request parameters such as `challenge_requested` or `requested_exemption_type`, when supplied during `verifyCard()`, override matched Control Panel rules. The CSV showed merchant requested exemption blank, but it did show challenges requested on almost all 3DS failures, so BigCommerce/Braintree support should confirm whether hosted checkout is forcing challenge requests or whether that value is issuer/rule-derived.
- Low-value exemption is documented for transactions below EUR/GBP 30. It has PSD2 caveats: no more than five consecutive exemption uses on the same payment instrument, and SCA is required once cumulative exempted payments exceed EUR 100 since the last SCA.
- TRA exemption is documented for transactions below EUR 250 and is not enabled by default. Braintree says merchants must qualify and should contact support to request access.
- SCA exemptions are never guaranteed; issuers decide whether to grant them. If granted, SCA is bypassed but fraud liability remains with the merchant rather than shifting to the issuer.
- Braintree's native API also supports `requestedExemptionType`, `applySmartAuthentication`, `dataOnlyRequested`, `requestVisaDAF`, `collectDeviceData`, and `acsWindowSize`, but those require control of the client/server 3DS call and therefore are not directly configurable from this theme or stock Optimized Checkout unless BigCommerce exposes them.
- BigCommerce's Braintree settings do expose a 3D Secure toggle, fraud-protection setup, wallets/APMs, stored cards, Fastlane, dynamic descriptors, and basic fraud settings. The public BigCommerce Braintree help page does not expose low-value/TRA/Rules Manager settings directly inside BigCommerce.

### Supported escalation path if deeper checkout control is needed

- BigCommerce's supported route for deeper checkout changes is a custom Open Checkout implementation built on `@bigcommerce/checkout-sdk` / `checkout-js`.
- The Checkout SDK supports payment-step initialization and Braintree 3DS frame lifecycle hooks, but the public SDK surface does not expose a `requestedExemptionType` / `low_value` / `transaction_risk_analysis` option.
- The exposed Braintree 3DS options in the SDK are limited to values such as `challengeRequested`, `collectDeviceData`, `acsWindowSize`, `addFrame`, `removeFrame`, and `onLookupComplete`.
- Result: moving to Open Checkout gives control over the 3DS modal/container UX, callbacks, and payment error handling, but does not obviously unlock SCA exemption requests unless BigCommerce or Braintree also support them upstream.

### Recommendation-by-recommendation route

#### 1. Request SCA exemptions for low-value orders

- **Can this be done in the current theme?** No.
- **Can this be done in stock Optimized Checkout?** Possibly, through Braintree 3D Secure Rules Manager, if BigCommerce's hosted checkout 3DS call does not override the rule with explicit request parameters.
- **Can this be done in Open Checkout?** Yes in a native Braintree integration via `requestedExemptionType: "low_value"`; not obviously exposed through BigCommerce's public Checkout SDK strategy.
- **Clear route:**
  - In Braintree Control Panel, confirm 3D Secure is enrolled for the relevant merchant account and that 3D Secure Rules Manager is available.
  - Create a low-value rule for transactions under EUR/GBP 30 and assign it to the active merchant account ruleset.
  - Raise a support ticket with BigCommerce and Braintree asking whether BigCommerce Optimized Checkout's Braintree 3DS call supplies `challenge_requested` or `requested_exemption_type`, because those values override Braintree Rules Manager.
  - Ask specifically whether BigCommerce's hosted Braintree strategy already supports exemptions behind a merchant/account flag, and whether Rules Manager is honored for hosted checkout traffic.
  - If BigCommerce says no, evaluate either:
    - a forked Open Checkout implementation with custom Braintree strategy work, or
    - a payment-stack change to a gateway flow where exemptions are merchant-configurable.
- **Implementation note:** this is the highest-value lever commercially, but it is not a theme task.

#### 2. Apply TRA exemption for roughly €30 to €100 baskets

- **Can this be done in the current theme?** No.
- **Can this be done in stock Optimized Checkout?** Possibly, through Braintree 3D Secure Rules Manager, but only after Braintree enables/approves TRA access for the merchant account.
- **Can this be done in Open Checkout?** Yes in a native Braintree integration via `requestedExemptionType: "transaction_risk_analysis"`; not obviously exposed through BigCommerce's public Checkout SDK strategy.
- **Clear route:**
  - Contact Braintree support to confirm TRA qualification and enablement for the merchant/acquirer setup.
  - If enabled, configure a Rules Manager action for TRA in the target basket band, for example EUR 30-100 or EUR 30-250 depending risk appetite.
  - Treat TRA and low-value as one discovery stream with BigCommerce/Braintree support.
  - Confirm whether BigCommerce's Braintree integration honors Braintree Rules Manager for exemption requests, or whether hosted checkout sends request parameters that override the rules.
- **Implementation note:** because fraud-suspected declines are low in the transaction analysis, TRA is worth pursuing, but it is platform/gateway-owned rather than theme-owned.

#### 3. Audit and improve the mobile 3DS popup / iframe experience

- **Can this be done in the current theme?** Partially.
- **What is possible now:**
  - Audit the current hosted checkout experience in mobile emulation and on real devices.
  - Adjust only the CSS surface that BigCommerce exposes through [assets/scss/optimized-checkout.scss](/Users/bones/Sites/partyworld-2025/assets/scss/optimized-checkout.scss), especially overlay, order-summary drawer, spacing, and step visibility.
  - Add guarded checkout-page scripts through BigCommerce Script Manager only for non-PCI DOM fixes or observability, if needed.
- **What is not reliable in the current setup:**
  - Replacing BigCommerce's 3DS iframe mounting logic.
  - Controlling when the issuer frame opens or how Braintree inserts it.
- **Clear route:**
  - Run a checkout audit focused on mobile Safari + Chrome.
  - Capture whether the 3DS frame is clipped, obscured by browser UI, dismissible by accidental background taps, or not restoring focus/state after cancel.
  - If the problem is purely layout/stacking, patch `optimized-checkout.scss`.
  - If the problem is frame insertion or lifecycle, that becomes an Open Checkout project.

#### 4. Add a clearer retry UX when issuer authentication fails

- **Can this be done in the current theme?** Partially.
- **What is possible now:**
  - Improve generic checkout error presentation if BigCommerce renders a stable error banner / inline message that can be styled in `optimized-checkout.scss`.
  - Potentially add supporting explanatory copy via checkout page scripts if the DOM exposes a stable failure state.
- **What is not reliable in the current setup:**
  - Intercepting Braintree's internal failure event directly from this theme.
  - Rewriting hosted payment-step logic inside stock Optimized Checkout.
- **Clear route:**
  - Inspect the DOM shown for 3DS / issuer-auth failures.
  - If BigCommerce surfaces a deterministic error node, add a supplementary help pattern such as: "Your bank did not complete verification. Try again, use another card, or choose PayPal / Apple Pay."
  - If the current DOM is too opaque, move this requirement into an Open Checkout scope where `onPaymentError` and 3DS callbacks can drive a first-class retry component.

#### 5. Retarget repeated 3DS-failure customers by email

- **Can this be done in the current theme?** No.
- **Most practical route for this store:** Klaviyo + BigCommerce automation, not theme code.
- **Clear route:**
  - Use the existing Klaviyo integration direction in [docs/KLAVIYO_INTEGRATION.md](/Users/bones/Sites/partyworld-2025/docs/KLAVIYO_INTEGRATION.md) as the marketing automation path.
  - Determine whether the installed Klaviyo / BigCommerce app can segment checkout starts without purchases for a payment-failure follow-up.
  - If native app events are insufficient, add an external event pipeline using BigCommerce webhooks plus a small serverless service that writes a custom Klaviyo event such as `checkout_payment_failed_3ds`.
  - Send the recovery email only where consent and lawful basis are clear.
- **Implementation note:** this is operationally easier than Open Checkout and likely the fastest short-term recovery lever.

### Recommended delivery order

1. Run the mobile 3DS audit first because it is actionable in the current stack and may expose a CSS-only fix.
2. Open a joint BigCommerce + Braintree support investigation for low-value and TRA exemptions.
3. Inspect current checkout failure DOM to see whether a retry/help message can be layered onto hosted checkout.
4. In parallel, scope Klaviyo recovery automation for repeated payment-failure users.
5. Only open an Open Checkout project if the audit shows the core issue is iframe lifecycle / hosted payment behavior that the theme layer cannot reach.

### Decision summary

- **Theme-only candidates:** mobile layout polish for hosted checkout, clearer styling for checkout error states, limited helper copy.
- **Platform/gateway candidates:** low-value exemption, TRA exemption, native Braintree 3DS strategy behavior.
- **Open Checkout candidates:** custom 3DS frame handling, custom retry UX, deterministic payment-failure state management.

## Execution Tracking

- Main repo remains at `/Users/bones/Sites/partyworld-2025` on `feature/trustpilot-changes`.
- Task worktree root: `/Users/bones/Sites/partyworld-2025-worktrees`
- Current task status values:
  - `queued in local worktree`: branch and worktree are ready, implementation not started.
  - `in progress`: actively being changed in that worktree.
  - `done`: implemented and ready for verification or merge.

### P0 - Conversion blockers

- [ ] Fix the product page quantity stepper so the `+` control increments reliably.
  Status: in progress
      Branch: `ux/qty-stepper-fix`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-qty-stepper-fix`
  Progress note: JS handler hardened for blank min/max values and input updates; browser verification still pending.
  Validation note: editor diagnostics pass; `npm test` is currently blocked in the worktree because the local Jest environment dependency is not installed.
      Page: Product page
      Why: Users can be blocked from increasing quantity before adding to cart.
      Acceptance criteria:
  - The `+` and `-` controls work consistently on desktop and mobile.
  - Quantity updates correctly before add-to-cart.
  - Cart line quantity matches the selected quantity.
  - Behavior is verified in the main supported browsers.

- [ ] Fix category filters that become frozen or unclickable.
  Status: in progress
      Branch: `ux/category-filters-fix`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-category-filters-fix`
  Progress note: sidebar subcategory navigation has been moved out of the faceted-search managed region to isolate plain category navigation from AJAX facet state.
  Validation note: template diagnostics pass and the category worktree compiles successfully with the local webpack binary; browser repro is still needed to confirm filters remain clickable after navigating into a subcategory.
      Page: Category page desktop and mobile
      Why: Users cannot refine product listings reliably.
      Acceptance criteria:
  - Filters remain interactive after entering a subcategory from a parent category.
  - Filter state is either preserved intentionally or reset intentionally, with no broken in-between state.
  - Users can apply and clear filters without refreshing the page.
  - Mobile and desktop behavior are both retested.

- [ ] Make checkout steps immediately understandable, with shipping, billing, and payment sections surfaced in a clear order.
  Status: in progress
      Branch: `ux/checkout-steps-clarity`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-checkout-steps-clarity`
  Progress note: added a visible checkout guide above hosted checkout content and strengthened visual grouping for checkout steps and the order summary.
  Validation note: editor diagnostics pass; a full webpack build from this worktree is currently blocked because the worktree does not have its own installable frontend dependencies.
      Page: Checkout
      Why: The current layout hides important form sections and weakens purchase confidence.
      Acceptance criteria:
  - Required checkout sections are visible or clearly introduced in a logical sequence.
  - Users can tell where they are in the checkout flow.
  - Payment details are discoverable without guesswork.
  - The flow works cleanly on desktop and mobile.

### P1 - High-impact usability fixes

- [ ] Make the checkout order summary sticky on desktop.
  Status: in progress
      Branch: `ux/checkout-summary-sticky`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-checkout-summary-sticky`
  Progress note: added a desktop-only sticky treatment to the hosted order summary panel with bounded height and internal scrolling.
  Validation note: editor diagnostics pass; a full webpack build from this worktree is currently blocked because the worktree does not have its own installable frontend dependencies.
      Page: Checkout
      Why: Users lose sight of totals and selected items while completing the form.
      Acceptance criteria:
  - Order summary remains visible while scrolling through checkout fields on desktop.
  - Totals, shipping, and item counts stay readable.
  - Sticky behavior does not overlap footer or form controls.

- [ ] Add a visible close action to the mobile search/menu dropdown.
  Status: in progress
      Branch: `ux/mobile-menu-close`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-mobile-menu-close`
  Progress note: added a visible close button to the mobile nav panel and wired the existing menu controller to close on button click and `Esc`.
  Validation note: editor diagnostics pass and the mobile-menu-close worktree compiles successfully using the validated dependency install from the category worktree.
      Page: Homepage mobile
      Why: Users have to guess how to dismiss the dropdown.
      Acceptance criteria:
  - A visible close or cancel control is present.
  - Tapping outside and pressing `Esc` also dismisses the panel where appropriate.
  - The control has an accessible label and visible focus state.

- [ ] Add explicit controls or affordances for horizontally scrollable mobile modules.
  Status: in progress
      Branch: `ux/mobile-scroll-affordance`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-mobile-scroll-affordance`
  Progress note: the category mobile carousel now keeps its arrows visible on small screens and adds a visible hint telling users they can swipe or use arrows.
  Validation note: editor diagnostics pass and the mobile-scroll-affordance worktree compiles successfully using the validated dependency install from the category worktree.
      Page: Category page mobile
      Why: Users may not realize more items are available off-screen.
      Acceptance criteria:
  - Horizontal carousels show visible left/right controls or another obvious affordance.
  - Controls do not block content.
  - Interaction works with touch and keyboard where relevant.

- [ ] Standardize product card CTA buttons so every relevant card has a visible purchase action.
  Status: in progress
      Branch: `ux/product-card-cta-standardize`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-product-card-cta-standardize`
  Progress note: normalized the category Fast Simon best-sellers CTA copy to match the rest of the recommendation cards and added a visible shared `Shop Now` CTA to the standard category product cards so the default listing now exposes the same primary action pattern.
  Validation note: editor diagnostics pass for the touched category template, shared product card template, and shared card SCSS; browser review is still needed to confirm spacing and CTA consistency across all category card variants.
      Page: Category page mobile
      Why: Inconsistent CTAs create hesitation and missed purchase opportunities.
      Acceptance criteria:
  - Product cards use a consistent CTA pattern.
  - Button size, copy, and styling are uniform across the listing.
  - No purchasable product card is missing its primary action.

- [ ] Turn the homepage clearance-sale banner into a real CTA or remove it.
  Status: in progress
      Branch: `ux/home-sale-banner-cta`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-home-sale-banner-cta`
  Progress note: replaced the generic homepage banner slot after recommendations with the dedicated sale-banner component and added the missing Theme Editor settings that power its image, copy, and CTA destination.
  Validation note: editor diagnostics pass for the touched homepage template and schema; browser verification is still needed, and the new banner will remain hidden until sale-banner Theme Editor values are configured.
      Page: Homepage desktop
      Why: A promotional banner that looks clickable but is not clickable creates friction.
      Acceptance criteria:
  - The banner links to a relevant sale destination, or it is removed.
  - The banner includes a clear CTA treatment if retained.
  - Hover, focus, and tap behavior match the visual cue.

- [ ] Fix broken homepage imagery.
  Status: in progress
      Branch: `ux/homepage-broken-images`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-homepage-broken-images`
  Progress note: homepage theme cards now render Stencil image objects through the shared responsive image partial, preserve string and source URL fallbacks, use the passed card title consistently, and show a neutral placeholder when an image is missing.
  Validation note: editor diagnostics pass for the touched theme-card template and homepage grids SCSS; browser verification against production-like homepage content is still needed.
      Page: Homepage desktop
      Why: Broken images reduce trust and make the page feel unreliable.
      Acceptance criteria:
  - All homepage images load successfully in production-like data.
  - Missing-image states are handled gracefully.
  - Image paths, fallbacks, and lazy-loading behavior are verified.

### P2 - Visual consistency and polish

- [ ] Normalize category grid image sizing and aspect-ratio handling.
  Status: in progress
      Branch: `ux/category-image-sizing`
      Worktree: `/Users/bones/Sites/partyworld-2025-worktrees/ux-category-image-sizing`
  Progress note: added a category-page-only image override so standard and Fast Simon product cards fill the existing square media frame consistently instead of letterboxing within it.
  Validation note: editor diagnostics pass for the touched category SCSS; browser verification is still needed to confirm the crop stays acceptable across real category assortments.
      Page: Category page desktop
      Why: Oversized or inconsistent images disrupt scanning.
      Acceptance criteria:
  - Product images follow a consistent aspect-ratio treatment.
  - Cards align cleanly in the grid.
  - Cropping and containment rules are consistent across products.

## Recommended Delivery Sequence

1. Fix quantity stepper, category filters, and checkout field visibility first.
2. Ship sticky checkout summary next because it supports conversion once the flow is clear.
3. Resolve mobile navigation and carousel affordances.
4. Finish with homepage promotional and image-quality fixes, then visual consistency cleanup.

## QA Retest Pass

- [ ] Retest homepage, category, product, and checkout flows on desktop.
- [ ] Retest homepage and category flows on mobile.
- [ ] Confirm every fix with keyboard navigation and visible focus where interactive controls were added or changed.
- [ ] Capture before/after screenshots for the original audit issues.
