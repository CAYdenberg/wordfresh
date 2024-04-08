import { useState, useCallback } from "https://esm.sh/preact@10.20.1/hooks";
import { stringify } from "https://deno.land/x/querystring@v1.0.2/mod.js";

import useIsMounted from "./useIsMounted.ts";

import type { Schema, ResolvedIsoquery } from "../server/mod.ts";

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
