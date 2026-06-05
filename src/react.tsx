import type { ReactNode } from "react";
import { createElement } from "react";
import { monofySegments, resolveMonofyWidth, type MonofyOptions } from "./core";

type MonofyReactOptions = MonofyOptions;

export function Monofy(text: string, options: MonofyReactOptions = {}): ReactNode {
  if (typeof text !== "string") {
    throw new TypeError("Monofy: text must be a string.");
  }

  if (text.length === 0) return null;

  const className = options.className ?? "monofy-char";
  const align = options.align ?? "center";
  const width = resolveMonofyWidth(text, options);
  const segments = monofySegments(text);

  return segments.map((segment, index) => {
    if (segment === "\n") return createElement("br", { key: index });

    const content = segment === " " ? "\u00A0" : segment;

    return createElement(
      "span",
      {
        key: index,
        className,
        style: {
          display: "inline-block",
          width: `${width}px`,
          textAlign: align,
          whiteSpace: "pre",
        },
      },
      content
    );
  });
}

export type { MonofyReactOptions };
