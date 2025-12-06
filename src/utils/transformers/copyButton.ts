import type { ShikiTransformer } from "@shikijs/types";
import type { ElementContent } from "hast";

/**
 * Shiki transformer that adds copy buttons to code blocks
 */
export const transformerCopyButton = (): ShikiTransformer => ({
  pre(node) {
    const copyButtonOffset = "-0.75rem";
    const style = node.properties.style || "";
    node.properties.style =
      style + `--copy-button-offset: ${copyButtonOffset};`;

    // Create the copy button element
    const copyButton = {
      type: "element",
      tagName: "button",
      properties: {
        class: [
          "copy-code",
          "absolute",
          "end-3",
          "top-(--copy-button-offset)",
          "rounded",
          "bg-muted",
          "border",
          "border-muted",
          "px-2",
          "py-1",
          "text-xs",
          "leading-4",
          "text-foreground",
          "font-medium",
        ],
        onclick: `
        const pre = this.closest("pre");
        const code = pre?.querySelector("code");
        const text = code?.innerText;
        if (text) {
          navigator.clipboard.writeText(text);
          const label = this.innerText;
          this.innerText = "Copied";
          setTimeout(() => {
            this.innerText = label;
          }, 700);
        }`,
        "aria-label": "Copy code to clipboard",
      },
      children: [
        {
          type: "text",
          value: "Copy",
        },
      ],
    } as const satisfies ElementContent;

    // Add tabindex to the pre element for keyboard accessibility
    node.properties.tabindex = "0";

    // Add the copy button as a child of the pre element
    node.children.push(copyButton);
  },
});
