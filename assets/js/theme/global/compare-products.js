import { showAlertModal } from './modal';

function decrementCounter(counter, item) {
    const index = counter.indexOf(item);

    if (index > -1) {
        counter.splice(index, 1);
    }
}

function incrementCounter(counter, item) {
    counter.push(item);
}

function updateCounterNav(counter, $link, urls) {
    if (counter.length !== 0) {
        if (!$link.is('visible')) {
            $link.addClass('show');
        }
        $link.attr('href', `${urls.compare}/${counter.join('/')}`);
        $link.find('span.countPill').html(counter.length);
    } else {
        $link.removeClass('show');
    }
}

/**
 * Announces compare status changes to screen readers
 * @param {boolean} added - Whether the product was added (true) or removed (false)
 * @param {number} count - Current number of products in compare list
 */
function announceCompareChange(added, count) {
    let $announcer = $('#compare-aria-announcer');

    // Create the aria-live region if it doesn't exist
    if ($announcer.length === 0) {
        $announcer = $('<div>', {
            id: 'compare-aria-announcer',
            class: 'aria-description--hidden',
            'aria-live': 'polite',
            'aria-atomic': 'true',
        }).appendTo('body');
    }

    const action = added ? 'added to' : 'removed from';
    const message = `Product ${action} compare list. ${count} product${count !== 1 ? 's' : ''} selected for comparison.`;

    // Clear and update the announcement
    $announcer.text('');
    setTimeout(() => {
        $announcer.text(message);
    }, 100);
}

export default function ({ noCompareMessage, urls }) {
    let compareCounter = [];

    const $compareLink = $('a[data-compare-nav]');

    $('body').on('compareReset', () => {
        const $checked = $('body').find('input[name="products\[\]"]:checked');

        compareCounter = $checked.length ? $checked.map((index, element) => element.value).get() : [];
        updateCounterNav(compareCounter, $compareLink, urls);
    });

    $('body').triggerHandler('compareReset');

    $('body').on('click', '[data-compare-id]', event => {
        const product = event.currentTarget.value;
        const $clickedCompareLink = $('a[data-compare-nav]');
        const isAdded = event.currentTarget.checked;

        if (isAdded) {
            incrementCounter(compareCounter, product);
        } else {
            decrementCounter(compareCounter, product);
        }

        updateCounterNav(compareCounter, $clickedCompareLink, urls);

        // Announce the change to screen readers
        announceCompareChange(isAdded, compareCounter.length);
    });

    $('body').on('click', 'a[data-compare-nav]', () => {
        const $clickedCheckedInput = $('body').find('input[name="products\[\]"]:checked');

        if ($clickedCheckedInput.length <= 1) {
            showAlertModal(noCompareMessage);
            return false;
        }
    });
}
