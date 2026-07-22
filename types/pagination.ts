export const DEFAULT_PAGE_SIZE = 10;
export const REFERENCE_PAGE_SIZE = 100;

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface PageResult<T> extends PageRequest {
  items: T[];
  total: number;
}
