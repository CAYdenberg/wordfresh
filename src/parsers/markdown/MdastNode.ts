/**
 * Root
 */
export interface Root {
  type: "root";
  children: Block[];
}

/**
 * BLOCKS
 */
export interface Yaml {
  type: "yaml";
  value: string;
}

export interface Heading {
  type: "heading";
  depth: number;
  children: Inline[];
}

interface Paragraph {
  type: "paragraph";
  children: Inline[];
}

export interface List {
  type: "list";
  ordered: boolean;
  children: Array<ListItem>;
}

interface ListItem {
  type: "listItem";
  children: [Paragraph | List];
}

interface Blockquote {
  type: "blockquote";
  children: Paragraph[];
}

export type Lang =
  | "typescript"
  | "javascript"
  | "jsx"
  | "tsx"
  | "css"
  | "html"
  | "python"
  | "php";

interface Code {
  type: "code";
  value: string;
  lang: Lang;
}

interface ThematicBreak {
  type: "thematicBreak";
}

export interface LeafDirective {
  type: "leafDirective";
  name: string;
  // deno-lint-ignore no-explicit-any
  attributes: Record<string, any>;
}

type Block =
  | Yaml
  | Heading
  | Paragraph
  | Blockquote
  | List
  | ListItem
  | Code
  | ThematicBreak
  | LeafDirective;

/**
 * Inline and text
 */

interface Link {
  type: "link";
  url: string;
  children: Inline[];
}

interface Emphasis {
  type: "emphasis";
  children: Inline[];
}

interface Strong {
  type: "strong";
  children: Inline[];
}

export interface TextDirective {
  type: "textDirective";
  name: string;
  // deno-lint-ignore no-explicit-any
  attributes: Record<string, any>;
  children: Inline[];
}

export interface Text {
  type: "text";
  value: string;
}

export interface InlineCode {
  type: "inlineCode";
  value: string;
}

export interface Image {
  type: "image";
  url: string;
  alt: string;
}

type Inline =
  | Link
  | Emphasis
  | Strong
  | TextDirective
  | Text
  | InlineCode
  | Image;

export type Branch = Paragraph;

export type Leaf =
  | Yaml
  | ThematicBreak
  | LeafDirective
  | Text
  | Code
  | InlineCode
  | Image;

export type MdastNode = Root | Block | Inline;

export const isLeaf = (node: MdastNode): node is Leaf => {
  return !(node as Root).children;
};

export const isComponent = (
  node: MdastNode,
): node is LeafDirective | TextDirective => {
  return ["mdxJsxFlowElement", "mdxTextExpression"].includes(node.type);
};
