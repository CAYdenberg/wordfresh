import { JSX } from "preact/jsx-runtime";

interface Props {
  children: JSX.Element;
}

export default function BlockWithChildren({ children }: Props) {
  return (
    <div
      style={{ background: "yellow", color: "blue" }}
    >
      {children}
    </div>
  );
}
