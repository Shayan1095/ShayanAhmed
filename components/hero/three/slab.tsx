"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { DEV, LAYERS } from "./shared";

/** Rounded-rectangle shape centred on the origin. */
function rrShape(w: number, h: number, r: number, corners = { tl: r, tr: r, br: r, bl: r }) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + corners.bl, y);
  s.lineTo(x + w - corners.br, y);
  s.quadraticCurveTo(x + w, y, x + w, y + corners.br);
  s.lineTo(x + w, y + h - corners.tr);
  s.quadraticCurveTo(x + w, y + h, x + w - corners.tr, y + h);
  s.lineTo(x + corners.tl, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - corners.tl);
  s.lineTo(x, y + corners.bl);
  s.quadraticCurveTo(x, y, x + corners.bl, y);
  return s;
}

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 6,
    curveSegments: 20,
  });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** Flat shape geometry with UVs mapped 0..1 across its bounds. */
function shapePlane(shape: THREE.Shape, w: number, h: number) {
  const g = new THREE.ShapeGeometry(shape, 20);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  uv.needsUpdate = true;
  return g;
}

export type SlabTextures = {
  store: THREE.Texture;
  strip: THREE.Texture;
  dash?: THREE.Texture;
  core?: THREE.Texture;
  chip?: THREE.Texture;
};

/** Handles the scene animates every frame. */
export type SlabParts = {
  root: THREE.Group | null;
  tilt: THREE.Group | null;
  glass: THREE.Group | null;
  board: THREE.Group | null;
  core: THREE.Group | null;
  strip: THREE.Mesh | null;
  screenMats: THREE.MeshBasicMaterial[];
  ledMat: THREE.MeshStandardMaterial | null;
  glowMat: THREE.MeshStandardMaterial | null;
  coreLight: THREE.PointLight | null;
};

export function createSlabParts(): SlabParts {
  return {
    root: null,
    tilt: null,
    glass: null,
    board: null,
    core: null,
    strip: null,
    screenMats: [],
    ledMat: null,
    glowMat: null,
    coreLight: null,
  };
}

/**
 * The display slab (DESIGN.md §8 Hero object): Layer 1 Glass = Website,
 * Layer 2 Board = System, Layer 3 Core = Automation. One swappable component;
 * the scroll choreography only relies on the parts it exposes.
 */
