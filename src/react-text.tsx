import { createElement, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import type { MonofyOptions } from "./core";
import { monofyFromElement } from "./element";

type MonofyTextProps = MonofyOptions & {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  text: string;
  sourceRef?: RefObject<HTMLElement | null>;
  className?: string;
  children?: ReactNode;
};

export function MonofyText(props: MonofyTextProps): ReactNode {
  const { as = "span", text, sourceRef, className, children, ...options } = props;
  const localRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setReady(true);
  }, [text]);

  const targetRef = sourceRef ?? localRef;
  const content = ready
    ? monofyFromElement(targetRef.current, text, options)
    : text;

  return createElement(
    as,
    { ref: targetRef, className },
    content,
    children
  );
}

export type { MonofyTextProps };
