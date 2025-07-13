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

export interface SideBarProps {
  section: string;
  onSectionChange: (section: string) => void;
}

export interface SendInvitationContactsProps {
  open: boolean;
  onClose: () => void;
}

export interface Contributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
  type: string;
}

