import { z } from 'zod/v4';

/**
 * Shared server-side DataTables query schema.
 *
 * DataTables sends the wire format `search[value]`, `order[0][column]` and
 * `order[0][dir]` as flat URLSearchParams keys, so the schema reads them
 * directly instead of expecting a nested object (which the URL format can
 * never produce).
 */
export const dataTablesQuerySchema = z.object({
  draw: z.coerce.number().default(1),
  start: z.coerce.number().default(0),
  length: z.coerce.number().default(10),
  'search[value]': z.string().default(''),
  'order[0][column]': z.coerce.number().default(0),
  'order[0][dir]': z.enum(['asc', 'desc']).default('desc'),
});

export type DataTablesQuery = z.infer<typeof dataTablesQuerySchema>;

/** Escape a string for safe use inside a RegExp (protects $regex queries). */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface PaginateParams {
  draw: number;
  start: number;
  length: number;
  search?: string;
  order?: { column: number; dir: 'asc' | 'desc' }[];
  /** Pre-built filter, merged with the search $or clause. */
  filter?: Record<string, unknown>;
  /** Fields searched with a case-insensitive regex when `search` is provided. */
  searchFields?: string[];
  /** Column names indexed by DataTables `order[].column`. */
  sortColumns?: string[];
  /** Mongoose `.select()` projection string. */
  select?: string;
}

/**
 * Executes a DataTables-style count/filter/sort/page query against a Mongoose
 * model and returns the `{ draw, recordsTotal, recordsFiltered, data }` shape.
 * Data is returned raw (lean); callers serialize dates / _id as needed.
 *
 * @template T Document shape of the queried collection.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose models share a common query-chain API not worth typing structurally
export async function paginate<T>(model: any, params: PaginateParams): Promise<{
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: T[];
}> {
  const filter: Record<string, unknown> = { ...params.filter };
  if (params.search && params.searchFields?.length) {
    const escaped = escapeRegex(params.search);
    filter.$or = params.searchFields.map(field => ({
      [field]: { $regex: escaped, $options: 'i' },
    }));
  }

  const recordsTotal = await model.countDocuments({});
  const recordsFiltered = await model.countDocuments(filter);

  const sortColumn = params.sortColumns?.[params.order?.[0]?.column ?? 0] ?? 'createdAt';
  const sortDir = params.order?.[0]?.dir === 'asc' ? 1 : -1;

  let query = model
    .find(filter)
    .sort({ [sortColumn]: sortDir })
    .skip(params.start)
    .limit(params.length);
  if (params.select) query = query.select(params.select);

  return {
    draw: params.draw,
    recordsTotal,
    recordsFiltered,
    data: (await query.lean()) as T[],
  };
}
