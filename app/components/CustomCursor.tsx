"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  const springX = useSpring(mouseX, { stiffness: 300, damping: 28, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 300, damping: 28, mass: 0.5 });

  const visible = useRef(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      visible.current = true;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[9999] top-0 left-0"
      style={{ x: springX, y: springY }}
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
