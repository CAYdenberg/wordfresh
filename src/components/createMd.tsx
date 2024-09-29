import { FunctionComponent } from "../deps.ts";
import { config } from "../plugin/config.ts";

import { slugify } from "../parsers/slugify.ts";
import {
  flattenTree,
  isLeaf,
  Mdast,
  selectNodes,
} from "../parsers/markdown/index.ts";
import highlightCode from "./helpers/Prism.ts";

// We use "any" here for props, because we do not know the type of the
// components which are added by the user

// deno-lint-ignore no-explicit-any
type AnyResolvedData = any;

export type UserDefinedComponents = Record<
  string,
  FunctionComponent<
    // deno-lint-ignore no-explicit-any
    any
  >
>;

export const createMd = (
  userDefinedComponents: UserDefinedComponents = {},
) => {
  const MdComponent: FunctionComponent<{
    node: Mdast.MdastNode;
    data?: AnyResolvedData[];
  }> = ({ node, data }) => {
    if (node.type === "text") {
      return <span>{node.value}</span>;
    }
    if (node.type === "inlineCode") {
      return <code>{node.value}</code>;
    }

    if (
      node.type === "paragraph" &&
      node.children.length === 1 &&
      node.children[0].type === "image"
    ) {
      return <MdComponent node={node.children[0]} data={data} />;
    }

    const childNodes = isLeaf(node)
      ? null
      : node.children.map((node) => <MdComponent node={node} data={data} />);

    switch (node.type) {
      case "heading": {
        const plaintext = selectNodes(flattenTree(node))<Mdast.Text>("text")
          .map((node) => node.value)
          .join("");
        const slug = slugify(plaintext);
        return (
          <MdHeading node={node}>
            <a id={`#${slug}`} href={`#${slug}`}>
              {childNodes}
            </a>
          </MdHeading>
        );
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
            <code
              dangerouslySetInnerHTML={{
                __html: highlightCode(node.value, node.lang),
              }}
            />
          </pre>
        );
      }

      case "list": {
        return <MdList node={node} data={data} />;
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

      case "mdxJsxFlowElement":
      case "mdxTextExpression": {
        if (!node.name) return null;
        const Component = userDefinedComponents[node.name];
        if (!Component) return null;

        const props = node.attributes.reduce((acc, prop) => {
          acc[prop.name] = prop.value;
          return acc;
          // deno-lint-ignore no-explicit-any
        }, {} as Record<string, any>);

        return (
          <Component {...props}>
            {childNodes}
          </Component>
        );
      }
    }

    return childNodes ? <>{childNodes}</> : null;
  };

  const MdHeading: FunctionComponent<{ node: Mdast.Heading }> = ({
    node,
    children,
  }) => {
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

  const MdList: FunctionComponent<{
    node: Mdast.List;
    data?: AnyResolvedData[];
  }> = ({ node, data }) => {
    const children = node.children.map((child) => (
      <li>
        <MdComponent node={child} data={data} />
      </li>
    ));

    return node.ordered ? <ol>{children}</ol> : <ul>{children}</ul>;
  };

  return MdComponent;
};
