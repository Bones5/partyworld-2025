# Braintree Failed Transactions Analysis

**Source:** `transaction_search (1).csv` (Braintree export)
**Window:** April 2025 – April 2026 (13 months)
**Total failed sale attempts:** 4,822
**Total authorised value not captured:** €179,994.90

## Status mix

| Status                | Count | Share |
| --------------------- | ----: | ----: |
| `gateway_rejected`    | 3,115 | 64.6% |
| `processor_declined`  | 1,703 | 35.3% |
| `settlement_declined` |     4 |  0.1% |

## Overall reason mix

| Reason                                             | Count |     % | Category                       |
| -------------------------------------------------- | ----: | ----: | ------------------------------ |
| 3D Secure authentication failed                    | 3,115 | 64.6% | Gateway rejection (auth/fraud) |
| Insufficient Funds                                 |   529 | 11.0% | Customer wallet                |
| Card Issuer Declined CVV                           |   469 |  9.7% | Mistyped / wrong card          |
| Declined (generic 2046)                            |   189 |  3.9% | Issuer                         |
| PayPal funding instrument declined                 |   137 |  2.8% | PayPal                         |
| Expired Card                                       |   129 |  2.7% | Customer card                  |
| Declined – Call Issuer                             |    96 |  2.0% | Issuer                         |
| Processor Declined – Fraud Suspected               |    47 |  1.0% | Fraud                          |
| Other (do-not-honor, restricted, life-cycle, etc.) |  ~110 | ~2.3% | Mixed                          |

---

## Monthly breakdown — totals & top 3 reasons

| Month   |  Failed |        € Auth | Reason 1  | Reason 2                 | Reason 3                |
| ------- | ------: | ------------: | --------- | ------------------------ | ----------------------- |
| 2025-04 |      43 |      1,319.94 | 3DS (30)  | CVV (5)                  | PayPal funding (2)      |
| 2025-05 | **797** | **28,830.49** | 3DS (557) | CVV (78)                 | Declined (55)           |
| 2025-06 |     400 |     15,305.43 | 3DS (248) | CVV (42)                 | Insufficient funds (30) |
| 2025-07 |     358 |     13,408.99 | 3DS (223) | Declined (45)            | CVV (32)                |
| 2025-08 |     327 |     12,040.70 | 3DS (193) | CVV (41)                 | Declined (38)           |
| 2025-09 |     267 |     10,858.61 | 3DS (183) | CVV (24)                 | Insufficient funds (23) |
| 2025-10 | **780** | **26,510.51** | 3DS (490) | Insufficient funds (144) | CVV (77)                |
| 2025-11 |     336 |     14,022.14 | 3DS (230) | Insufficient funds (47)  | CVV (22)                |
| 2025-12 |     313 |     12,849.97 | 3DS (217) | Insufficient funds (36)  | CVV (31)                |
| 2026-01 |     289 |     10,465.88 | 3DS (180) | CVV (40)                 | Insufficient funds (34) |
| 2026-02 |     220 |      8,475.44 | 3DS (129) | Insufficient funds (44)  | CVV (13)                |
| 2026-03 |     297 |     11,887.99 | 3DS (190) | Insufficient funds (33)  | CVV (26)                |
| 2026-04 |     395 |     14,018.81 | 3DS (245) | Insufficient funds (68)  | CVV (38)                |

---

## Monthly × payment method (count / € auth)

| Month   | Visa          | Mastercard   | Amex    | PayPal      | Apple Pay   | Google Pay |
| ------- | ------------- | ------------ | ------- | ----------- | ----------- | ---------- |
| 2025-04 | 36 / €1,072   | 3 / €121     | –       | 4 / €127    | –           | –          |
| 2025-05 | 607 / €22,448 | 100 / €3,150 | –       | 90 / €3,232 | –           | –          |
| 2025-06 | 318 / €12,197 | 38 / €1,692  | –       | 44 / €1,417 | –           | –          |
| 2025-07 | 244 / €9,848  | 58 / €1,866  | –       | 56 / €1,694 | –           | –          |
| 2025-08 | 218 / €8,500  | 62 / €2,249  | –       | 47 / €1,292 | –           | –          |
| 2025-09 | 201 / €8,302  | 53 / €1,766  | –       | 10 / €645   | 3 / €146    | –          |
| 2025-10 | 554 / €19,504 | 110 / €3,528 | –       | 13 / €452   | 81 / €2,245 | 22 / €781  |
| 2025-11 | 211 / €9,626  | 75 / €2,866  | –       | 15 / €337   | 24 / €879   | 11 / €314  |
| 2025-12 | 194 / €7,107  | 74 / €3,583  | 1 / €52 | 13 / €543   | 27 / €773   | 4 / €792   |
| 2026-01 | 193 / €7,211  | 62 / €2,208  | –       | 5 / €108    | 24 / €776   | 5 / €163   |
| 2026-02 | 118 / €4,593  | 56 / €2,401  | –       | 12 / €461   | 32 / €910   | 2 / €111   |
| 2026-03 | 192 / €6,724  | 60 / €3,646  | –       | 12 / €451   | 24 / €708   | 9 / €359   |
| 2026-04 | 268 / €9,511  | 64 / €2,441  | –       | 10 / €329   | 36 / €858   | 17 / €880  |

## Method totals (entire 13-month window)

