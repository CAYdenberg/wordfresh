import { parseYaml } from "../../deps.ts";
import { isLeaf, LeafDirective, TextDirective } from "./MdastNode.ts";
import { parseWf } from "../../db/index.ts";

import type { TyPostSchema } from "../../builtins/index.ts";
import type { MdastNode, Root, Text, Yaml } from "./MdastNode.ts";

export const flattenTree = (tree: MdastNode): MdastNode[] => {
  let nodes: MdastNode[] = [];

  const recur = (node: MdastNode) => {
    nodes = [...nodes, node];
    if (!isLeaf(node)) {
      node.children.forEach((node) => recur(node));
    }
  };
  recur(tree);

  return nodes;
};

export const selectNodes =
  (nodes: MdastNode[]) => <T extends MdastNode>(...types: string[]) => {
    return nodes.filter((node) => types.includes(node.type)) as T[];
  };

const normalDate = (date?: string) =>
  date ? new Date(date).toISOString() : undefined;

export const getPostMetadata = (content: Root): Partial<TyPostSchema> => {
  const selector = selectNodes(flattenTree(content));
  const yaml = selector<Yaml>("yaml");

  // deno-lint-ignore no-explicit-any
  const data = yaml?.length ? parseYaml(yaml[0].value) : {} as any;

  const content_text = selector<Text>("text")
    .map((node) => node.value)
    .join(" ");

  return {
    title: data.title,
    summary: data.summary,
    image: data.image,
    banner_image: data.banner_image,
    date_published: normalDate(data.date_published),
    external_url: data.external_url,
    content_text,
  };
};

export const getWfRequests = (content: Root): string[] => {
  const selector = selectNodes(flattenTree(content));
  const directives = selector<LeafDirective | TextDirective>(
    "leafDirective",
    "textDirective",
  );
  return directives.reduce((acc, directive) => {
    const wf = Object.keys(directive.attributes).reduce((acc, key) => {
      const value = directive.attributes[key];
      if (typeof value !== "string") return acc;
      if (!parseWf(value)) return acc;
      return [...acc, value];
    }, [] as string[]);
    return [...acc, ...wf];
  }, [] as string[]);
};
