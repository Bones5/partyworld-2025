/**
 * Rive Logo Animation
 *
 * Initializes a Rive animation for the header logo using the @rive-app/webgl2 runtime.
 * The animation file (testrive.riv) is loaded from the CDN assets folder.
 */

import {
    Fit, Layout, Rive,
} from '@rive-app/webgl2';

/**
 * Initialize the Rive logo animation
 * @param {string} riveFileSrc - The URL to the .riv file
 */
export default function riveLogo(riveFileSrc) {
    if (!riveFileSrc) return;

    const canvases = Array.from(document.querySelectorAll('[data-rive-logo-canvas]'));
    if (canvases.length === 0) {
        return;
    }

    canvases.forEach((canvas) => {
        const tryResize = (riveInstance) => {
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;

            if (!width || !height) {
                return false;
            }

            riveInstance.resizeDrawingSurfaceToCanvas();
            return true;
        };

        const layout = new Layout({
            fit: Fit.Layout,
            layoutScaleFactor: 1,
        });

        const riveInstance = new Rive({
            src: riveFileSrc,
            canvas,
            autoplay: true,
            autoBind: true,
            stateMachines: 'State Machine 1',
            layout,
            onLoad: () => {
                const maxAttempts = 20;
                let attempts = 0;

                const resizeLoop = () => {
                    attempts += 1;
                    if (tryResize(riveInstance) || attempts >= maxAttempts) return;
                    requestAnimationFrame(resizeLoop);
                };

                resizeLoop();
                setTimeout(() => { tryResize(riveInstance); }, 150);
            },
            onLoadError: (error) => {
                // eslint-disable-next-line no-console
                console.error('[Rive] Load error:', error);
            },
        });

        window.addEventListener('resize', () => {
            tryResize(riveInstance);
        });

        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                tryResize(riveInstance);
            });
            ro.observe(canvas);
        }

        const logoLink = canvas.closest('.header-logo__link--rive');
        if (logoLink) {
            logoLink.addEventListener('mouseenter', () => {
                const inputs = riveInstance.stateMachineInputs('State Machine 1');
                const hoverInput = inputs?.find((i) => i.name === 'isHovering');
                if (hoverInput) hoverInput.value = true;
            });

            logoLink.addEventListener('mouseleave', () => {
                const inputs = riveInstance.stateMachineInputs('State Machine 1');
                const hoverInput = inputs?.find((i) => i.name === 'isHovering');
                if (hoverInput) hoverInput.value = false;
            });

            logoLink.addEventListener('mousedown', () => {
                const inputs = riveInstance.stateMachineInputs('State Machine 1');
                const downInput = inputs?.find((i) => i.name === 'isDown');
                if (downInput) downInput.value = true;
            });

            logoLink.addEventListener('mouseup', () => {
                const inputs = riveInstance.stateMachineInputs('State Machine 1');
                const downInput = inputs?.find((i) => i.name === 'isDown');
                if (downInput) downInput.value = false;
            });
        }
    });
}
