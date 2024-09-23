import {
  mdxjs,
  fromMarkdown,
  mdxFromMarkdown,
  frontmatter,
  frontmatterFromMarkdown,
} from "../../deps.ts";
import type { Root } from "./MdastNode.ts";

export const parseMdx = (md: string) => {
  return fromMarkdown(md, {
    extensions: [mdxjs(), frontmatter(["yaml"])],
    mdastExtensions: [mdxFromMarkdown(), frontmatterFromMarkdown(["yaml"])],
  }) as Root;
};
