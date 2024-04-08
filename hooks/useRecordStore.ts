import { useState, useCallback } from "https://esm.sh/preact@10.20.1/hooks";

import useIsMounted from "./useIsMounted.ts";

import type { Schema, WithSlug } from "../server/mod.ts";

interface RecordStoreItem<S extends Schema> {
  isLoading: boolean;
  error: boolean;
  data: S | null;
}

type RecordStore<S extends Schema> = Record<string, RecordStoreItem<S>>;

interface StoreUpdate<S extends Schema> extends Partial<RecordStoreItem<S>> {
  id: string;
}

const updateRecordStore =
  <S extends Schema>(newItems: StoreUpdate<S>[]) =>
  (initial: RecordStore<S>) => {
    return {
      ...initial,
      ...newItems.reduce((acc, item) => {
        const existing: RecordStoreItem<S> | undefined = initial[item.id];
        acc[item.id] = {
          ...existing,
          ...item,
        };
        return acc;
      }, {} as RecordStore<S>),
    };
  };

const useRecordStore = <S extends Schema>(
  baseUrl: string,
  initial?: WithSlug<S>[]
) => {
  const [data, update] = useState<RecordStore<S>>(
    updateRecordStore(
      initial?.map((item) => ({
        data: item,
        id: item.slug,
        error: false,
        isLoading: false,
      })) || []
    )({})
  );
  const isMounted = useIsMounted();

  const resolve = useCallback(async (ids: string[]) => {
    update(
      updateRecordStore(
        ids.map((id) => ({
          id,
          isLoading: true,
          error: false,
        }))
      )
    );

    try {
      const res = await fetch(`${baseUrl}/${ids.join(",")}`);

      if (res.status >= 400) {
        throw new Error(`Status: ${res.status}`);
      }

      const body = await res.json();

      if (!isMounted) return;

      update(
        updateRecordStore(
          body.map((data: WithSlug<S>) => ({
            id: data.slug,
            isLoading: false,
            error: false,
            data,
          }))
        )
      );
    } catch (_e: unknown) {
      if (!isMounted) return;

      update(
        updateRecordStore(
          ids.map((id) => ({
            id,
            error: true,
            isLoading: false,
          }))
        )
      );
    }
  }, []);

  return {
    data,
    resolve,
  };
};

export default useRecordStore;
