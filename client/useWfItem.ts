import {
  useCallback,
  useEffect,
  useRef,
} from "https://esm.sh/preact@10.20.1/hooks";
import { useFetch } from "./useFetch.ts";
import type { WfGetItem, WfGetItemResolved } from "../src/index.ts";

const serializeQuery = (apiPath: string, query: WfGetItem) => {
  return `${apiPath}/${query.modelName}/${query.slug}`;
};

export const useWfItem = <S>(
  query: WfGetItemResolved<S>,
  apiPath = "/api",
) => {
  const fetch = useFetch<S>(query.data);

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
