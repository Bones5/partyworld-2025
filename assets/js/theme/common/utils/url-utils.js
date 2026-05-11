import Url from "url";

const sanitizeHistoryUrl = (url) => {
  const parsed = Url.parse(url, true);

  // Let formatter rebuild query from object.
  parsed.search = null;

  // `_bc_fsnf` is used by Fast Simon internals. Keeping it in browser history
  // can cause back/forward navigations to request JSON payloads as documents.
  if (
    parsed.query &&
    Object.prototype.hasOwnProperty.call(parsed.query, "_bc_fsnf")
  ) {
    delete parsed.query._bc_fsnf;
  }

  return Url.format(parsed);
};

const urlUtils = {
  getUrl: () => `${window.location.pathname}${window.location.search}`,

  goToUrl: (url) => {
    // Ensure we only use the pathname and search (relative URL) to avoid cross-origin errors
    let safeUrl = sanitizeHistoryUrl(url);
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      const parsed = Url.parse(url);
      safeUrl = sanitizeHistoryUrl(parsed.pathname + (parsed.search || ""));
    }
    window.history.pushState({}, document.title, safeUrl);
    $(window).trigger("statechange");
  },

  replaceParams: (url, params) => {
    const parsed = Url.parse(url, true);
    let param;

    // Let the formatter use the query object to build the new url
    parsed.search = null;

    for (param in params) {
      if (params.hasOwnProperty(param)) {
        parsed.query[param] = params[param];
      }
    }

    return Url.format(parsed);
  },

  buildQueryString: (queryData) => {
    let out = "";
    let key;
    for (key in queryData) {
      if (queryData.hasOwnProperty(key)) {
        if (Array.isArray(queryData[key])) {
          let ndx;

          for (ndx in queryData[key]) {
            if (queryData[key].hasOwnProperty(ndx)) {
              out += `&${key}=${queryData[key][ndx]}`;
            }
          }
        } else {
          out += `&${key}=${queryData[key]}`;
        }
      }
    }

    return out.substring(1);
  },

  parseQueryParams: (queryData) => {
    const params = {};

    for (let i = 0; i < queryData.length; i++) {
      const temp = queryData[i].split("=");

      if (temp[0] in params) {
        if (Array.isArray(params[temp[0]])) {
          params[temp[0]].push(temp[1]);
        } else {
          params[temp[0]] = [params[temp[0]], temp[1]];
        }
      } else {
        params[temp[0]] = temp[1];
      }
    }

    return params;
  },
};

export default urlUtils;
