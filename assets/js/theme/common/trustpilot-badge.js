const TRUSTPILOT_REVIEW_HOST_RE = /trustpilot\.(com|co\.uk)|trustpilot\.com/i;
const PARTYWORD_TRUSTPILOT_REVIEW_URL_RE = /trustpilot\.(com|co\.uk)\/review\/partyworld\.ie/i;

function coerceToNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;

    const normalized = value.replace(/,/g, '').trim();
    const asNumber = Number(normalized);
    return Number.isFinite(asNumber) ? asNumber : null;
}

function formatReviewCount(count) {
    if (!Number.isFinite(count) || count <= 0) return null;

    if (count >= 1000) {
        return `${Math.round(count / 1000)}k`;
    }

    return `${count}`;
}

function* walkJsonLd(node) {
    if (!node) return;

    if (Array.isArray(node)) {
        for (const item of node) {
            yield* walkJsonLd(item);
        }
        return;
    }

    if (typeof node === 'object') {
        yield node;

        if (node['@graph']) {
            yield* walkJsonLd(node['@graph']);
        }

        for (const value of Object.values(node)) {
            if (typeof value === 'object') {
                yield* walkJsonLd(value);
            }
        }
    }
}

function looksLikeTrustpilotOrg(object) {
    const type = object['@type'];
    const types = Array.isArray(type) ? type : [type].filter(Boolean);

    const isOrgType = types.some((t) => typeof t === 'string' && /Organization|LocalBusiness/i.test(t));
    if (!isOrgType) return false;

    const sameAs = object.sameAs;
    const sameAsList = Array.isArray(sameAs) ? sameAs : [sameAs].filter(Boolean);

    return sameAsList.some((url) => typeof url === 'string' && PARTYWORD_TRUSTPILOT_REVIEW_URL_RE.test(url));
}

function extractTrustpilotReviewCountFromJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of scripts) {
        const raw = script.textContent;
        if (raw) {
            try {
                const parsed = JSON.parse(raw);

                for (const obj of walkJsonLd(parsed)) {
                    if (obj.aggregateRating) {
                        const reviewCount = coerceToNumber(obj.aggregateRating.reviewCount);
                        if (reviewCount && looksLikeTrustpilotOrg(obj)) {
                            return reviewCount;
                        }
                    }
                }
            } catch (e) {
                // Ignore invalid JSON-LD blocks
            }
        }
    }

    return null;
}

function extractTrustpilotReviewCountFromLinks() {
    // Some integrations inject links/meta with the count in text; this is a best-effort fallback.
    const anchors = document.querySelectorAll('a[href*="trustpilot"]');

    for (const anchor of anchors) {
        const href = anchor.getAttribute('href') || '';
        if (TRUSTPILOT_REVIEW_HOST_RE.test(href)) {
            const text = (anchor.textContent || '').trim();
            const match = text.match(/(\d[\d,]*)\s*(reviews|review)/i);

            if (match) {
                const count = coerceToNumber(match[1]);
                if (count) return count;
            }
        }
    }

    return null;
}

export default function initTrustpilotBadge() {
    const badgeLinks = document.querySelectorAll('[data-trustpilot-badge]');
    if (!badgeLinks.length) return;

    const count = extractTrustpilotReviewCountFromJsonLd() ?? extractTrustpilotReviewCountFromLinks();
    if (!count) return;

    const formatted = formatReviewCount(count);
    if (!formatted) return;

    for (const badgeLink of badgeLinks) {
        const countEl = badgeLink.querySelector('[data-trustpilot-review-count]');
        if (countEl) {
            countEl.textContent = `${formatted} reviews`;
        }

        // Keep aria-label aligned if present
        const aria = badgeLink.getAttribute('aria-label');
        if (aria && /Trustpilot rating:/i.test(aria)) {
            badgeLink.setAttribute('aria-label', `Trustpilot rating: Excellent from ${formatted} reviews`);
        }
    }
}
