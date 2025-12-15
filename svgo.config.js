module.exports = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
          cleanupIds: false,
          removeUnknownsAndDefaults: false,
          convertPathData: {
            floatPrecision: 2
          }
        }
      }
    },
    'removeDimensions',
    'removeStyleElement',
    {
      name: 'removeAttrs',
      params: {
        attrs: ['xml:space', 'xmlns:svg', 'data-name']
      }
    }
  ]
};
