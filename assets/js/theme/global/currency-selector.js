import utils from '@bigcommerce/stencil-utils';
import { showAlertModal } from './modal';

let currencySelectorCalled = false;

export default function (cartId) {
    if (currencySelectorCalled) {
        return;
    }

    currencySelectorCalled = true;

    const hasCartId = Boolean(cartId);

    const redirectTo = (url) => {
        if (!url) return;
        window.location.href = url;
    };

    function changeCurrency(url, currencyCode, fallbackUrl) {
        if (!url || !currencyCode) {
            redirectTo(fallbackUrl);
            return;
        }

        $.ajax({
            url,
            contentType: 'application/json',
            method: 'POST',
            data: JSON.stringify({ currencyCode }),
        }).done(() => {
            window.location.reload();
        }).fail((e) => {
            if (fallbackUrl) {
                redirectTo(fallbackUrl);
                return;
            }

            try {
                const response = JSON.parse(e.responseText);
                showAlertModal(response.error);
            } catch (error) {
                const fallbackMessage = (e && e.responseText) || (e && e.statusText) || '';
                showAlertModal(fallbackMessage);
            }
        });
    }

    const handleCurrencySelection = ({
        switchUrl, cartCurrencySwitchUrl, currencyCode, warningText, $trigger,
    }) => {
        if (!currencyCode) {
            redirectTo(switchUrl || cartCurrencySwitchUrl);
            return;
        }

        if (!cartCurrencySwitchUrl) {
            redirectTo(switchUrl);
            return;
        }

        if (!hasCartId) {
            redirectTo(switchUrl || cartCurrencySwitchUrl);
            return;
        }

        utils.api.cart.getCart({ cartId }, (err, response) => {
            if (err || !response) {
                redirectTo(switchUrl || cartCurrencySwitchUrl);
                return;
            }

            const hasDiscounts = response.discounts.some(discount => discount.discountedAmount > 0)
                || response.coupons.length > 0
                || response.lineItems.giftCertificates.length > 0;

            if (hasDiscounts && warningText) {
                showAlertModal(warningText, {
                    icon: 'warning',
                    showCancelButton: true,
                    $preModalFocusedEl: $trigger,
                    onConfirm: () => {
                        changeCurrency(cartCurrencySwitchUrl, currencyCode, switchUrl);
                    },
                });
            } else {
                changeCurrency(cartCurrencySwitchUrl, currencyCode, switchUrl);
            }
        });
    };

    $(document).on('change', '[data-currency-selector] select', event => {
        const $select = $(event.currentTarget);
        const $selectedOption = $select.find(':selected');

        const selection = {
            switchUrl: $selectedOption.val(),
            cartCurrencySwitchUrl: $selectedOption.data('cartCurrencySwitchUrl'),
            currencyCode: $selectedOption.data('currencyCode'),
            warningText: $selectedOption.data('warning'),
            $trigger: $select,
        };

        if (!selection.switchUrl && !selection.cartCurrencySwitchUrl) {
            return;
        }

        handleCurrencySelection(selection);
    });

    $(document).on('click', '[data-cart-currency-switch-url]', event => {
        const $target = $(event.currentTarget);
        const cartCurrencySwitchUrl = $target.data('cartCurrencySwitchUrl');

        if (!cartCurrencySwitchUrl) {
            return;
        }

        event.preventDefault();

        handleCurrencySelection({
            switchUrl: $target.attr('href'),
            cartCurrencySwitchUrl,
            currencyCode: $target.data('currencyCode'),
            warningText: $target.data('warning'),
            $trigger: $target,
        });
    });
}
