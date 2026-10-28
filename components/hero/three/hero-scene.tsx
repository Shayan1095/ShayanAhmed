"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ImageRef } from "@/lib/content/types";
import { drawChip, drawCore, drawDash, drawStore, drawStrip, makeCanvas, SCW, STORE_PX, STRIP_PX, tabAt } from "./canvas-art";
import { BASE_TILT, CARD_H, CARD_LINK, CARD_W, clamp, DEV, FOV, K, LAYERS, mix, slabLayout, ss, type HeroState } from "./shared";
import { createSlabParts, Slab, type SlabParts, type SlabTextures } from "./slab";

type HeroSceneProps = {
  stateRef: React.RefObject<HeroState>;
  storefront?: ImageRef;
  /** Called once the first frame has rendered, for the crossfade. */
  onReady: () => void;
  /** Rendering pauses while the hero is off screen. */
  active: boolean;
};

/**
 * The 3D hero (build step 7). Desktop with motion and WebGL only; the HTML
 * slab underneath stays as the accessible fallback. aria-hidden: every bit of
 * information here is duplicated in HTML.
 */
export default function HeroScene({ stateRef, storefront, onReady, active }: HeroSceneProps) {
  const [dpr, setDpr] = useState(1.5);
  return (
    <Canvas
      aria-hidden="true"
      flat
      dpr={[1, dpr]}
      // On demand: frames are requested by scroll, pointer, typing and boot. Nothing renders at rest.
      frameloop={active ? "demand" : "never"}
      camera={{ fov: FOV, near: 0.1, far: 100, position: [0, 0, 10] }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <SlabLights />
      <Rig stateRef={stateRef} storefront={storefront} onReady={onReady} />
    </Canvas>
  );
}

/** Shared lighting: soft studio panels built in code (no HDR download). */
export function SlabLights() {
  return (
    <>
      <hemisphereLight args={["#fffaf0", "#cbb894", 1.5]} />
      <directionalLight position={[4, 5, 7]} intensity={2.2} color="#fff6ea" />
      <directionalLight position={[-6, 3, -5]} intensity={1} />
      <directionalLight position={[-4, -2, 5]} intensity={0.7} color="#f3eadb" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} position={[0, 4, 6]} scale={[12, 4, 1]} color="#fbf6ec" />
        <Lightformer intensity={1.4} position={[-6, 1, 3]} rotation-y={Math.PI / 3} scale={[5, 6, 1]} color="#f3eadb" />
        <Lightformer intensity={1} position={[6, -1, 3]} rotation-y={-Math.PI / 3} scale={[5, 5, 1]} color="#fbf6ec" />
        <Lightformer intensity={0.8} position={[0, -4, 4]} rotation-x={-Math.PI / 3} scale={[10, 3, 1]} color="#e4d8c3" />
      </Environment>
    </>
  );
}

type Art = {
  canvases: Record<"store" | "strip" | "dash" | "core" | "chip", HTMLCanvasElement>;
  textures: Required<SlabTextures>;
};

