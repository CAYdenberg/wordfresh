import { useState, useCallback } from "preact/hooks";
import { stringify } from "querystring";

import useIsMounted from "./useIsMounted.ts";

import type { Schema, ResolvedIsoquery } from "../mod.ts";

const useIsoquery = <S extends Schema>(
  baseUrl: string,
  query?: ResolvedIsoquery<S>
) => {
  const modelName = query?.modelName || "";
  const [value, setValue] = useState(query?.results || []);
  const [error, setError] = useState(query?.error || false);
  const [isLoading, setIsLoading] = useState(false);
  const isMounted = useIsMounted();

  const resolve = useCallback(async (params: Record<string, unknown>) => {
    setIsLoading(true);
    setError(false);

    try {
      const res = await fetch(`${baseUrl}?${stringify(params)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!isMounted) return;

      setIsLoading(false);
      if (res.status < 400) {
        const body = await res.json();
        setValue(body);
        setError(false);
        return;
      }
      setError(true);
    } catch (_e: unknown) {
      if (!isMounted) return;

      setError(true);
    }
  }, []);

  return {
    modelName,
    value,
    error,
    isLoading,
    resolve,
  };
};

export default useIsoquery;
