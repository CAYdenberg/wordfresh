import {
  useCallback,
  useEffect,
  useRef,
} from "https://esm.sh/preact@10.20.1/hooks";

import type { WfGetQuery, WfGetQueryResolved } from "src";

import { useFetch } from "./useFetch.ts";

const serializeQuery = (apiPath: string, query: WfGetQuery) => {
  const search = query.query?.startsWith("?")
    ? query.query.slice(1)
    : query.query;
  return `${apiPath}/${query.modelName}${search ? `?${search}` : ""}`;
};

export const useWfQuery = <S>(
  query: WfGetQueryResolved<S>,
  apiPath = "/api",
) => {
  const fetch = useFetch<S[]>(query.data);

  const url = serializeQuery(apiPath, query);
  const prevUrl = useRef(url);
  useEffect(() => {
    if (!fetch.data || prevUrl.current !== url) {
      fetch.doRequest(url);
    }
    prevUrl.current = url;
  }, [url]);

  const retry = useCallback(() => {
    fetch.doRequest(url);
  }, [url]);

  return {
    query: {
      ...query,
      data: fetch.data,
    },
    status: fetch.status,
    error: fetch.error,
    retry,
  };
};
