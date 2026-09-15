import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { scrollState } from "../lib/scroll";
import { burst, pop } from "../lib/sound";
import {
  getEggMaterial,
  getShellMaterial,
  getYolkMaterial,
  makeEggGeometry,
  makeShellGeometry,
} from "../lib/egg";

/* ------------------------------ helpers ------------------------------ */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ss = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const back = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const lerp = THREE.MathUtils.lerp;
const damp = THREE.MathUtils.damp;

/** The canvas is fully covered by the film between these progress points —
 *  skip all per-frame scene computation while it's invisible. */
const IN_FILM = (p: number) => p > 0.072 && p < 0.296;

/* ------------- adaptive quality: drop DPR if the GPU can't keep up ------------- */

function PerfGovernor() {
  const setDpr = useThree((s) => s.setDpr);
  const acc = useRef({ t: 0, n: 0, level: 0 });

  useFrame((_, dt) => {
    const a = acc.current;
    a.t += dt;
    a.n += 1;
    if (a.t < 2) return;
    const fps = a.n / a.t;
    const max = Math.min(window.devicePixelRatio || 1, 1.8);
    const steps = [max, 1.35, 1.1];
    if (fps < 42 && a.level < steps.length - 1) {
      a.level += 1;
      setDpr(steps[a.level]);
    } else if (fps > 57 && a.level > 0) {
      a.level -= 1;
      setDpr(steps[a.level]);
    }
    a.t = 0;
    a.n = 0;
  });
  return null;
}

/* --------------------- golden sun disc behind the egg --------------------- */

function SunGlow() {
  const mat = useRef<THREE.MeshBasicMaterial>(null!);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, "rgba(255, 236, 190, 1)");
    grad.addColorStop(0.35, "rgba(255, 205, 120, 0.55)");
    grad.addColorStop(0.7, "rgba(255, 170, 80, 0.16)");
    grad.addColorStop(1, "rgba(255, 160, 60, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useFrame((state) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const t = state.clock.elapsedTime;
    mat.current.opacity =
      lerp(0.95, 0.42, ss(0.3, 0.62, p)) * (1 + Math.sin(t * 0.7) * 0.05) +
      ss(0.956, 0.985, p) * 0.25;
  });

  return (
    <mesh position={[0, 0.7, -8.5]} renderOrder={-1}>
      <planeGeometry args={[15, 15]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.95}
      />
    </mesh>
  );
}

/* -------------- light grading — dawn warmth to golden dusk -------------- */

function SceneLights() {
  const key = useRef<THREE.DirectionalLight>(null!);
  const fill = useRef<THREE.DirectionalLight>(null!);
  const amb = useRef<THREE.AmbientLight>(null!);
  const cKeyA = useMemo(() => new THREE.Color("#fff4e0"), []);
  const cKeyB = useMemo(() => new THREE.Color("#ffb36b"), []);
  const cFillA = useMemo(() => new THREE.Color("#ffd9b8"), []);
  const cFillB = useMemo(() => new THREE.Color("#ff9e56"), []);

  useFrame((state) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const dusk = ss(0.6, 0.96, p);
    key.current.color.lerpColors(cKeyA, cKeyB, dusk * 0.8);
    fill.current.color.lerpColors(cFillA, cFillB, dusk * 0.75);
    key.current.intensity = lerp(1.35, 1.7, dusk);
    amb.current.intensity = lerp(0.4, 0.34, dusk);
    /* key light gently follows the pointer — living studio */
    key.current.position.x = damp(
      key.current.position.x,
      5 + state.pointer.x * 1.4,
      3,
      0.016,
    );
  });

  return (
    <>
      <ambientLight ref={amb} intensity={0.4} />
      <directionalLight ref={key} position={[5, 7, 4]} intensity={1.35} color="#fff4e0" />
      <directionalLight ref={fill} position={[-6, 3, -3]} intensity={0.55} color="#ffd9b8" />
      <pointLight position={[0, -3, 4]} intensity={0.4} color="#ffb46e" />
    </>
  );
}

/* ------------------ shell shatter — hero egg exit burst ------------------ */

const BURST_AT = 0.085;

