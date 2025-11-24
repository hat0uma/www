import type { MermaidConfig } from "mermaid";

// https://github.com/mermaid-js/mermaid/issues/1945#issuecomment-1661264708

const getMermaidElements = (): NodeListOf<HTMLElement> =>
  document.querySelectorAll(".mermaid");

export const renderDiagrams = async (
  theme: MermaidConfig["theme"],
  dark: boolean
) => {
  const elements = getMermaidElements();
  if (elements.length === 0) {
    return;
  }

  const mermaid = (await import("mermaid")).default;

  // console.log(`render diagrams with ${theme} theme`, elements);
  mermaid.initialize({ theme, startOnLoad: false, darkMode: dark });
  await mermaid.run({ nodes: elements });
};

/**
 * Backs up the original raw Mermaid code from the <pre> tag to attribute.
 */
export const saveMermaidCodes = () => {
  const elements = getMermaidElements();
  for (const element of elements) {
    if (!element.hasAttribute("data-original-code")) {
      element.setAttribute("data-original-code", element.innerHTML);
    }
  }
};

/**
 * Resets already-rendered Mermaid diagrams back to their original raw Mermaid code.
 */
export const resetProcessedDiagrams = () => {
  const elements = getMermaidElements();
  for (const element of elements) {
    if (!element.hasAttribute("data-processed")) {
      continue;
    }

    const originalCode = element.getAttribute("data-original-code");
    if (originalCode != null) {
      element.removeAttribute("data-processed");
      element.innerHTML = originalCode;
    }
  }
};
