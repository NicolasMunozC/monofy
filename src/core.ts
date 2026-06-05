export type MonofyCharacterType =
  | "full"
  | "numeric"
  | "alphabetic"
  | "alphanumeric";

export type MonofyMeasurement = "safe" | "visual";

export type MonofyOptions = {
  width?: number | "auto";
  font?: string;
  className?: string;
  align?: "left" | "center" | "right";
  ignore?: string[];
  characterType?: MonofyCharacterType;
  measurement?: MonofyMeasurement;
  widthOffset?: number;
};

const DEFAULT_CLASS_NAME = "monofy-char";
const DEFAULT_WIDTH_FALLBACK_FONT = "16px sans-serif";
const DEFAULT_CHARACTER_TYPE: MonofyCharacterType = "full";
const DEFAULT_MEASUREMENT: MonofyMeasurement = "safe";
const DEFAULT_WIDTH_OFFSET = 0;

const CHARACTER_SETS: Record<Exclude<MonofyCharacterType, "full">, string> = {
  numeric: "0123456789",
  alphabetic: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
};

export function monofyHtml(text: string, options: MonofyOptions = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Monofy: text must be a string.");
  }

  if (text.length === 0) return "";

  const className = options.className ?? DEFAULT_CLASS_NAME;
  const align = options.align ?? "center";
  const width = resolveMonofyWidth(text, options);
  const ignored = new Set(options.ignore ?? []);
  const segments = segmentText(text);

  return segments
    .map((segment) => {
      if (segment === "\n") return "<br>";

      const safeText = segment === " " ? "&nbsp;" : escapeHtml(segment);
      const style =
        ignored.has(segment)
          ? `display:inline-block;text-align:${align};white-space:pre;`
          : `display:inline-block;width:${width}px;text-align:${align};white-space:pre;`;

      return `<span class="${className}" style="${style}">${safeText}</span>`;
    })
    .join("");
}

export function monofySegments(text: string) {
  return segmentText(text);
}

export function resolveMonofyWidth(text: string, options: MonofyOptions = {}) {
  if (typeof options.width === "number") {
    return options.width;
  }

  const base = measureMaxCharWidth(text, options);
  const offset = options.widthOffset ?? DEFAULT_WIDTH_OFFSET;

  return Math.max(1, Math.round(base + offset));
}

function measureMaxCharWidth(text: string, options: MonofyOptions) {
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

  ctx.font = options.font ?? DEFAULT_WIDTH_FALLBACK_FONT;

  const characterType = options.characterType ?? DEFAULT_CHARACTER_TYPE;
  const measurement = options.measurement ?? DEFAULT_MEASUREMENT;
  const ignored = new Set(options.ignore ?? []);
  const candidates = getCandidateChars(text, characterType, ignored);

  let max = 0;

  for (const char of candidates) {
    const metrics = ctx.measureText(char);
    const width =
      measurement === "visual"
        ? measureVisualWidth(metrics)
        : metrics.width;
    if (width > max) max = width;
  }

  return Math.ceil(max || 1);
}

function getCandidateChars(
  text: string,
  characterType: MonofyCharacterType,
  ignored: Set<string>
) {
  if (characterType === "full") {
    return Array.from(new Set(segmentText(text).filter((c) => c !== "\n" && !ignored.has(c))));
  }

  const set = CHARACTER_SETS[characterType];
  const chars: string[] = [];

  for (const char of Array.from(set)) {
    if (ignored.has(char)) continue;
    chars.push(char);
  }

  return chars;
}

function measureVisualWidth(metrics: TextMetrics) {
  const left = metrics.actualBoundingBoxLeft ?? 0;
  const right = metrics.actualBoundingBoxRight ?? metrics.width;
  return Math.max(0, left + right);
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
