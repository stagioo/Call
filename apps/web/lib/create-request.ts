import type { CreateRequestOptions } from "./types";

export function createRequest({
  path,
  pathParams = {},
  queryParams = {},
}: CreateRequestOptions) {
  return (signal: AbortSignal) => {
    // Replace path params in the URL
    let currentPath = path;
    for (const [key, value] of Object.entries(pathParams)) {
      currentPath = currentPath.replace(
        `:${key}`,
        encodeURIComponent(String(value))
      );
    }

    // Append query string
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    const query = queryString ? `?${queryString}` : "";

    // Construct the full URL
    const fullUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api${currentPath}${query}`;

    return fetch(fullUrl, { signal, credentials: "include" });
  };
}