function ShellBurst() {
  const g = useRef<THREE.Group>(null!);
  const geo = useMemo(() => new THREE.TetrahedronGeometry(0.09, 0), []);
  const mat = useMemo(() => getShellMaterial().clone(), []);
  const shards = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          Math.random() * 1.6 + 0.2,
          (Math.random() - 0.5) * 2.2,
        ).normalize(),
        speed: 1.7 + Math.random() * 2.6,
        rot: new THREE.Vector3(
          Math.random() * 7 - 3.5,
          Math.random() * 7 - 3.5,
          Math.random() * 7 - 3.5,
        ),
        size: 0.55 + (i % 4) * 0.25,
        pos: new THREE.Vector3(),
      })),
    [],
  );
  const st = useRef({ active: false, t: 0, lastP: 0 });

  useFrame((_, dt) => {
    const p = scrollState.progress;
    const s = st.current;
    const crossed =
      (s.lastP < BURST_AT && p >= BURST_AT) || (s.lastP > BURST_AT && p <= BURST_AT);
    if (crossed && !s.active) {
      s.active = true;
      s.t = 0;
      mat.transparent = true;
      mat.opacity = 1;
      shards.forEach((sh) => sh.pos.set(0, 0, 0));
      burst();
    }
    s.lastP = p;

    if (!s.active) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    s.t += dt;
    const T = 1.25;
    const k = Math.min(1, s.t / T);

    shards.forEach((sh, i) => {
      const m = g.current.children[i] as THREE.Mesh;
      sh.pos.addScaledVector(sh.dir, sh.speed * dt * (1 - k * 0.72));
      sh.pos.y -= 2.7 * dt * k * k;
      m.position.copy(sh.pos);
      m.rotation.x += sh.rot.x * dt;
      m.rotation.y += sh.rot.y * dt;
      m.rotation.z += sh.rot.z * dt;
      m.scale.setScalar(Math.max(0.001, (1 - k) * sh.size));
    });
    mat.opacity = 1 - k * k;
    if (k >= 1) s.active = false;
  });

  return (
    <group ref={g} visible={false} position={[0, -0.2, 0]}>
      {shards.map((_, i) => (
        <mesh key={i} geometry={geo} material={mat} />
      ))}
    </group>
  );
}

/* --------------------------- the hero egg ---------------------------- */

function MainEgg({ geo }: { geo: THREE.BufferGeometry }) {
  const g = useRef<THREE.Group>(null!);
  const mat = useMemo(() => getEggMaterial(), []);
  const boing = useRef(0);
  const init = useRef(false);

  useFrame((state, dt) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const t = state.clock.elapsedTime;
    const vw = state.viewport.width;
    const portrait = state.viewport.aspect < 0.85;
    const m = clamp01(vw / 8.6);

    const gone = ss(0.072, 0.108, p);
    const reenter = ss(0.298, 0.32, p);
    const farm = ss(0.3, 0.36, p);
    const journey = ss(0.445, 0.565, p);
    const exit = ss(0.56, 0.6, p);
    boing.current *= Math.exp(-3.2 * dt);

    /* --- responsive stage targets --- */
    const heroY = portrait ? -0.32 : -0.05;
    const farmX = portrait ? 0 : 1.95 * m;
    const farmY = portrait ? -1.08 : -0.28;
    const farmS = portrait ? 1.35 : 1.6;

    let x = lerp(0, farmX, farm);
    let y = lerp(heroY, farmY, farm);
    let s = lerp(2.0, farmS, farm);

    if (journey > 0.001) {
      x = lerp(farmX, portrait ? -vw * 1.6 : -3.4 * m, journey);
      y = lerp(farmY, portrait ? -1.62 : -0.42, ss(0, 0.2, journey));
    }
    /* hide during the film, return for the farm, leave for pricing */
    s *= 1 - gone * (1 - reenter);
    s *= 1 - exit;
    s *= 1 + 0.09 * boing.current;

    /* snap to correct pose on the very first frame (no fly-in) */
    const cur = g.current;
    if (!init.current) {
      cur.position.set(x, y, 0);
      cur.scale.setScalar(Math.max(0.0001, s));
      init.current = true;
    }

    cur.position.x = damp(cur.position.x, x, 5, dt);
    cur.position.y = damp(cur.position.y, y, 5, dt);
    cur.scale.setScalar(Math.max(0.0001, damp(cur.scale.x, s, 6, dt)));

    /* --- rotation --- */
    const rollAngle = (cur.position.x - farmX) / 1.15 - 0.28;
    const tiltZ = lerp(-0.28 * farm, rollAngle, clamp01(journey * 1.5));
    cur.rotation.z =
      damp(cur.rotation.z, tiltZ, 8, dt) + Math.sin(t * 20) * 0.22 * boing.current;
    cur.rotation.x =
      damp(
        cur.rotation.x,
        farm * 0.1 * (1 - journey) +
          state.pointer.y * 0.06 * (1 - farm) +
          THREE.MathUtils.clamp(scrollState.velocity, -1.4, 1.4) * 0.06 * (1 - journey),
        6,
        dt,
      ) +
      Math.sin(t * 16) * 0.12 * boing.current;
    cur.rotation.y +=
      dt * (lerp(0.28, 0.03, journey) + state.pointer.x * 0.05 * (1 - journey)) +
      Math.sin(t * 18) * 0.1 * boing.current;
  });

  return (
    <group ref={g} position={[0, -0.05, 0]} scale={2.0}>
      <mesh
        geometry={geo}
        material={mat}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (scrollState.progress < 0.07) {
            boing.current = 1;
            pop();
          }
        }}
      />
    </group>
  );
}

