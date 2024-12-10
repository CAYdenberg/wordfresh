import { parse, stringify, z } from "../deps.ts";
import type { FreshContext } from "../deps.ts";

import {
  resolveItem,
  resolveQuery,
  type WfGetItemResolved,
  type WfGetQueryResolved,
} from "../db/index.ts";
import { WfError } from "../db/WfError.ts";

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

interface QueryPipeArgs<Data> {
  request: Request;
  context: FreshContext;
  wfGet: WfGetQueryResolved<Data>;
  pagination?: Pagination;
}

interface QueryPipeReturn<Data> {
  wfGet: WfGetQueryResolved<Data>;
  pagination?: Pagination;
}

export type QueryPipe<Data> = (
  args: QueryPipeArgs<Data>,
) => Promise<QueryPipeReturn<Data>>;

export const createQueryPipeline = <Data>(
  modelName: string,
  request: Request,
  context: FreshContext,
) => {
  const recur = (
    previousPromise: Promise<{
      wfGet: WfGetQueryResolved<Data>;
      pagination?: Pagination;
    }>,
  ) => ({
    pipe: (fn: QueryPipe<Data>) => {
      const promise = new Promise<QueryPipeReturn<Data>>(
        (resolve, reject) => {
          previousPromise.then((result) => {
            resolve(fn({ ...result, request, context }));
          }).catch(reject);
        },
      );

      return recur(promise);
    },

    render: () => {
      return previousPromise.then(({ wfGet, pagination }) => {
        if (!wfGet.data) {
          return context.renderNotFound();
        }
        return context.render({
          items: wfGet.data,
          pagination,
        });
      });
    },

    toHttp: () => {
      return previousPromise.then(({ wfGet }) => {
        if (!wfGet.data) {
          return new Response(JSON.stringify([]), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
        return new Response(JSON.stringify(wfGet.data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }).catch((err: WfError | Error | unknown) => {
        if ((err as WfError).isWfError) {
          return (err as WfError).toHttp();
        }
        throw err;
      });
    },

    data: () => {
      return previousPromise.then(({ wfGet }) => {
        if (!wfGet.data) {
          throw new WfError(404, `WfData on ${modelName} not resolved`);
        }
        return wfGet.data;
      });
    },

    pagination: () => {
      return previousPromise.then(({ pagination }) => {
        if (!pagination) {
          throw new WfError(
            500,
            `No pagination pipe fn applied on ${modelName}`,
          );
        }
        return pagination;
      });
    },
  });

  const url = new URL(request.url);
  const promise = new Promise<{
    wfGet: WfGetQueryResolved<Data>;
    pagination?: Pagination;
  }>((resolve, reject) => {
    resolveQuery<Data>({
      modelName,
      query: url.search,
    }).then((wfGet) => {
      resolve({
        wfGet,
        pagination: undefined,
      });
    }).catch(reject);
  });

  return recur(promise);
};

export const paginate = <Data>(perPage: number): QueryPipe<Data> =>
(
  { request, wfGet },
) => {
  const url = new URL(request.url);
  const params = parse(url.search);
  const parsed = z.coerce.number().safeParse(params.page);
  const page = parsed.success && parsed.data ? Math.floor(parsed.data) : 1;
  const total: number = Array.isArray(wfGet.data) ? wfGet.data.length : 0;

  const createUrl = (page: number) =>
    `${url.origin}${url.pathname}?${
      stringify({
        ...params,
        page,
      })
    }`;

  const isLastPage = !!total && total <= perPage * page;

  const pagination: Pagination = {
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
      last: total && !isLastPage ? createUrl(Math.ceil(total / perPage)) : null,
    },
    summary: {
      from: (page - 1) * perPage + 1,
      to: total ? Math.min(perPage * page, total) : perPage * page,
      of: total || null,
    },
  };

  return Promise.resolve({
    wfGet,
    pagination,
  });
};

interface ItemPipeArgs<Data> {
  request: Request;
  context: FreshContext;
  wfGet: WfGetItemResolved<Data>;
}

export type ItemPipe<Data> = (
  args: ItemPipeArgs<Data>,
) => Promise<WfGetItemResolved<Data>>;

export const createItemPipeline = <Data>(
  modelName: string,
  request: Request,
  context: FreshContext,
  slugParamName = "slug",
) => {
  const recur = (
    previousPromise: Promise<
      WfGetItemResolved<Data>
    >,
  ) => ({
    pipe: (fn: ItemPipe<Data>) => {
      const promise = new Promise<WfGetItemResolved<Data>>(
        (resolve, reject) => {
          previousPromise.then((wfGet) => {
            resolve(fn({ wfGet, request, context }));
          }).catch(reject);
        },
      );

      return recur(promise);
    },

    render: () => {
      return previousPromise.then((wfGet) => {
        if (!wfGet.data) {
          return context.renderNotFound();
        }
        return context.render({
          item: wfGet.data,
        });
      });
    },

    toHttp: () => {
      return previousPromise.then((wfGet) => {
        if (!wfGet.data) {
          return new Response(JSON.stringify(null), {
            status: 404,
            headers: {
              "Content-Type": "application/json",
            },
          });
        }
        return new Response(JSON.stringify(wfGet.data), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }).catch((err: WfError | Error | unknown) => {
        if ((err as WfError).isWfError) {
          return (err as WfError).toHttp();
        }
        throw err;
      });
    },

    toResponse: (
      cb: (wfGet: WfGetItemResolved<Data>) => Response | Promise<Response>,
    ) => {
      return previousPromise.then((wfGet) => cb(wfGet)).catch(
        (err: WfError | Error | unknown) => {
          if ((err as WfError).isWfError) {
            return (err as WfError).toHttp();
          }
          throw err;
        },
      );
    },

    data: () => {
      return previousPromise.then((wfGet) => {
        if (!wfGet.data) {
          throw new WfError(404, `WfData on ${modelName} not resolved`);
        }
        return wfGet.data;
      });
    },
  });

  const promise = new Promise<WfGetItemResolved<Data>>((resolve, reject) => {
    const slug: string = context.params[slugParamName];
    const match = z.string().safeParse(slug);
    if (!match.success) {
      reject(
        new WfError(
          400,
          `Missing parameter slug in Fresh Context on ${modelName}`,
        ),
      );
    }

    resolveItem<Data>({
      modelName,
      slug: context.params[slugParamName],
    }).then((wfGet) => resolve(wfGet)).catch(reject);
  });

  return recur(promise);
};
