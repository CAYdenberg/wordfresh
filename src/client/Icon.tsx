import type { LucideProps } from "https://esm.sh/lucide-preact@0.461.0/";
import type { FunctionComponent } from "../deps.ts";
import { classNames as cn } from "./utils.ts";

interface Props extends LucideProps {
  icon: FunctionComponent<LucideProps>;
  size: number;
  className: string;
}

export const Icon: FunctionComponent<LucideProps> = (props) => {
  const Icon = props.icon;

  return (
    <div className={cn(props.className, "wf-icon")}>
      <Icon
        width={props.size || "1em"}
        height={props.size || "1em"}
        color={props.color}
        strokeWidth={props.strokeWidth}
        absoluteStrokeWidth={props.absoluteStrokeWidth}
      />
    </div>
  );
};
