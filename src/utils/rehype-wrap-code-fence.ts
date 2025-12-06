import type { Plugin } from "unified";
import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";

const CODE_CLASS = "astro-code";

/**
 * Check if a hast element is a code block.
 */
function isAstroCode(element: Element): boolean {
  if (element.tagName !== "pre") {
    return false;
  }

  const classes = element.properties?.class;
  if (typeof classes == "string") {
    const regex = new RegExp(`\\b${CODE_CLASS}\\b`);
    return regex.test(classes);
  } else if (Array.isArray(classes)) {
    return classes.includes(CODE_CLASS);
  }

  return false;
}

const rehypeWrapCodeFence: Plugin<[string[]], Root> = classNames => {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      if (parent && index !== undefined && isAstroCode(node)) {
        const wrapper: Element = {
          type: "element",
          tagName: "div",
          properties: { className: classNames },
          children: [node],
        };

        parent.children[index] = wrapper;
      } else if (node.tagName == "pre") {
        // eslint-disable-next-line no-console
        console.log(node);
      }
    });
  };
};

export default rehypeWrapCodeFence;
