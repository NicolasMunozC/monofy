export type MonofyOptions = {
  width?: number | "auto";
  font?: string;
  className?: string;
  align?: "left" | "center" | "right";
};

const DEFAULT_CLASS_NAME = "monofy-char";
const DEFAULT_WIDTH_FALLBACK_FONT = "16px sans-serif";

export function monofyHtml(text: string, options: MonofyOptions = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Monofy: text must be a string.");
  }

  if (text.length === 0) return "";

  const className = options.className ?? DEFAULT_CLASS_NAME;
  const align = options.align ?? "center";
  const width = resolveMonofyWidth(text, options);
  const segments = segmentText(text);

  return segments
    .map((segment) => {
      if (segment === "\n") return "<br>";

      const safeText = segment === " " ? "&nbsp;" : escapeHtml(segment);

      return `<span class="${className}" style="display:inline-block;width:${width}px;text-align:${align};white-space:pre;">${safeText}</span>`;
    })
    .join("");
}

export function monofySegments(text: string) {
  return segmentText(text);
}

export function resolveMonofyWidth(text: string, options: MonofyOptions = {}) {
  return typeof options.width === "number"
    ? options.width
    : measureMaxCharWidth(text, options.font);
}

function measureMaxCharWidth(text: string, font?: string) {
  if (typeof document === "undefined") {
    throw new Error(
      'Monofy: automatic width requires a browser environment or an explicit numeric width.'
    );
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Monofy: canvas 2D context is not available.");
  }

  ctx.font = font ?? DEFAULT_WIDTH_FALLBACK_FONT;

  let max = 0;

  for (const segment of segmentText(text)) {
    if (segment === "\n") continue;
    const measured = ctx.measureText(segment).width;
    if (measured > max) max = measured;
  }

  return Math.ceil(max || 1);
}

function segmentText(text: string) {
  const segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null;

  if (!segmenter) return Array.from(text);

  return Array.from(segmenter.segment(text), ({ segment }) => segment);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