/* ---------------- orbiting mini eggs (hero flourish) ---------------- */

function OrbitMinis({ geo }: { geo: THREE.BufferGeometry }) {
  const g = useRef<THREE.Group>(null!);
  const mat = useMemo(() => getEggMaterial(), []);
  const items = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        a: (i / 7) * Math.PI * 2,
        r: 2.6 + (i % 3) * 0.28,
        s: 0.26 + (i % 4) * 0.05,
        y: ((i % 3) - 1) * 0.55,
      })),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const vis = 1 - ss(0.05, 0.09, p);
    const fit = Math.min(1, state.viewport.width / 6.2);
    g.current.rotation.y = t * 0.14;
    g.current.position.y = Math.sin(t * 0.55) * 0.12 - (1 - fit) * 0.2;
    g.current.scale.setScalar(Math.max(0.0001, vis * fit));
  });

  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} rotation={[0, it.a, 0]}>
          <mesh
            geometry={geo}
            material={mat}
            position={[it.r, it.y, 0]}
            scale={it.s}
            rotation={[0.25, it.a * 2, 0.35]}
          />
        </group>
      ))}
    </group>
  );
}

/* -------------------- pricing trio — small/med/big ------------------- */

const PRICING_SCALES = [1.2, 1.5, 1.85];

function PricingEggs({ geo }: { geo: THREE.BufferGeometry }) {
  const refs = [
    useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!),
  ];
  const mat = useMemo(() => getEggMaterial(), []);

  useFrame((state, dt) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const t = state.clock.elapsedTime;
    const vw = state.viewport.width;
    const portrait = state.viewport.aspect < 0.85;
    const m = THREE.MathUtils.clamp(vw / 9.5, portrait ? 0.42 : 0.55, 1);
    const out = ss(0.935, 0.955, p);

    refs.forEach((ref, i) => {
      const pop = back(ss(0.735 + i * 0.008, 0.775 + i * 0.008, p));
      const target = PRICING_SCALES[i] * m * Math.max(0.0001, pop) * (1 - out);
      const g = ref.current;
      const gx = (i - 1) * vw * (portrait ? 0.3 : 0.317);
      /* desktop: resting on the floor behind cards · portrait: floating row */
      const gy = portrait
        ? 0.6 + Math.sin(t * 1.1 + i * 2.6) * 0.03
        : -1.95 + 0.98 * PRICING_SCALES[i] * m;
      g.position.x = damp(g.position.x, gx, 6, dt);
      g.position.y =
        gy + Math.sin(t * 1.25 + i * 2.2) * 0.055 * Math.min(1, pop);
      g.rotation.y = Math.sin(t * 0.45 + i * 1.4) * 0.28;
      g.scale.setScalar(Math.max(0.0001, damp(g.scale.x, target, 7, dt)));
    });
  });

  return (
    <>
      {refs.map((ref, i) => (
        <group key={i} ref={ref} scale={0.0001}>
          <mesh geometry={geo} material={mat} />
        </group>
      ))}
    </>
  );
}

/* ------------------- cracked egg + yolk (the finale) ------------------ */

function CrackedEgg() {
  const g = useRef<THREE.Group>(null!);
  const yolk = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.PointLight>(null!);
  const shellMat = useMemo(() => getShellMaterial(), []);
  const yolkMat = useMemo(() => getYolkMaterial(), []);
  const bowlGeo = useMemo(() => makeShellGeometry(0.4, 1), []);
  const lidGeo = useMemo(() => makeShellGeometry(0, 0.38), []);
  const jelly = useRef({ on: false, t: 0 });

  useFrame((state, dt) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const t = state.clock.elapsedTime;
    const m = THREE.MathUtils.clamp(state.viewport.width / 9, 0.5, 1);
    const enter = back(ss(0.956, 0.978, p));

    const cur = g.current;
    cur.position.y = damp(
      cur.position.y,
      enter > 0.01 ? -0.02 + Math.sin(t * 0.8) * 0.05 : -4.5,
      5,
      dt,
    );
    cur.rotation.y += dt * 0.32 * enter;
    cur.rotation.z = Math.sin(t * 0.9) * 0.05 * Math.min(1, enter);
    cur.scale.setScalar(Math.max(0.0001, 1.75 * m * enter));

    /* jelly squash on landing + interior lamp */
    if (enter > 0.55 && !jelly.current.on) {
      jelly.current.on = true;
      jelly.current.t = 0;
      pop();
    }
    if (jelly.current.on) {
      jelly.current.t += dt;
      const jt = jelly.current.t;
      const w = Math.sin(jt * 16) * Math.exp(-2.4 * jt);
      yolk.current.scale.set(1 + 0.16 * w, 0.82 * (1 - 0.2 * w), 1 + 0.16 * w);
      if (jt > 2.2) jelly.current.on = false;
    }
    glow.current.intensity = 2.6 * enter * (0.92 + 0.08 * Math.sin(t * 6.3));
  });

  return (
    <group ref={g} position={[0, -4.5, 0]} scale={0.0001}>
      {/* cracked cup */}
      <mesh geometry={bowlGeo} material={shellMat} position={[0, -0.1, 0]} />
      {/* lid resting aside */}
      <mesh
        geometry={lidGeo}
        material={shellMat}
        position={[0.74, 1.02, -0.16]}
        rotation={[0.34, 0.42, -0.64]}
      />
      {/* golden yolk */}
      <mesh
        ref={yolk}
        material={yolkMat}
        position={[-0.05, -0.42, 0.14]}
        scale={[1, 0.82, 1]}
      >
        <sphereGeometry args={[0.52, 64, 64]} />
      </mesh>
      {/* inner golden lamp — the yolk glows from within */}
      <pointLight
        ref={glow}
        position={[0, 0.3, 0.4]}
        color="#ffb63d"
        distance={7}
        intensity={0}
      />
    </group>
  );
}

