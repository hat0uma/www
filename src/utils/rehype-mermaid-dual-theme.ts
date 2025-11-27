/* eslint-disable no-console */

import type { Plugin } from "unified";
import type { Root, Element } from "hast";
import { visitParents } from "unist-util-visit-parents";
import { toText } from "hast-util-to-text";
import { fromHtmlIsomorphic } from "hast-util-from-html-isomorphic";
import { createMermaidRenderer, type RenderOptions } from "mermaid-isomorphic";

const LIGHT_MODE_RENDER_OPTIONS: RenderOptions = {
  prefix: "mermaid-light",
  mermaidConfig: {
    theme: "default",
    darkMode: false,
  },
};

const DARK_MODE_RENDER_OPTIONS: RenderOptions = {
  prefix: "mermaid-dark",
  mermaidConfig: {
    theme: "dark",
    darkMode: true,
  },
};

type RehypeMermaidDualThemeOptions = {
  lightOptions: RenderOptions;
  darkOptions: RenderOptions;
};

/**
 * Check if a hast element is a Mermaid code block.
 */
function isMermaidCodeElement(element: Element): boolean {
  if (element.tagName !== "code") {
    return false;
  }

  const className = element.properties?.className;
  if (!Array.isArray(className)) {
    return false;
  }

  return className.includes("language-mermaid");
}

/**
 * Check if a parent element contains content other than the target element.
 */
function hasOtherContent(parent: Element, targetElement: Element): boolean {
  return parent.children.some(child => {
    if (child.type === "text") {
      return /\S/.test(child.value);
    }
    return child !== targetElement;
  });
}

/**
 * Parse SVG string into a HAST element.
 */
function parseSvgElement(svgString: string): Element {
  const parsed = fromHtmlIsomorphic(svgString, { fragment: true });
  const child = parsed.children[0];
  if (!child || child.type !== "element") {
    throw new Error("Failed to parse svg element");
  }
  return child;
}

function replaceElement(
  fromElement: Element | Root,
  node: Element,
  replacement: Element
) {
  const index = fromElement.children.indexOf(node);
  if (index !== -1) {
    fromElement.children[index] = replacement;
  }
}

type MermaidInstance = {
  diagram: string;
  pre: Element;
  parent: Element | Root;
};

/**
 * Collect all Mermaid code blocks from the AST.
 */
function collectMermaidInstances(ast: Root): MermaidInstance[] {
  const instances: MermaidInstance[] = [];

  visitParents(ast, "element", (node, ancestors) => {
    if (!isMermaidCodeElement(node)) {
      return;
    }

    const pre = ancestors.at(-1);
    if (!pre || pre.type !== "element" || pre.tagName !== "pre") {
      return;
    }

    // Ensure <pre> only contains this <code> element (and whitespace)
    if (hasOtherContent(pre, node)) {
      return;
    }

    const parent = ancestors.at(-2);
    if (!parent) {
      return;
    }

    const diagram = toText(node, { whitespace: "pre" });
    instances.push({ diagram, pre, parent });
  });

  return instances;
}

/**
 * Rehype plugin to render Mermaid diagrams for both light and dark themes.
 */
const rehypeMermaidDualTheme: Plugin<[RehypeMermaidDualThemeOptions], Root> = ({
  lightOptions = LIGHT_MODE_RENDER_OPTIONS,
  darkOptions = DARK_MODE_RENDER_OPTIONS,
}) => {
  const renderDiagrams = createMermaidRenderer();

  return async (ast: Root) => {
    const instances = collectMermaidInstances(ast);
    if (instances.length === 0) {
      return;
    }

    // Render all diagrams for both themes in parallel
    const diagrams = instances.map(instance => instance.diagram);
    const [lightResults, darkResults] = await Promise.all([
      renderDiagrams(diagrams, lightOptions),
      renderDiagrams(diagrams, darkOptions),
    ]);

    // Replace each Mermaid code block with dual-rendered SVGs
    for (const [index, instance] of instances.entries()) {
      const lightResult = lightResults[index];
      const darkResult = darkResults[index];

      // Skip on rendering errors
      if (lightResult.status === "rejected") {
        console.error("Failed to render Mermaid(light):", lightResult.reason);
        continue;
      }
      if (darkResult.status === "rejected") {
        console.error("Failed to render Mermaid(dark):", darkResult.reason);
        continue;
      }

      try {
        // Parse SVG strings into HAST elements
        const lightSvg = parseSvgElement(lightResult.value.svg);
        const darkSvg = parseSvgElement(darkResult.value.svg);

        // Replace pre with svg
        replaceElement(instance.parent, instance.pre, {
          type: "element",
          tagName: "div",
          properties: { className: ["mermaid-container"] },
          children: [
            {
              type: "element",
              tagName: "div",
              properties: { className: ["mermaid-light"] },
              children: [lightSvg],
            },
            {
              type: "element",
              tagName: "div",
              properties: { className: ["mermaid-dark"] },
              children: [darkSvg],
            },
          ],
        });
      } catch (error) {
        console.error("Failed to process Mermaid:", error);
      }
    }
  };
};

export default rehypeMermaidDualTheme;
