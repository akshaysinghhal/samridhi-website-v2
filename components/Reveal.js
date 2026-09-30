"use client";
import { useEffect, useRef } from "react";

// Slow, premium scroll reveal. Wrap any block: <Reveal delay={1}>…</Reveal>
// delay: 0 | 1 | 2 | 3 → staggered fade-up. Respects prefers-reduced-motion via CSS.
export default function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const d = delay === 1 ? "reveal-d1" : delay === 2 ? "reveal-d2" : delay === 3 ? "reveal-d3" : "";
  return (
    <Tag ref={ref} className={`reveal ${d} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
