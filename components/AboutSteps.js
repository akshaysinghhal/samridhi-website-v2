"use client";
import { useState } from "react";

// Interactive "Our Approach" stepper for the About page.
// Tap a step to expand its description; only one open at a time.
export default function AboutSteps({ steps }) {
  const [openIdx, setOpenIdx] = useState(0);
  if (!steps || steps.length === 0) return null;
  return (
    <div className="about-steps">
      {steps.map((s, i) => {
        const open = openIdx === i;
        return (
          <div key={(s.title || "") + i} className={"about-step" + (open ? " open" : "")}>
            <button
              type="button"
              className="about-step-head"
              onClick={() => setOpenIdx(open ? -1 : i)}
              aria-expanded={open}
            >
              <span className="about-step-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="about-step-title">{s.title}</span>
              <span className="about-step-icon" aria-hidden="true">{open ? "−" : "+"}</span>
            </button>
            <div className="about-step-body" aria-hidden={!open}>
              <div className="about-step-body-inner">
                {s.text ? <p>{s.text}</p> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
