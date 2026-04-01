"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * GSAP Provider — initializes ScrollTrigger and provides scope for all child animations.
 * Wrap the page/layout that uses GSAP animations.
 */
export default function GSAPProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Refresh ScrollTrigger after initial hydration
    const timeout = setTimeout(() => ScrollTrigger.refresh(), 100);
    return () => clearTimeout(timeout);
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

/**
 * Hook to create scroll-triggered animations.
 * Usage:
 *   const ref = useScrollReveal({ y: 60, duration: 0.8 });
 *   <div ref={ref}>...</div>
 */
export function useScrollReveal(
  fromVars: gsap.TweenVars = {},
  triggerConfig: ScrollTrigger.Vars = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;
    gsap.from(ref.current, {
      autoAlpha: 0,
      y: 50,
      duration: 0.8,
      ease: "power3.out",
      ...fromVars,
      scrollTrigger: {
        trigger: ref.current,
        start: "top 85%",
        once: true,
        ...triggerConfig,
      },
    });
  }, { dependencies: [] });

  return ref;
}
