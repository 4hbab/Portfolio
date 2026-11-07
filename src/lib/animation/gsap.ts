"use client";

import gsap from "gsap";
// From gsap/all rather than gsap/Flip etc.: on a case-insensitive filesystem
// "gsap/Flip" resolves its types to flip.d.ts, which index.d.ts already loads
// under the lower-case name, and tsc refuses the pair. gsap is sideEffects-free,
// so the bundler still drops the plugins not listed here.
import { DrawSVGPlugin, Flip, ScrollTrigger, SplitText } from "gsap/all";
import { useGSAP } from "@gsap/react";

/* Every plugin is registered here, once, so components import from this module
   instead of each repeating registerPlugin with whichever subset it remembered. */
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin);

export { gsap, useGSAP, ScrollTrigger, SplitText, Flip };
