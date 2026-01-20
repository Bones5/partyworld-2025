// Minimal polyfills for modern browsers
// core-js is loaded via useBuiltIns: 'usage' in babel config
// which automatically includes only needed polyfills based on browserslist
import 'regenerator-runtime/runtime';
import objectFitImages from 'object-fit-images';

document.addEventListener('DOMContentLoaded', () => {
    objectFitImages();
});
