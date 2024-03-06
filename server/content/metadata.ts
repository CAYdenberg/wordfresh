import { parseYaml } from "../deps.ts";
import { TPostSchema } from "../Post.tsx";
import { Isoquery } from "../Isoquery.ts";

import {
  MdastNode,
  Root,
  Yaml,
  Text,
  isLeaf,
  isDirective,
} from "./MdastNode.ts";

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
  (nodes: MdastNode[]) =>
  <T extends MdastNode>(type: string) => {
    return nodes.filter((node) => node.type === type) as T[];
  };

const normalDate = (date?: string) =>
  date ? new Date(date).toISOString() : undefined;

export const getPostMetadata = (content: Root): Partial<TPostSchema> => {
  const selector = selectNodes(flattenTree(content));
  const yaml = selector<Yaml>("yaml");

  const data = (yaml?.length ? parseYaml(yaml[0].value) : {}) as {
    [key in keyof TPostSchema]: string;
  };

  const content_text = selector<Text>("text")
    .map((node) => node.value)
    .join("");

  return {
    title: data.title,
    summary: data.summary,
    image: data.image,
    banner_image: data.banner_image,
    date_published: normalDate(data.date),
    external_url: data.external_url,
    content_text,
  };
};

export const getQueries = (content: Root): Isoquery[] => {
  const nodes = flattenTree(content);

  return nodes
    .map((node) => {
      if (isDirective(node) && node.attributes?.modelName) {
        return {
          modelName: node.attributes.modelName,
          slug: node.attributes.slug,
          query: node.attributes.query,
        };
      }

      return null;
    })
    .filter(Boolean) as Array<{
    modelName: string;
    slug?: string;
    query?: string;
  }>;
};
