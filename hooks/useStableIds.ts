import { useRef } from "https://esm.sh/preact@10.20.1/hooks";

const uids = (n: number) => {
  return Array(n)
    .fill(null)
    .map(() => Math.random().toString(16).slice(2));
};

const useStableIds = (numNeeded = 1): string[] => {
  const stableIds = useRef<string[]>(uids(numNeeded));
  const extra = numNeeded - stableIds.current.length;
  if (extra > 0) {
    stableIds.current = stableIds.current.concat(uids(extra));
  }

  return stableIds.current;
};

export default useStableIds;
