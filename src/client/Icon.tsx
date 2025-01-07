import type { FunctionComponent } from "../deps.ts";
import { classNames as cn } from "./utils.ts";

export interface IconProps {
  // can't find Lucide types anywhere
  // deno-lint-ignore no-explicit-any
  icon: FunctionComponent<any>;
  size?: number;
  className: string;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}

export const Icon: FunctionComponent<IconProps> = (props) => {
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