| Method                   | Failed txns |      € Auth | Share |
| ------------------------ | ----------: | ----------: | ----: |
| Credit Card – Visa       |       3,354 | €126,643.72 | 69.6% |
| Credit Card – Mastercard |         815 |  €31,518.06 | 16.9% |
| PayPal Account           |         331 |  €11,087.24 |  6.9% |
| Apple Pay Card           |         251 |   €7,294.34 |  5.2% |
| Google Pay               |          70 |   €3,399.95 |  1.5% |
| Credit Card – Amex       |           1 |      €51.59 | <0.1% |

---

## 3DS deep-dive (3,115 failures)

### 3DS status breakdown

| Field                                         | Value                                |         Count |
| --------------------------------------------- | ------------------------------------ | ------------: |
| 3DS version                                   | 2.2.0                                | 3,113 (99.9%) |
| PARes status                                  | `N` (not authenticated)              | 2,984 (95.8%) |
| PARes status                                  | `R` (rejected)                       |            96 |
| PARes status                                  | `U` (unable)                         |            32 |
| 3DS Status                                    | `authenticate_failed`                | 2,965 (95.2%) |
| ECI Flag                                      | `07` (attempted, customer abandoned) | 2,457 (78.9%) |
| ECI Flag                                      | `00` (authentication failed)         |   656 (21.1%) |
| Challenge Requested                           | `true`                               | 3,095 (99.4%) |
| Merchant Requested Exemption                  | _blank_                              |  3,115 (100%) |
| SCA Exemption applied (post-hoc by Braintree) | `low_value`                          | 1,574 (50.5%) |
| SCA Exemption applied                         | _blank_                              | 1,541 (49.5%) |

### 3DS failures by issuing bank (top 5)

| Issuer           | Failures | ECI 07 | ECI 00 |
| ---------------- | -------: | -----: | -----: |
| Bank of Ireland  |    1,172 |    944 |    228 |
| AIB              |      963 |    963 |      0 |
| PTSB             |      376 |    376 |      0 |
| Revolut Bank UAB |      154 |    154 |      0 |
| Revolut Ltd      |      140 |      0 |    140 |

The four largest Irish issuers account for ~85% of 3DS failures.

### 3DS failures by amount band

| Bucket   | Count |
| -------- | ----: |
| €0–10    |   134 |
| €10–25   | 1,028 |
| €25–50   | 1,256 |
| €50–100  |   600 |
| €100–200 |    66 |
| €200+    |    31 |

Median basket: €29.46. **73% of 3DS failures are under €50** — squarely inside the PSD2 low-value exemption band.

### 3DS failures by hour of day

Peak windows: 10:00–16:00 (~1,400 fails, mobile + desktop browse) and 20:00–22:00 (~530, evening mobile). Lowest 02:00–05:00.

### 3DS failures by day of week

| Day | Count |
| --- | ----: |
| Mon |   549 |
| Tue |   568 |
| Wed |   546 |
| Thu |   558 |
| Fri |   323 |
| Sat |   242 |
| Sun |   329 |

### Repeat-failer customers

- 2,268 unique customer emails among 3DS fails
- **522 (23%) failed 3DS more than once** — strongly indicates abandonment, not card-testing
- Top repeat: `scbrowne75@gmail.com` failed 12 times; 9 customers failed 7+ times

---

## Interpretation

1. **3DS dominates failures (~65%, ~3,100 attempts, ~€115k authorised but lost).** Almost all are `authenticate_failed` with ECI `07` — customer started 3DS but never completed the bank's challenge (closed popup, timed out, OTP not received). UX problem, not fraud.
2. **No upfront SCA exemptions are being requested.** `Merchant Requested Exemption Type` is blank for 100% of failures. Braintree retro-tags ~50% as `low_value`, but exemptions must be requested at auth-time to skip the challenge.
3. **Insufficient Funds is rising** as a share — 18% of October failures, 20% of February. Often retried successfully; "try another card" prompt would help.
4. **CVV declines (~10%)** suggest typos / autofilled wrong card. Inline CVV validation would help.
5. **PayPal funding declines (~3%)** are out of merchant control.
6. **True fraud signals are small** (~1.4% combined). The site is not under heavy attack; the dominant problem is **3DS completion friction**.
7. **Spikes correlate with seasonal peaks** — May 2025 (communions) and Oct 2025 (Halloween) — high traffic + first-time customers + more 3DS friction.
8. **Wallet rollout context** — Apple Pay traffic begins Sep 2025, Google Pay Oct 2025; PayPal failures dropped sharply over the same period as wallets absorbed flow.

## Recommendations (priority order)

1. **Enable SCA exemption requests in Braintree 3DS setup.** In the `client.create({ ... threeDSecure ... })` call, pass `requestedExemptionType: 'low_value'` for baskets ≤€30. Could remove ~1,160 challenges/year.
2. **Apply TRA exemption for €30–€100 baskets** — fraud rate is well below the threshold (~1.4%). Could remove another ~1,800 challenges.
3. **Audit 3DS challenge UX on mobile.** Verify modal isn't dismissed by background tap, returns to checkout cleanly, doesn't get clipped by mobile address bar. Most ECI-07 fails are this.
4. **Add an "issuer didn't authorise" retry UX.** Don't dump the user back to the cart — show "your bank declined verification, try a different card or PayPal." 23% repeat-failer rate suggests these customers want to pay.
5. **Email retargeting for the 522 repeat-failers.** Apology + alternate-payment email; many will return.
6. **Inline CVV validation** to cut ~470 mistype declines.
7. **Promote Apple Pay / Google Pay** at top of payment method list — wallet flow bypasses most 3DS friction.
