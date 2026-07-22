export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Builds a consistent pagination envelope used across every module
 * (Users, Courses, Orders, Reviews, ...) so the frontend can rely on
 * one shared shape for all list endpoints.
 */
export function buildPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
