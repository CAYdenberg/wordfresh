import { useCallback, useState } from "https://esm.sh/preact@10.20.1/hooks";
import useIsMounted from "./useIsMounted.ts";

export enum Status {
  Ready = "Ready",
  Loading = "Loading",
  Ok = "Ok",
  Error = "Error",
}

interface State<DTy> {
  status: Status;
  data?: DTy;
  error?: number;
}

export const useFetch = <DTy>(
  initialData?: DTy,
) => {
  const isMounted = useIsMounted();
  const [state, setState] = useState<State<DTy>>({
    data: initialData,
    status: initialData ? Status.Ok : Status.Ready,
  });

  const doRequest = useCallback((url: string) => {
    setState((init) => ({
      ...init,
      status: Status.Loading,
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
          status: Status.Error,
          error: res.status,
        }));
        return;
      }
      return res.json();
    }).then((data: DTy | undefined) => {
      if (data) {
        setState(() => ({
          status: Status.Ok,
          data,
        }));
      }
    }).catch(() => {
      if (!isMounted) return;
      setState((init) => ({
        ...init,
        status: Status.Error,
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
