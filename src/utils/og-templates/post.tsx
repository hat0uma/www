/** biome-ignore-all lint/a11y/noSvgWithoutTitle: This SVG is an intermediate template for PNG generation via Satori and is not rendered directly in the browser. */
/** biome-ignore-all lint/a11y/useAltText: This is a template for PNG generation via Satori and is not rendered as an HTML element. */
import type { CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";
import type React from "react";
import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";

const loadImageAsBase64 = (relative: string) => {
  const filePath = path.join(process.cwd(), relative);
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

const iconBase64 = loadImageAsBase64("public/hat0uma-icon-rounded.png");

const palette = {
  accent: "#a1b8d6", // Main Background
  accent2: "#8aa6c8",
  text: "#4c4f69",
  bg0: "#f8f8f8",
  bg1: "#eaf0f6",
};

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    backgroundColor: palette.accent,
    padding: "24px",
  },

  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.bg0,
    borderRadius: "24px",
    paddingTop: "50px",
    paddingBottom: "16px",
    overflow: "hidden",
  },

  title: {
    fontSize: "68px",
    fontWeight: "bold",
    textAlign: "center",
    color: palette.text,
    lineHeight: 1.25,
    width: "100%",
    boxSizing: "border-box",
    // maxWidth: "100%",
    marginTop: "auto",

    display: "block",
    textOverflow: "ellipsis",
    lineClamp: 2,
    overflow: "hidden",
  },
  tagContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "16px",
    fontSize: "28px",
    marginTop: "32px",
    marginBottom: "auto",
    maxWidth: "70%",
  },
  tagItem: {
    display: "flex",
    alignItems: "center",
    lineHeight: 1.5,
    fontSize: "32px",
    gap: "10px",
    backgroundColor: palette.bg1,
    padding: "10px 24px",
    borderRadius: "16px",
    color: palette.text,
    boxShadow: "1px 2px 3px rgba(0, 0, 0, 0.2)",
  },
  tagIcon: {
    width: "32px",
    height: "32px",
    color: palette.accent2,
  },

  icon: {
    width: "80px",
  },
  siteTitle: {
    fontFamily: "Caveat",
    textAlign: "center",
    display: "flex",
    fontSize: "40px",
    color: palette.text,
    background: `linear-gradient(transparent 80%, ${palette.accent} 80%)`,
  },
} as const satisfies Record<string, React.CSSProperties>;

// material-symbols:tag-rounded
const IconTag = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    style={styles.tagIcon}
  >
    <path
      fill="currentColor"
      d="m9 16l-.825 3.275q-.075.325-.325.525t-.6.2q-.475 0-.775-.375T6.3 18.8L7 16H4.275q-.5 0-.8-.387T3.3 14.75q.075-.35.35-.55t.625-.2H7.5l1-4H5.775q-.5 0-.8-.387T4.8 8.75q.075-.35.35-.55t.625-.2H9l.825-3.275Q9.9 4.4 10.15 4.2t.6-.2q.475 0 .775.375t.175.825L11 8h4l.825-3.275q.075-.325.325-.525t.6-.2q.475 0 .775.375t.175.825L17 8h2.725q.5 0 .8.387t.175.863q-.075.35-.35.55t-.625.2H16.5l-1 4h2.725q.5 0 .8.388t.175.862q-.075.35-.35.55t-.625.2H15l-.825 3.275q-.075.325-.325.525t-.6.2q-.475 0-.775-.375T12.3 18.8L13 16zm.5-2h4l1-4h-4z"
    />
  </svg>
);

export async function generatePostOgImage(entry: CollectionEntry<"blog">) {
  const elements = (
    <div style={styles.root}>
      <div style={styles.container}>
        <h1 style={styles.title}>{entry.data.title}</h1>
        <div style={styles.tagContainer}>
          {entry.data.tags.map(tag => (
            <div style={styles.tagItem} key={tag}>
              {IconTag}
              <span>{tag}</span>
            </div>
          ))}
        </div>
        <img style={styles.icon} src={iconBase64} alt="" />
        <div style={styles.siteTitle}>{SITE.title}</div>
      </div>
    </div>
  );

  return satori(elements, {
    width: 1200,
    height: 630,
    fonts: await loadGoogleFonts(
      [
        entry.data.title,
        entry.data.author,
        entry.data.description,
        SITE.title,
        SITE.author,
        entry.data.tags.join("/"),
        "…",
      ].join()
    ),
  });
}
