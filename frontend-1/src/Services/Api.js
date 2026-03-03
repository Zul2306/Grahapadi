const LOCAL_API_BASE_URL = "http://localhost:8080";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || LOCAL_API_BASE_URL;

export const apiUrl = (path = "") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const rewriteApiUrl = (url) => {
  if (typeof url !== "string") {
    return url;
  }

  if (url.startsWith(LOCAL_API_BASE_URL)) {
    return url.replace(LOCAL_API_BASE_URL, API_BASE_URL);
  }

  return url;
};

export const initializeApiInterceptor = () => {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }

  if (window.__warehouseApiInterceptorInitialized) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      return originalFetch(rewriteApiUrl(input), init);
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteApiUrl(input.url);
      if (rewrittenUrl !== input.url) {
        const rewrittenRequest = new Request(rewrittenUrl, input);
        return originalFetch(rewrittenRequest, init);
      }
    }

    return originalFetch(input, init);
  };

  window.__warehouseApiInterceptorInitialized = true;
};
