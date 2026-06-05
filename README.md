# monofy

Monofy any text by giving every character the width of the widest one.

## Install

```bash
npm install @nicholasniculas/monofy
```

## Usage

```ts
import Monofy from "@nicholasniculas/monofy";

const html = Monofy("12:59");
```

## Plain HTML

```html
<!doctype html>
<html lang="es">
  <body>
    <h1 id="timer"></h1>

    <script type="module">
      import Monofy from "./dist/index.js";

      const el = document.getElementById("timer");
      el.innerHTML = Monofy("12:59", { width: "auto", font: '700 72px Georgia' });
    </script>
  </body>
</html>
```

## React

```tsx
import { Monofy } from "@nicholasniculas/monofy/react";

export function Clock() {
  const timer = "12:59";

  return <h1>{Monofy(timer, { width: "auto", font: '900 360px "Versus"' })}</h1>;
}
```

If you use the React subpath, install React in your app:

```bash
npm install react
```

## Options

```ts
Monofy("12:59", {
  width: "auto",
  font: '900 360px "Versus"',
  characterType: "numeric",
  measurement: "safe",
  widthOffset: -2,
  ignore: [":"],
  className: "monofy-char",
  align: "center",
});
```

## React (auto font from element)

```tsx
import { MonofyText } from "@nicholasniculas/monofy/react-text";

export function Clock({ value }: { value: string }) {
  return (
    <MonofyText
      as="h1"
      text={value}
      characterType="numeric"
      ignore={[":"]}
    />
  );
}
```

The component reads the computed font from its own element, so it adapts when CSS, `useAutoFit`, or media queries change the size.

You can also pass an external ref:

```tsx
const ref = useRef<HTMLHeadingElement>(null);

<MonofyText
  as="h1"
  text={value}
  sourceRef={ref}
  characterType="numeric"
  ignore={[":"]}
/>
```

## Notes

- `width` defaults to `"auto"`.
- `characterType` defines which set of characters is measured.
  - `"full"` (default): uses the current text.
  - `"numeric"`: measures `0-9`.
  - `"alphabetic"`: measures letters.
  - `"alphanumeric"`: measures letters and digits.
- `measurement` is `"safe"` (default) or `"visual"`.
  - `"safe"` uses typographic advance width.
  - `"visual"` uses actual ink bounds.
- `widthOffset` adds or subtracts pixels from the measured width.
- `ignore` leaves specific characters at their natural width.
- `auto` needs a browser environment when `width` is not numeric.
- For `auto` to be accurate, `font` must match the real `font-weight`, `font-size`, and `font-family` used by the text.
- `monofy` returns HTML string.
- `monofy/react` returns React nodes.
- The text inherits styling from its parent element.
