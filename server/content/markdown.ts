import { unified } from "unified";
import remarkParse from "remarkParse";
import remarkFrontmatter from "remarkFrontmatter";
import remarkDirective from "remarkDirective";

import { Root } from "./MdastNode.ts";

const pipeline = unified()
  // @ts-ignore: remarkParse definitions are not correct
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkDirective);

export const parseMd = (md: string) => {
  return pipeline.parse(md) as Root;
};
