import { createElement } from "react";
import type { ReactNode } from "react";
import {
  monofySegments,
  resolveMonofy,
  type MonofyOptions,
} from "./core";

type MonofyElementOptions = Omit<MonofyOptions, "font"> & {
  font?: string;
};

function readComputedFont(element: HTMLElement) {
  const styles = getComputedStyle(element);
  return `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
}

export function monofyFromElement(
  element: HTMLElement | null,
  text: string,
  options: MonofyElementOptions = {}
): ReactNode {
  if (!element) return null;
  if (typeof text !== "string") {
    throw new TypeError("Monofy: text must be a string.");
  }
  if (text.length === 0) return null;

  const className = options.className ?? "monofy-char";
  const align = options.align ?? "center";
  const font = options.font ?? readComputedFont(element);
  const resolution = resolveMonofy(text, { ...options, font });
  const ignored = new Set(options.ignore ?? []);
  const debug = options.debug;
  const segments = monofySegments(text);

  return segments.map((segment, index) => {
    if (segment === "\n") return createElement("br", { key: index });

    const content = segment === " " ? "\u00A0" : segment;
    const resolved = resolution.segments[index];

    if (ignored.has(segment)) {
      return createElement(
        "span",
        {
          key: index,
          className,
          style: {
            display: "inline-block",
            textAlign: align,
            whiteSpace: "pre",
            background: debug ? rainbowColor(index) : undefined,
          },
        },
        content
      );
    }

    return createElement(
      "span",
      {
        key: index,
        className,
        style: {
          display: "inline-block",
          width: `${resolution.width}px`,
          paddingLeft: `${resolved?.paddingLeft ?? 0}px`,
          paddingRight: `${resolved?.paddingRight ?? 0}px`,
          textAlign: align,
          whiteSpace: "pre",
          background: debug ? rainbowColor(index) : undefined,
        },
      },
      content
    );
  });
}

function rainbowColor(index: number) {
  const hue = Math.round((index * 47) % 360);
  return `hsl(${hue} 90% 60% / 0.35)`;
}

export type { MonofyElementOptions };
