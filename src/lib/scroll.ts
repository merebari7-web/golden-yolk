import type Lenis from "lenis";

/** Shared scroll state read by the 3D scene. */
export const scrollState = {
  progress: 0,
  /** Smoothed scroll velocity (progress units / second), decays to 0. */
  velocity: 0,
};

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenis = instance;
}

/** Smooth-scroll to a selector via Lenis when available. */
export function scrollTo(target: string) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.8, offset: 0 });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  }
}
