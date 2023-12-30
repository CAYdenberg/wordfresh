import { unified } from "https://esm.sh/unified@10.1.2";
import remarkParse from "https://esm.sh/remark-parse@10.0.2";
import remarkFrontmatter from "https://esm.sh/remark-frontmatter@4.0.1";
import remarkDirective from "https://esm.sh/remark-directive@2.0.1";

import { Root } from "./MdastNode.ts";

const pipeline = unified()
  // @ts-ignore: remarkParse definitions are not correct
  .use(remarkParse)
  .use(remarkFrontmatter, ["yaml"])
  .use(remarkDirective);

export const parseMd = (md: string) => {
  return pipeline.parse(md) as Root;
};