function createArt(): Art {
  const mk = (c: HTMLCanvasElement) => {
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  const canvases = {
    store: makeCanvas(SCW, STORE_PX),
    strip: makeCanvas(Math.round(SCW * 0.6), Math.round(STRIP_PX * 0.6)), // redrawn while typing: keep it light
    dash: makeCanvas(1600, 1000),
    core: makeCanvas(1440, 920),
    chip: makeCanvas(256, 256),
  };
  return {
    canvases,
    textures: {
      store: mk(canvases.store),
      strip: mk(canvases.strip),
      dash: mk(canvases.dash),
      core: mk(canvases.core),
      chip: mk(canvases.chip),
    },
  };
}

/** Draws the static artwork (again once web fonts load, and when a screenshot arrives). */
function paintStatic(art: Art, screenshot?: HTMLImageElement) {
  drawStore(art.canvases.store, screenshot);
  drawDash(art.canvases.dash);
  drawCore(art.canvases.core);
  drawChip(art.canvases.chip);
  for (const t of [art.textures.store, art.textures.dash, art.textures.core, art.textures.chip]) t.needsUpdate = true;
}

/** Radial shadow texture, made once. */
function createShadowMaterial() {
  const c = makeCanvas(256, 256);
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(60,45,30,.5)");
  g.addColorStop(0.55, "rgba(60,45,30,.16)");
  g.addColorStop(1, "rgba(60,45,30,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
}

function paintStrip(art: Art, live: HeroState["live"], typed: number, caretOn: boolean) {
  drawStrip(art.canvases.strip, live, typed, caretOn);
  art.textures.strip.needsUpdate = true;
}

const CARD_GAP = 20;

function Rig({ stateRef, storefront, onReady }: { stateRef: React.RefObject<HeroState>; storefront?: ImageRef; onReady: () => void }) {
  const { camera, size, gl, invalidate } = useThree();
  const [art] = useState(createArt);
  const [shadowMat] = useState(createShadowMaterial);
  const partsRef = useRef<SlabParts>(createSlabParts());
  const shadow = useRef<THREE.Group>(null);
  const scratch = useRef({ a: new THREE.Vector3(), look: new THREE.Vector3(), camEnd: new THREE.Vector3(), target: new THREE.Vector3() });
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const typing = useRef({ id: -1, start: 0, lastDrawn: "" });
  const ready = useRef(false);

  // Static art: now, after fonts load, and once the storefront screenshot (if any) loads.
  useEffect(() => {
    paintStatic(art);
    document.fonts?.ready.then(() => paintStatic(art));
    if (!storefront?.src) return;
    const img = new Image();
    img.onload = () => paintStatic(art, img);
    img.src = storefront.src;
  }, [art, storefront?.src]);

  useEffect(() => () => Object.values(art.textures).forEach((t) => t.dispose()), [art]);

  // Let React/GSAP request frames (scroll progress, live strip updates).
  useEffect(() => {
    const state = stateRef.current;
    state.invalidate = invalidate;
    invalidate();
    return () => {
      state.invalidate = () => {};
    };
  }, [invalidate, stateRef]);

  // Pointer: the slab turns slightly toward the cursor (damped).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5;
      pointer.current.y = e.clientY / window.innerHeight - 0.5;
      invalidate();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [invalidate]);

  // Channel tabs on the 3D strip are clickable (raycast against the strip mesh).
  useEffect(() => {
    const el = gl.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = (e: PointerEvent) => {
      const strip = partsRef.current.strip;
      if (!strip) return null;
      const r = el.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const h = ray.intersectObject(strip, false)[0];
      return h?.uv ? tabAt(h.uv.x * SCW, (1 - h.uv.y) * STRIP_PX) : null;
    };
    const down = (e: PointerEvent) => {
      const ch = hit(e);
      if (ch) stateRef.current.onToggle(ch);
    };
    const move = (e: PointerEvent) => {
      el.style.cursor = hit(e) ? "pointer" : "";
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
    };
  }, [gl, camera, stateRef]);

  useFrame((_, delta) => {
    const parts = partsRef.current;
    const state = stateRef.current;
    const { root, tilt, glass, board, core, strip, screenMats, ledMat, glowMat, coreLight } = parts;
    if (!root || !tilt || !glass || !core) return;
    const v = scratch.current;
    const t = performance.now();
    const p = state.p;
    const { rise, led, screen } = state.boot;
    const cam = camera as THREE.PerspectiveCamera;

    // Layout: match the HTML slab's spot exactly (see slabLayout).
    const w = size.width;
    const h = size.height;
    const aspect = w / h;
    const ANCHOR = slabLayout(w, h);
    const slabPx = ANCHOR.widthPx;
    const dist0 = DEV.W / ((slabPx / w) * K * aspect);
    // Teardown framing: pull back so the separated layers fit, and lift the slab
    // above centre so the label cards have room below it.
    const distT = dist0 * (h < 820 ? 1.62 : 1.36);
    const x0 = (ANCHOR.x - 0.5) * K * dist0 * aspect;
    const y0 = (0.5 - ANCHOR.y) * K * dist0;
    const yT = (0.5 - 0.4) * K * distT;

    // Choreography phases (DESIGN.md §8 Hero scroll table).
    const a = ss(0, 0.3, p); // turn to three-quarter view, move to centre
    const e = ss(0.3, 0.5, p) * (1 - ss(0.62, 0.78, p)); // separate into layers, then rejoin
    const faceOn = ss(0.66, 0.84, p); // turn face-on
    const d = ss(0.74, 1, p); // dive into the live strip

    // Damped pointer, calmer as the dive starts.
    const ptr = pointer.current;
    const k = 1 - Math.exp(-delta * 4);
    ptr.sx += (ptr.x - ptr.sx) * k;
    ptr.sy += (ptr.y - ptr.sy) * k;
    const calm = 1 - d;

    tilt.rotation.set(
      mix(mix(BASE_TILT.x, 0.2, a), 0, faceOn) + ptr.sy * 0.1 * calm + (1 - rise) * 0.45,
      mix(mix(BASE_TILT.y, -0.7, a), 0, faceOn) + ptr.sx * 0.18 * calm,
      0,
    );
    // Lifted while apart, back to centre for the dive.
    root.position.set(mix(x0, 0, a), mix(mix(y0, yT, a), 0, faceOn) - (1 - rise) * 0.7, 0);

    glass.position.z = LAYERS.glass + LAYERS.travel * e;
    core.position.z = LAYERS.core - LAYERS.travel * e;
    if (board) board.position.y = 0.08 * e;
    if (shadow.current) {
      shadow.current.position.set(root.position.x, root.position.y - 1.55, 0);
      shadow.current.visible = d < 0.6;
    }

    // Static lighting values (no idle pulses: they would force a frame forever).
    if (glowMat) glowMat.emissiveIntensity = 0.6 + e * 1.8;
    if (coreLight) coreLight.intensity = e * 6;
    if (ledMat) ledMat.emissiveIntensity = led * 1.6;
    for (const m of screenMats) m.color.setScalar(clamp(screen, 0.03, 1));

    // Live strip: redraw only when the visible text or data changes.
    const live = state.live;
    const latest = live.lines[live.lines.length - 1];
    const ty = typing.current;
    if (latest && latest.id !== ty.id) {
      ty.id = latest.id;
      ty.start = latest.id === 0 ? 0 : t; // the server-rendered first line is already typed
    }
    const typed = latest ? Math.min(latest.text.length, Math.floor((t - ty.start) / 26)) : 0;
    const typingNow = Boolean(latest && typed < latest.text.length);
    const caretOn = typingNow; // caret shows while typing, then rests
    const key = `${latest?.id}|${typed}|${caretOn}|${live.mode}|${live.clock}|${live.channels.site}${live.channels.orders}${live.channels.leads}`;
    if (key !== ty.lastDrawn) {
      ty.lastDrawn = key;
      paintStrip(art, live, typed, caretOn);
    }

    // Camera: eases back for the teardown, then pushes into the live strip.
    cam.position.set(0, 0, mix(dist0, distT, a));
    v.look.set(0, 0, 0);
    root.updateMatrixWorld(true);
    if (d > 0 && strip) {
      v.target.set(0, 0, 0);
      strip.localToWorld(v.target);
      const fill = Math.min(DEV.STRIP / K, DEV.SW / (K * aspect)) * 0.9;
      v.camEnd.set(v.target.x, v.target.y, v.target.z + fill);
      cam.position.lerp(v.camEnd, Math.pow(d, 1.7));
      v.look.lerp(v.target, Math.min(1, d * 1.4));
    }
    cam.lookAt(v.look);
    cam.updateMatrixWorld();

    // Label cards: only while the layers are apart. Each hangs below its layer's
    // bottom edge on a connector; positions are kept one card apart and inside the stage.
    if (e > 0.001) {
      const anchors: [THREE.Object3D | null, number][] = [
        [glass, -1.12],
        [board, -1.0],
        [core, -1.12],
      ];
      const spots = anchors.map(([obj, yOff]) => {
        if (!obj) return null;
        v.a.set(0, yOff, 0.1);
        obj.localToWorld(v.a);
        v.a.project(cam);
        return { x: ((v.a.x + 1) / 2) * w, y: ((1 - v.a.y) / 2) * h };
      });
      let prev = -Infinity;
      const xs = spots.map((s) => {
        if (!s) return 0;
        prev = Math.max(s.x, prev + CARD_W + CARD_GAP);
        return prev;
      });
      const overflow = Math.max(0, (xs[xs.length - 1] ?? 0) - (w - CARD_W / 2 - 24));
      spots.forEach((s, i) => {
        const el = state.cards[i];
        if (!el || !s) return;
        const x = clamp(xs[i] - overflow, CARD_W / 2 + 24, w - CARD_W / 2 - 24);
        const y = Math.min(s.y, h - CARD_H - CARD_LINK - 24);
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    }

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }

    // Keep rendering only while something is still moving.
    const settling =
      rise < 1 || led < 1 || screen < 1 || typingNow ||
      Math.abs(ptr.x - ptr.sx) > 0.0008 || Math.abs(ptr.y - ptr.sy) > 0.0008;
    if (settling) invalidate();
  });

  return (
    <>
      <Slab textures={art.textures} partsRef={partsRef} />
      {/* Soft contact shadow under the slab (a blurred blob reads better than a cast shadow of a thin slab). */}
      <group ref={shadow}>
        {/* tilted toward the level camera so the floor shadow is visible */}
        <mesh rotation-x={-Math.PI / 2 + 0.5} material={shadowMat}>
          <planeGeometry args={[5.6, 1.6]} />
        </mesh>
      </group>
    </>
  );
}
