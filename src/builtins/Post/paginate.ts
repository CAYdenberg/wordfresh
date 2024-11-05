import { parse, stringify, z } from "../../deps.ts";

export interface Pagination {
  page: number;
  totalPages: number | null;
  params: {
    limit: number;
    skip: number;
  };
  url: {
    first: string | null;
    prev: string | null;
    next: string | null;
    last: string | null;
  };
  summary: {
    from: number;
    to: number;
    of: number | null;
  };
}

export const paginate =
  (perPage: number, total?: number) => (url: URL | string): Pagination => {
    const urlParts = typeof url === "string" ? new URL(url) : url;
    const params = parse(urlParts.search);
    const parsed = z.coerce.number().safeParse(params.page);
    const page = parsed.success && parsed.data ? Math.floor(parsed.data) : 1;

    const createUrl = (page: number) =>
      `${urlParts.origin}${urlParts.pathname}?${
        stringify({
          ...params,
          page,
        })
      }`;

    const isLastPage = !!total && total <= perPage * page;

    return {
      page,
      totalPages: total ? Math.ceil(total / perPage) : null,
      params: {
        limit: perPage,
        skip: (page - 1) * perPage,
      },
      url: {
        first: page > 1 ? createUrl(1) : null,
        prev: page > 1 ? createUrl(page - 1) : null,
        next: !isLastPage ? createUrl(page + 1) : null,
        last: total && !isLastPage
          ? createUrl(Math.ceil(total / perPage))
          : null,
      },
      summary: {
        from: (page - 1) * perPage + 1,
        to: total ? Math.min(perPage * page, total) : perPage * page,
        of: total || null,
      },
    };
  };