/* ------------------------------ floating dust ------------------------ */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 17;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    return arr;
  }, []);

  useFrame((state, dt) => {
    ref.current.rotation.y += dt * 0.018;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#c98a2e"
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------ camera rig --------------------------- */

function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const p = scrollState.progress;
    if (IN_FILM(p)) return;
    const t = state.clock.elapsedTime;
    const cam = state.camera;

    /* scroll-velocity FOV punch + decay */
    const lean = THREE.MathUtils.clamp(scrollState.velocity, -1.6, 1.6);
    scrollState.velocity *= Math.exp(-3.5 * dt);
    const pc = cam as THREE.PerspectiveCamera;
    const targetFov = 42 + Math.abs(lean) * 2.6;
    if (Math.abs(pc.fov - targetFov) > 0.02) {
      pc.fov = damp(pc.fov, targetFov, 6, dt);
      pc.updateProjectionMatrix();
    }

    const portrait = state.viewport.aspect < 0.85;
    const zoomOut = ss(0.73, 0.78, p);
    const zoomIn = ss(0.956, 0.986, p);
    const base = portrait ? 8.9 : 6.4;
    const tz = base + zoomOut * 1.05 - zoomIn * (portrait ? 2.9 : 2.5);
    /* breathing drift — keeps the scene alive between scrolls */
    const breath = Math.sin(t * 0.5) * 0.035;
    cam.position.x = damp(
      cam.position.x,
      state.pointer.x * 0.28 * (1 - zoomIn),
      4,
      dt,
    );
    cam.position.y = damp(
      cam.position.y,
      0.1 + state.pointer.y * 0.16 * (1 - zoomIn) + breath,
      4,
      dt,
    );
    cam.position.z = damp(cam.position.z, tz, 4, dt);
    cam.lookAt(look.set(0, lerp(0.05, -0.15, zoomIn), 0));
  });
  return null;
}

/* -------------------------------- scene ------------------------------ */

export default function EggScene() {
  const eggGeo = useMemo(() => makeEggGeometry(), []);

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ fov: 42, position: [0, 0.1, 6.4], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <SceneLights />

      <Environment resolution={512} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, 5, 1]}
          scale={[9, 4, 1]}
          color="#fff3da"
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[-5, 1, -1]}
          scale={[4, 6, 1]}
          color="#ffe0bd"
        />
        <Lightformer
          form="rect"
          intensity={1.3}
          position={[5, 2, 2]}
          scale={[4, 4, 1]}
          color="#fffaf0"
        />
        <Lightformer
          form="circle"
          intensity={1.4}
          position={[0, 2, 6]}
          scale={[3, 3, 1]}
          color="#ffffff"
        />
      </Environment>

      <PerfGovernor />
      <CameraRig />
      <SunGlow />
      <Dust />
      <OrbitMinis geo={eggGeo} />
      <ShellBurst />
      <MainEgg geo={eggGeo} />
      <PricingEggs geo={eggGeo} />
      <CrackedEgg />

      <ContactShadows
        position={[0, -1.95, 0]}
        opacity={0.4}
        scale={18}
        blur={2.8}
        far={7}
        resolution={512}
        color="#8a5a1c"
      />

      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.25}
          mipmapBlur
          radius={0.72}
        />
        <Vignette eskil={false} offset={0.26} darkness={0.42} />
      </EffectComposer>
    </Canvas>
  );
}
