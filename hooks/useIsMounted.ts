import { useEffect, useRef } from "https://esm.sh/preact@10.20.1/hooks";

const useIsMounted = () => {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  });

  return isMounted.current;
};

export default useIsMounted;
