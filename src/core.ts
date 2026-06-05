export type MonofyCharacterType =
  | "full"
  | "numeric"
  | "alphabetic"
  | "alphanumeric";

export type MonofyMeasurement = "safe" | "visual";

export type MonofySideOffset = {
  left?: number;
  right?: number;
};

export type MonofySideOffsetInput = number | MonofySideOffset;

export type MonofyCharacterOffset = number | MonofySideOffset;

export type MonofyDebug =
  | boolean
  | "rainbow"
  | "report"
  | "full";

export type MonofyOptions = {
  width?: number | "auto";
  font?: string;
  className?: string;
  align?: "left" | "center" | "right";
  ignore?: string[];
  characterType?: MonofyCharacterType;
  measurement?: MonofyMeasurement;
  widthOffset?: MonofySideOffsetInput;
  characterOffsets?: Record<string, MonofyCharacterOffset>;
  debug?: MonofyDebug;
};

const DEFAULT_CLASS_NAME = "monofy-char";
const DEFAULT_WIDTH_FALLBACK_FONT = "16px sans-serif";
const DEFAULT_CHARACTER_TYPE: MonofyCharacterType = "full";
const DEFAULT_MEASUREMENT: MonofyMeasurement = "safe";

const CHARACTER_SETS: Record<Exclude<MonofyCharacterType, "full">, string> = {
  numeric: "0123456789",
  alphabetic: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  alphanumeric:
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
};

export type MonofyResolvedSegment = {
  segment: string;
  width: number;
  paddingLeft: number;
  paddingRight: number;
};

export type MonofyResolution = {
  width: number;
  segments: MonofyResolvedSegment[];
  widest: { char: string; width: number } | null;
  candidates: string[];
  measurements: Record<string, number>;
  debug: MonofyDebug;
};

export function monofyHtml(text: string, options: MonofyOptions = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Monofy: text must be a string.");
  }

  if (text.length === 0) return "";

  const className = options.className ?? DEFAULT_CLASS_NAME;
  const align = options.align ?? "center";
  const resolution = resolveMonofy(text, options);
  const ignored = new Set(options.ignore ?? []);
  const debug = options.debug;
  const segments = segmentText(text);

  maybeLogReport(text, options, resolution);

  return segments
    .map((segment, index) => {
      if (segment === "\n") return "<br>";

      const safeText = segment === " " ? "&nbsp;" : escapeHtml(segment);
      const resolved = resolution.segments[index];

      if (ignored.has(segment)) {
        const style = `display:inline-block;text-align:${align};white-space:pre;${
          debug ? `background:${rainbowColor(index)};` : ""
        }`;
        return `<span class="${className}" style="${style}">${safeText}</span>`;
      }

      const paddingLeft = resolved?.paddingLeft ?? 0;
      const paddingRight = resolved?.paddingRight ?? 0;
      const style = `display:inline-block;width:${resolution.width}px;padding-left:${paddingLeft}px;padding-right:${paddingRight}px;text-align:${align};white-space:pre;${
        debug ? `background:${rainbowColor(index)};` : ""
      }`;

      return `<span class="${className}" style="${style}">${safeText}</span>`;
    })
    .join("");
}

function rainbowColor(index: number) {
  const hue = Math.round((index * 47) % 360);
  return `hsl(${hue} 90% 60% / 0.35)`;
}

export function monofySegments(text: string) {
  return segmentText(text);
}

export function resolveMonofyWidth(text: string, options: MonofyOptions = {}) {
  if (typeof options.width === "number") {
    return options.width;
  }

  const resolution = resolveMonofy(text, options);
  return Math.max(1, Math.round(resolution.width));
}

export function resolveMonofy(
  text: string,
  options: MonofyOptions = {}
): MonofyResolution {
  const debug = options.debug ?? false;
  const baseResolution = measureBase(text, options);
  const width = applyWidthOffset(baseResolution.max, options.widthOffset);
  const segments = buildSegments(text, options, baseResolution);
  const charExtra = characterExtraWidths(text, options);

  const totalLeft = baseResolution.extraLeft;
  const totalRight = baseResolution.extraRight;

  for (const seg of segments) {
    const extra = charExtra.get(seg.segment);
    if (extra) {
      seg.paddingLeft += extra.left;
      seg.paddingRight += extra.right;
    }
  }

  return {
    width: Math.max(1, Math.round(width + totalLeft + totalRight)),
    segments,
    widest: baseResolution.widest,
    candidates: baseResolution.candidates,
    measurements: baseResolution.measurements,
    debug,
  };
}

function applyWidthOffset(
  base: number,
  offset: MonofySideOffsetInput | undefined
) {
  if (offset === undefined) return base;
  if (typeof offset === "number") return base + offset;
  return base + (offset.left ?? 0) + (offset.right ?? 0);
}

function buildSegments(
  text: string,
  options: MonofyOptions,
  base: ReturnType<typeof measureBase>
): MonofyResolvedSegment[] {
  const width = typeof options.width === "number"
    ? options.width
    : base.max;

  return segmentText(text).map((segment) => ({
    segment,
    width,
    paddingLeft: 0,
    paddingRight: 0,
  }));
}

function characterExtraWidths(
  text: string,
  options: MonofyOptions
) {
  const map = new Map<string, { left: number; right: number }>();
  const offsets = options.characterOffsets;
  if (!offsets) return map;

  for (const [key, value] of Object.entries(offsets)) {
    const sides = normalizeOffset(value);
    map.set(key, sides);
  }

  return map;
}

function normalizeOffset(
  value: MonofyCharacterOffset | undefined
): { left: number; right: number } {
  if (value === undefined) return { left: 0, right: 0 };
  if (typeof value === "number") return { left: 0, right: value };
  return {
    left: value.left ?? 0,
    right: value.right ?? 0,
  };
}

function measureBase(text: string, options: MonofyOptions) {
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

  const measurements: Record<string, number> = {};
  let max = 0;
  let widest: { char: string; width: number } | null = null;

  for (const char of candidates) {
    const metrics = ctx.measureText(char);
    const width =
      measurement === "visual"
        ? measureVisualWidth(metrics)
        : metrics.width;
    measurements[char] = width;
    if (width > max) {
      max = width;
      widest = { char, width };
    }
  }

  const extra = normalizeOffset(options.widthOffset);

  return {
    max: Math.ceil(max || 1),
    widest,
    candidates,
    measurements,
    extraLeft: extra.left,
    extraRight: extra.right,
  };
}

function getCandidateChars(
  text: string,
  characterType: MonofyCharacterType,
  ignored: Set<string>
) {
  if (characterType === "full") {
    return Array.from(
      new Set(
        segmentText(text).filter((c) => c !== "\n" && !ignored.has(c))
      )
    );
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

function maybeLogReport(
  text: string,
  options: MonofyOptions,
  resolution: MonofyResolution
) {
  if (!resolution.debug) return;
  if (resolution.debug !== "report" && resolution.debug !== "full") return;
  if (typeof console === "undefined") return;

  const label = options.characterType ?? "full";
  const widest = resolution.widest;

  console.groupCollapsed(
    `[Monofy] "${text}" (${label}, ${options.measurement ?? "safe"})`
  );
  console.log("candidates:", resolution.candidates);
  console.log("widths:", resolution.measurements);
  if (widest) console.log(`widest: "${widest.char}" (${widest.width.toFixed(2)}px)`);
  console.log("final width:", resolution.width);
  console.groupEnd();
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
