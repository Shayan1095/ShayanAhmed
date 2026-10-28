"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { drawFootScreen, makeCanvas, SCH, SCW, STORE_PX, STRIP_PX } from "./canvas-art";
import { SlabLights } from "./hero-scene";
import { clamp } from "./shared";
import { createSlabParts, Slab, type SlabParts, type SlabTextures } from "./slab";

export type FooterState = { level: number };

/**
 * Footer slab (DESIGN.md §8 Footer): the same object, small. Its screen reads
 * "Session complete · Thanks for scrolling" and powers down as the page ends.
 */
export default function FooterScene({
  stateRef,
  active,
  onReady,
}: {
  stateRef: React.RefObject<FooterState>;
  active: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      aria-hidden="true"
      flat
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, near: 0.1, far: 50, position: [0, 0.3, 6.6] }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <SlabLights />
      <FooterRig stateRef={stateRef} onReady={onReady} />
    </Canvas>
  );
}

type FootArt = { full: HTMLCanvasElement; store: HTMLCanvasElement; strip: HTMLCanvasElement; textures: SlabTextures };

function createFootArt(): FootArt {
  const mk = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const store = makeCanvas(SCW, STORE_PX);
  const strip = makeCanvas(SCW, STRIP_PX);
  return { full: makeCanvas(SCW, SCH), store, strip, textures: { store: mk(store), strip: mk(strip) } };
}

/** Draws the full screen, then splits it across the slab's two screen meshes. */
function paintFoot(art: FootArt, level: number) {
  drawFootScreen(art.full, level);
  art.store.getContext("2d")!.drawImage(art.full, 0, 0);
  art.strip.getContext("2d")!.drawImage(art.full, 0, -STORE_PX);
  art.textures.store.needsUpdate = true;
  art.textures.strip.needsUpdate = true;
}

function FooterRig({ stateRef, onReady }: { stateRef: React.RefObject<FooterState>; onReady: () => void }) {
  const [art] = useState(createFootArt);
  const partsRef = useRef<SlabParts>(createSlabParts());
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const drawn = useRef(-1);
  const ready = useRef(false);

  useEffect(() => {
    paintFoot(art, 1);
    document.fonts?.ready.then(() => {
      drawn.current = -1;
    });
    return () => Object.values(art.textures).forEach((t) => t?.dispose());
  }, [art]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5;
      pointer.current.y = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, delta) => {
    const { root, tilt, screenMats, ledMat } = partsRef.current;
    if (!root || !tilt) return;
    const level = clamp(stateRef.current.level);
    const t = performance.now();
    const ptr = pointer.current;
    const k = 1 - Math.exp(-delta * 3);
    ptr.sx += (ptr.x - ptr.sx) * k;
    ptr.sy += (ptr.y - ptr.sy) * k;

    tilt.rotation.set(0.12 + ptr.sy * 0.1, -0.32 + ptr.sx * 0.25 + Math.sin(t / 2400) * 0.04, 0);
    root.position.set(0, -0.15, 0);
    if (ledMat) ledMat.emissiveIntensity = level * 1.6;
    for (const m of screenMats) m.color.setScalar(0.04 + 0.96 * level);

    // Repaint only when the level visibly changes.
    const q = Math.round(level * 40);
    if (q !== drawn.current) {
      drawn.current = q;
      paintFoot(art, level);
    }
    state.camera.lookAt(0, -0.1, 0);

    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  });

  return <Slab textures={art.textures} partsRef={partsRef} layered={false} />;
}
