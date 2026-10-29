"use client";

/**
 * Low-power detection. True when the browser draws without GPU acceleration
 * (software WebGL renderers such as SwiftShader or Microsoft Basic Render
 * Driver) or the device reports very little CPU or memory. Such visitors get
 * native scrolling and simpler surfaces (see [data-power="low"] in globals.css).
 */
export function isLowPowerDevice(): boolean {
  try {
    const cached = sessionStorage.getItem("sa-power");
    if (cached) return cached === "low";
  } catch {
    /* storage blocked: just detect */
  }

  let low = false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2) low = true;

  if (!low) {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        (canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) as WebGLRenderingContext | null) ??
        null;
      if (!gl) {
        low = true;
      } else {
        const info = gl.getExtension("WEBGL_debug_renderer_info");
        const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
        if (/swiftshader|basic render|llvmpipe|software|softpipe/i.test(renderer)) low = true;
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    } catch {
      low = true;
    }
  }

  try {
    sessionStorage.setItem("sa-power", low ? "low" : "full");
  } catch {
    /* ignore */
  }
  return low;
}
