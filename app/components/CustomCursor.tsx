"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const SHADOW_CSS =
  "*{cursor:auto!important}" +
  "button,a,[role=button]{cursor:pointer!important}" +
  "input,textarea,[contenteditable]{cursor:text!important}";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "LINK", "TEMPLATE", "META"]);

export default function CustomCursor() {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  const springX = useSpring(mouseX, { stiffness: 300, damping: 28, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 28, mass: 0.5 });

  const [hidden, setHidden] = useState(false);

  // Tag any external portal (Privy modal etc.) so the native cursor shows there,
  // and inject a cursor stylesheet into any open shadow roots it uses.
  useEffect(() => {
    const injectIntoShadow = (root: ShadowRoot) => {
      if (root.querySelector("style[data-gc-cursor]")) return;
      const style = document.createElement("style");
      style.setAttribute("data-gc-cursor", "");
      style.textContent = SHADOW_CSS;
      root.appendChild(style);
    };
    const scanShadow = (el: Element) => {
      const sr = (el as HTMLElement).shadowRoot;
      if (sr) {
        injectIntoShadow(sr);
        sr.querySelectorAll("*").forEach(scanShadow);
      }
    };
    const patch = () => {
      Array.from(document.body.children).forEach((ch) => {
        if (ch.id === "gc-app" || ch.id === "gc-cursor") return;
        if (SKIP_TAGS.has(ch.tagName)) return;
        if (!ch.hasAttribute("data-gc-native")) ch.setAttribute("data-gc-native", "");
        scanShadow(ch);
        ch.querySelectorAll("*").forEach(scanShadow);
      });
    };
    patch();
    const mo = new MutationObserver(patch);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    // Walk up (crossing shadow boundaries) to the direct child of <body>.
    const topBodyChild = (node: Node | null): Element | null => {
      let n: Node | null = node;
      while (n && n.parentNode && n.parentNode !== document.body) {
        const el = n as Element;
        if (el.parentElement) n = el.parentElement;
        else {
          const root = n.getRootNode();
          if (root instanceof ShadowRoot) n = root.host;
          else break;
        }
      }
      return n && n.parentNode === document.body ? (n as Element) : null;
    };

    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const child = topBodyChild(el);
      // Over anything that isn't our own app or cursor → an external portal (modal).
      const overExternal =
        !!child && child.id !== "gc-app" && child.id !== "gc-cursor" && !SKIP_TAGS.has(child.tagName);
      setHidden(overExternal);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      id="gc-cursor"
      className="pointer-events-none fixed z-[9999] top-0 left-0"
      style={{ x: springX, y: springY, opacity: hidden ? 0 : 1 }}
    >
      {/* cursor arrow — slightly larger, blue fill */}
      <svg
        width="22"
        height="26"
        viewBox="0 0 18 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 2px 4px rgba(37,99,235,0.3))" }}
      >
        <path
          d="M0.720215 0.5L17.0002 9.5L8.72021 11.5L5.72021 19.5L0.720215 0.5Z"
          fill="#2563eb"
          stroke="white"
          strokeWidth="1.2"
        />
      </svg>

      {/* "You" pill — blue, larger text */}
      <div
        className="absolute top-4 left-5 px-3.5 py-1.5 rounded-full text-white whitespace-nowrap select-none"
        style={{
          backgroundColor: "#2563eb",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.01em",
          lineHeight: "1",
          boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
        }}
      >
        You
      </div>
    </motion.div>
  );
}
