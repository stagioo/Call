export type Params = Record<string, string | number | null | undefined>;

export interface CreateRequestOptions {
  path: string;
  pathParams?: Params;
  queryParams?: Params;
}

export interface UseRequestParams {
  request: (signal: AbortSignal) => Promise<Response>;
  triggers?: unknown[];
  manual?: boolean;
}

export interface UseRequestReturn<ResponseBody> {
  data: ResponseBody | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}
