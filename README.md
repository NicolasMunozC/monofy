# monofy

Monofy any text by giving every character the width of the widest one.

## Install

```bash
npm install monofy
```

## Usage

```ts
import Monofy from "monofy";

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
import { Monofy } from "monofy/react";

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
  width: 14,
  font: "700 48px Inter",
  className: "monofy-char",
  align: "center",
});
```

## Notes

- `width` defaults to `"auto"`.
- Automatic width uses the widest character in the text.
- `auto` needs a browser environment when `width` is not numeric.
- For `auto` to be accurate, `font` must match the real `font-weight`, `font-size`, and `font-family` used by the text.
- `monofy` returns HTML string.
- `monofy/react` returns React nodes.
- The text inherits styling from its parent element.
