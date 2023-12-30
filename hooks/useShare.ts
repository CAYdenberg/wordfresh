import { IS_BROWSER } from "https://deno.land/x/fresh@1.6.1/runtime.ts";
import {
  useState,
  useEffect,
  useCallback,
} from "https://esm.sh/preact@10.19.2/hooks";

interface ShareData {
  url: string;
  title?: string;
  text?: string;
}

const useShare = (data: ShareData) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!IS_BROWSER) return;

    if (navigator.canShare && navigator.canShare(data)) {
      setShow(true);
    }
  }, []);

  const handleShare = useCallback(() => {
    navigator.share(data);
  }, [data]);

  return show ? handleShare : null;
};

export default useShare;
