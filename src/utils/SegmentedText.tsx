import type React from "react";
import { loadDefaultJapaneseParser } from "budoux";

const parser = loadDefaultJapaneseParser();

const estimateSegmentWidth = (text: string, fontSize: number): number => {
  let width = 0;
  for (const char of text) {
    const isFullWidth = char.charCodeAt(0) > 255;
    width += isFullWidth ? fontSize : fontSize * 0.55;
  }
  return width;
};

export type SegmentOptions = {
  lineWidth: number;
  fontSize: number;
  maxLines: number;
  ellipsis?: string;
};

export const segmentSentence = (
  text: string,
  { lineWidth, fontSize, maxLines, ellipsis }: SegmentOptions
): string[] => {
  const segments = parser.parse(text);
  const result: string[] = [];
  let currentLine = 1;
  let currentLineWidth = 0;

  for (const segment of segments) {
    const segmentWidth = estimateSegmentWidth(segment, fontSize);

    if (currentLineWidth + segmentWidth > lineWidth) {
      currentLine++;
      currentLineWidth = segmentWidth;
    } else {
      currentLineWidth += segmentWidth;
    }

    if (currentLine > maxLines) {
      const lastSegment = result.pop();
      result.push((lastSegment || segment.slice(0, 10)) + ellipsis);
      break;
    }

    result.push(segment);
  }

  return result;
};

export type SegmentedTextProps = {
  text: string;
  lineWidth: number;
  fontSize: number;
  maxLines: number;
  ellipsis: string;
  style?: React.CSSProperties;
  segmentStyle?: React.CSSProperties;
};

export const SegmentedText: React.FC<SegmentedTextProps> = ({
  text,
  lineWidth,
  fontSize,
  maxLines,
  ellipsis,
  style,
  segmentStyle = {
    display: "flex",
    whiteSpace: "nowrap",
  },
}) => {
  const segments = segmentSentence(text, {
    lineWidth,
    fontSize,
    maxLines,
    ellipsis,
  });

  return (
    <div style={style}>
      {segments.map((segment, index) => (
        <span key={index} style={segmentStyle}>
          {segment}
        </span>
      ))}
    </div>
  );
};