export function Slab({
  textures,
  partsRef,
  layered = true,
}: {
  textures: SlabTextures;
  partsRef: React.RefObject<SlabParts>;
  layered?: boolean;
}) {
  const geo = useMemo(() => {
    const frame = rrShape(DEV.W, DEV.H, DEV.R);
    frame.holes.push(rrShape(DEV.SW, DEV.SH, DEV.SR));
    const storeH = DEV.SH - DEV.STRIP;
    const store = rrShape(DEV.SW, storeH, DEV.SR, { tl: DEV.SR, tr: DEV.SR, br: 0, bl: 0 });
    const strip = rrShape(DEV.SW, DEV.STRIP, DEV.SR, { tl: 0, tr: 0, br: DEV.SR, bl: DEV.SR });
    return {
      frame: extrude(frame, 0.06, 0.025),
      store: shapePlane(store, DEV.SW, storeH),
      strip: shapePlane(strip, DEV.SW, DEV.STRIP),
      glass: shapePlane(rrShape(DEV.SW, DEV.SH, DEV.SR), DEV.SW, DEV.SH),
      back: extrude(rrShape(DEV.W, DEV.H, DEV.R), 0.1, 0.03),
      dash: shapePlane(rrShape(3.2, 1.95, 0.06), 3.2, 1.95),
      storeY: DEV.SH / 2 - storeH / 2,
      stripY: -DEV.SH / 2 + DEV.STRIP / 2,
    };
  }, []);

  const mats = useMemo(
    () => ({
      frame: new THREE.MeshPhysicalMaterial({ color: "#F3EADB", roughness: 0.32, metalness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
      back: new THREE.MeshPhysicalMaterial({ color: "#E4D8C3", roughness: 0.45, metalness: 0.2, clearcoat: 0.3 }),
      boardEdge: new THREE.MeshStandardMaterial({ color: "#2b2824", roughness: 0.5 }),
      chip: new THREE.MeshStandardMaterial({ color: "#1f1d1a", roughness: 0.35, metalness: 0.3 }),
      glass: new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false }),
      store: new THREE.MeshBasicMaterial({ map: textures.store, toneMapped: false }),
      strip: new THREE.MeshBasicMaterial({ map: textures.strip, toneMapped: false }),
      dash: textures.dash ? new THREE.MeshBasicMaterial({ map: textures.dash, toneMapped: false }) : null,
      core: textures.core ? new THREE.MeshBasicMaterial({ map: textures.core, transparent: true, depthWrite: false }) : null,
      chipFace: textures.chip ? new THREE.MeshBasicMaterial({ map: textures.chip, transparent: true, depthWrite: false }) : null,
      led: new THREE.MeshStandardMaterial({ color: "#4a3018", emissive: "#C9853F", emissiveIntensity: 1.6 }),
      glow: new THREE.MeshStandardMaterial({ color: "#2e1d0c", emissive: "#C9853F", emissiveIntensity: 0.8 }),
    }),
    [textures],
  );

  useEffect(() => {
    const parts = partsRef.current;
    parts.screenMats = [mats.store, mats.strip];
    parts.ledMat = mats.led;
    parts.glowMat = mats.glow;
  }, [mats, partsRef]);

  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g instanceof THREE.BufferGeometry && g.dispose());
      Object.values(mats).forEach((m) => m?.dispose());
    },
    [geo, mats],
  );

  return (
    <group ref={(g) => void (partsRef.current.root = g)}>
      <group ref={(g) => void (partsRef.current.tilt = g)}>
        {/* Layer 1 · Glass = Website: frame, storefront, live strip, glass sheet, status light */}
        <group ref={(g) => void (partsRef.current.glass = g)} position-z={LAYERS.glass}>
          <mesh geometry={geo.frame} material={mats.frame} />
          <mesh geometry={geo.store} material={mats.store} position={[0, geo.storeY, 0.004]} />
          <mesh
            ref={(m) => void (partsRef.current.strip = m)}
            geometry={geo.strip}
            material={mats.strip}
            position={[0, geo.stripY, 0.004]}
          />
          <mesh geometry={geo.glass} material={mats.glass} position-z={0.03} />
          <mesh material={mats.led} position={[DEV.W / 2 - 0.22, DEV.H / 2 - 0.045, 0.055]}>
            <sphereGeometry args={[0.028, 18, 12]} />
          </mesh>
        </group>

        {layered && mats.dash && (
          // Layer 2 · Board = System: dark plate printed with the owner dashboard
          <group ref={(g) => void (partsRef.current.board = g)} position-z={LAYERS.board}>
            <mesh material={mats.boardEdge}>
              <boxGeometry args={[3.3, 2.05, 0.035]} />
            </mesh>
            <mesh geometry={geo.dash} material={mats.dash} position-z={0.019} />
            {[
              [-1.45, 0.9],
              [1.45, 0.9],
              [-1.45, -0.9],
              [1.45, -0.9],
            ].map(([x, y]) => (
              <mesh key={`${x}${y}`} material={mats.frame} position={[x, y, 0.022]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.035, 0.035, 0.02, 16]} />
              </mesh>
            ))}
          </group>
        )}

        {/* Layer 3 · Core = Automation: housing, copper chip, 8 agent ports */}
        <group ref={(g) => void (partsRef.current.core = g)} position-z={LAYERS.core}>
          <mesh geometry={geo.back} material={mats.back} />
          {layered && mats.core && (
            <>
              <mesh material={mats.core} position-z={0.082}>
                <planeGeometry args={[3.4, 2.17]} />
              </mesh>
              <mesh material={mats.glow} position-z={0.09}>
                <boxGeometry args={[0.98, 0.98, 0.02]} />
              </mesh>
              <mesh material={mats.chip} position-z={0.15}>
                <boxGeometry args={[0.9, 0.9, 0.1]} />
              </mesh>
              {mats.chipFace && (
                <mesh material={mats.chipFace} position-z={0.202}>
                  <planeGeometry args={[0.84, 0.84]} />
                </mesh>
              )}
              <pointLight
                ref={(l) => void (partsRef.current.coreLight = l)}
                color="#C9853F"
                intensity={0}
                distance={5}
                decay={2}
                position={[0, 0, 0.9]}
              />
            </>
          )}
        </group>
      </group>
    </group>
  );
}
