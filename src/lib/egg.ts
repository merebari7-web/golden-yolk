import * as THREE from "three";

/** Number of profile samples used by every egg-shaped lathe. */
const PROFILE_SEGMENTS = 88;

/** Egg profile — a slightly asymmetric ovoid, narrower at the "top" (t=0). */
function eggPoint(t: number, radius: number, height: number): THREE.Vector2 {
  const a = t * Math.PI;
  const r = Math.max(0.0001, Math.sin(a) * (1 - 0.16 * Math.cos(a)));
  const y = -Math.cos(a) * height + Math.sin(a) * Math.cos(a) * 0.06 * height;
  return new THREE.Vector2(r * radius, y);
}

/** A closed, smooth egg (height ≈ 2). */
export function makeEggGeometry(radius = 0.72, height = 0.98): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= PROFILE_SEGMENTS; i++) {
    pts.push(eggPoint(i / PROFILE_SEGMENTS, radius, height));
  }
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/** A band of the egg profile — used to build "cracked" shell cup / lid. */
export function makeShellGeometry(
  from: number,
  to: number,
  radius = 0.72,
  height = 0.98,
): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    pts.push(eggPoint(from + ((to - from) * i) / steps, radius, height));
  }
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/** Procedural speckled eggshell texture (canvas → THREE texture). */
function makeSpeckleTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f7ecd7";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1100; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 2.3 + 0.4;
    const warm = 120 + (Math.random() * 60) | 0;
    ctx.fillStyle = `rgba(${warm + 40},${warm - 10},${warm - 60},${
      0.04 + Math.random() * 0.12
    })`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* Shared material singletons (created lazily in the browser only).    */
/* ------------------------------------------------------------------ */

let eggMat: THREE.MeshPhysicalMaterial | null = null;
export function getEggMaterial(): THREE.MeshPhysicalMaterial {
  if (!eggMat) {
    const tex = makeSpeckleTexture();
    eggMat = new THREE.MeshPhysicalMaterial({
      map: tex,
      bumpMap: tex,
      bumpScale: 0.6,
      color: "#fdf3e2",
      roughness: 0.36,
      clearcoat: 0.7,
      clearcoatRoughness: 0.35,
      sheen: 0.4,
      sheenColor: new THREE.Color("#fff1d6"),
    });
  }
  return eggMat;
}

let shellMat: THREE.MeshPhysicalMaterial | null = null;
export function getShellMaterial(): THREE.MeshPhysicalMaterial {
  if (!shellMat) {
    const base = getEggMaterial();
    shellMat = new THREE.MeshPhysicalMaterial({
      map: base.map,
      bumpMap: base.bumpMap,
      bumpScale: 0.6,
      color: "#fdf3e2",
      roughness: 0.5,
      clearcoat: 0.4,
      side: THREE.DoubleSide,
    });
  }
  return shellMat;
}

let yolkMat: THREE.MeshPhysicalMaterial | null = null;
export function getYolkMaterial(): THREE.MeshPhysicalMaterial {
  if (!yolkMat) {
    yolkMat = new THREE.MeshPhysicalMaterial({
      color: "#f6a21e",
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color("#b45e0a"),
      emissiveIntensity: 0.3,
    });
  }
  return yolkMat;
}
