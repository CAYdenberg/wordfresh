import { FunctionComponent } from "../deps.ts";

import { ResolvedIsoquery } from "../Isoquery.ts";
import highlightCode from "./Prism.ts";

import { Heading, isLeaf, Lang, List, MdastNode } from "./MdastNode.ts";
import { getConfig } from "../mod.ts";

export type DirectiveComponents = Record<
  string,
  FunctionComponent<
    // deno-lint-ignore no-explicit-any
    { baseUrl: string; query?: ResolvedIsoquery<any> } & Record<string, any>
  >
>;

export const createMdComponent = (
  directives: DirectiveComponents,
) => {
  const MdComponent: FunctionComponent<
    // deno-lint-ignore no-explicit-any
    { node: MdastNode; queries: ResolvedIsoquery<any>[] }
  > = (
    { node, queries },
  ) => {    
    if (node.type === "text") {
      return <span>{node.value}</span>;
    }
    if (node.type === "inlineCode") {
      return <code>{node.value}</code>;
    }


    if (node.type === 'paragraph' && 
      node.children.length === 1 && 
      node.children[0].type === 'image'
    ) {
      return <MdComponent node={node.children[0]} queries={queries} />;
    }

    const childNodes = isLeaf(node)
      ? null
      : node.children.map((node) => (
        <MdComponent node={node} queries={queries} />
      ));

    switch (node.type) {
      case "heading": {
        return <MdHeading node={node}>{childNodes}</MdHeading>;
      }

      case "paragraph": {
        return <p>{childNodes}</p>;
      }

      case "link": {
        return <a href={node.url}>{childNodes}</a>;
      }

      case "code": {
        return (
          <pre data-lang={node.lang} className={`language-${node.lang}`}>
            <code dangerouslySetInnerHTML={{
              __html: highlightCode(node.value, node.lang)
            }} />
          </pre>
        );
      }

      case "list": {
        return <MdList node={node} queries={queries} />;
      }

      case "blockquote": {
        return <blockquote>{childNodes}</blockquote>;
      }

      case "thematicBreak": {
        return <hr />;
      }

      case "emphasis": {
        return <em>{childNodes}</em>;
      }

      case "strong": {
        return <strong>{childNodes}</strong>;
      }

      case "image": {
        return <img src={node.url} alt={node.alt} />;
      }

      case "textDirective": {
        if (!node.name || !node.attributes) return null;
        const Component = directives[node.name];
        if (!Component) return null;

        const baseUrl =
          `${getConfig().siteUrl}/api/${node.attributes.modelName}`;
        const query = queries.find((q) =>
          q.modelName === node.attributes.modelName &&
          q.slug === node.attributes.slug &&
          q.query === node.attributes.query
        );
        return (
          <Component {...node.attributes} baseUrl={baseUrl} query={query}>
            {childNodes}
          </Component>
        );
      }

      case "leafDirective": {
        if (!node.name || !node.attributes) return null;
        const Component = directives[node.name];
        if (!Component) return null;

        const baseUrl =
          `${getConfig().siteUrl}/api/${node.attributes.modelName}`;
        const query = queries.find((q) =>
          q.modelName === node.attributes.modelName &&
          q.slug === node.attributes.slug &&
          q.query === node.attributes.query
        );
        return <Component baseUrl={baseUrl} query={query} />;
      }
    }

    return childNodes ? <>{childNodes}</> : null;
  };

  const MdHeading: FunctionComponent<{ node: Heading }> = (
    { node, children },
  ) => {
    switch (node.depth) {
      case 3:
        return <h3>{children}</h3>;
      case 4:
        return <h4>{children}</h4>;
      case 5:
        return <h5>{children}</h5>;
      case 6:
        return <h6>{children}</h6>;
    }
    return <h2>{children}</h2>;
  };

  const MdList: FunctionComponent<
    // deno-lint-ignore no-explicit-any
    { node: List; queries: ResolvedIsoquery<any>[] }
  > = ({ node, queries }) => {
    const children = node.children.map((child) => (
      <li>
        <MdComponent node={child} queries={queries} />
      </li>
    ));

    return node.ordered ? <ol>{children}</ol> : <ul>{children}</ul>;
  };

  return MdComponent;
};
