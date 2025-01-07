import { useCallback, useState } from "https://esm.sh/preact@10.20.1/hooks";
import { useIsMounted } from "./useIsMounted.ts";

export enum FetchStatus {
  Ready = "Ready",
  Loading = "Loading",
  Ok = "Ok",
  Error = "Error",
}

interface State<DTy> {
  status: FetchStatus;
  data?: DTy;
  error?: number;
}

export const useFetch = <DTy>(
  initialData?: DTy,
) => {
  const isMounted = useIsMounted();
  const [state, setState] = useState<State<DTy>>({
    data: initialData,
    status: initialData ? FetchStatus.Ok : FetchStatus.Ready,
  });

  const doRequest = useCallback((url: string) => {
    setState((init) => ({
      ...init,
      FetchStatus: FetchStatus.Loading,
    }));

    fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }).then((res) => {
      if (!isMounted) return;
      if (res.status >= 400) {
        setState((init) => ({
          ...init,
          status: FetchStatus.Error,
          error: res.status,
        }));
        return;
      }
      return res.json();
    }).then((data: DTy | undefined) => {
      if (data) {
        setState(() => ({
          status: FetchStatus.Ok,
          data,
        }));
      }
    }).catch(() => {
      if (!isMounted) return;
      setState((init) => ({
        ...init,
        FetchStatus: FetchStatus.Error,
        error: 0,
      }));
    });
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    doRequest,
  };
};
