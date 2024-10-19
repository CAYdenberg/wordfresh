import { JSX } from "preact/jsx-runtime";
import { FunctionComponent } from "../src/deps.ts";

interface Props {
  children: JSX.Element;
}

const BlockWithChildren: FunctionComponent<Props> = (
  { children }: Props,
) => {
  return (
    <div
      style={{ background: "yellow", color: "blue" }}
    >
      {children}
    </div>
  );
};

export default BlockWithChildren;
