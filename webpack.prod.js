// eslint-disable-next-line import/no-extraneous-dependencies
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
// eslint-disable-next-line import/no-extraneous-dependencies
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common");
const packageJson = require("./package.json");

const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_PT;
const sentryOrg = process.env.SENTRY_ORG || "bonesdev";
const sentryProject = process.env.SENTRY_PROJECT || "partyworld-storefront";
const sentryRelease =
  process.env.SENTRY_RELEASE || `partyworld-2025@${packageJson.version}`;

const sentryPlugins = [];

if (sentryAuthToken) {
  sentryPlugins.push(
    sentryWebpackPlugin({
      authToken: sentryAuthToken,
      org: sentryOrg,
      project: sentryProject,
      release: {
        name: sentryRelease,
      },
      sourcemaps: {
        assets: "./assets/dist/**/*.js",
        filesToDeleteAfterUpload: "./assets/dist/**/*.js.map",
      },
      telemetry: false,
    }),
  );
} else {
  // Builds still succeed locally when Sentry auth is not configured.
  // Source maps upload automatically once SENTRY_AUTH_TOKEN or SENTRY_PT is set.
  // eslint-disable-next-line no-console
  console.warn(
    "[Sentry] Skipping source maps upload; set SENTRY_AUTH_TOKEN or SENTRY_PT to enable it.",
  );
}

module.exports = merge(commonConfig, {
  devtool: "source-map",
  mode: "production",
  optimization: {
    emitOnErrors: false,
  },
  plugins: sentryPlugins,
});
