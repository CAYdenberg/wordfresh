import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "https://esm.sh/lucide-preact@0.468.0/?exports=ChevronFirst,ChevronLeft,ChevronRight,ChevronLast";

import type { Pagination } from "../builtins/Post/paginate.ts";
import type { FunctionComponent } from "../deps.ts";
import { Icon } from "./Icon.tsx";
import { classNames as cn } from "src/client/utils.ts";

interface Props extends Pagination {
  className?: {
    root?: string;
    button?: string;
    disabledButton?: string;
    text?: string;
  };
}

export const Paginator: FunctionComponent<Props> = (
  { url, summary, className },
) => {
  return (
    <div className={cn(className?.root, "wf-paginator")}>
      <a href={url.first || undefined}>
        <Icon
          icon={ChevronFirst}
          className={cn(
            className?.button,
            url.first ? null : className?.disabledButton,
            "wf-paginator__button",
          )}
        />
      </a>
      <a href={url.prev || undefined}>
        <Icon
          icon={ChevronLeft}
          className={cn(
            className?.button,
            url.prev ? null : className?.disabledButton,
            "wf-paginator__button",
          )}
        />
      </a>
      <p className={cn(className?.text, "wf-paginator__text")}>
        <span>Showing items</span> <span>{summary.from}—{summary.to}</span>
        {summary.of ? <span>{" "}of {summary.of}.</span> : <span>.</span>}
      </p>
      <a href={url.next || undefined}>
        <Icon
          icon={ChevronRight}
          className={cn(
            className?.button,
            url.next ? null : className?.disabledButton,
            "wf-paginator__button",
          )}
        />
      </a>
      <a href={url.last || undefined}>
        <Icon
          icon={ChevronLast}
          className={cn(
            className?.button,
            url.last ? null : className?.disabledButton,
            "wf-paginator__button",
          )}
        />
      </a>
    </div>
  );
};
