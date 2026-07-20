import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { stations, type Station } from "../data/stations";
import { cameraPosForStation, latLngToVector3 } from "../lib/geo";
import { useRadioStore } from "../store/radio";

const GLOBE_RADIUS = 1;
const MARKER_RADIUS = 1.012;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Procedural earth: deep ocean blue with soft continent-like noise. */
function Earth() {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Ocean base
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#0b1f3a");
    grad.addColorStop(0.5, "#0d2847");
    grad.addColorStop(1, "#081828");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Simple continent blobs (stylized, not geographic accuracy)
    const continents: Array<[number, number, number, string]> = [
      [0.22, 0.35, 55, "#1a4a3a"], // Americas-ish
      [0.18, 0.55, 40, "#1e4538"],
      [0.48, 0.32, 50, "#1c4d3c"], // Europe/Africa
      [0.52, 0.48, 45, "#184436"],
      [0.68, 0.38, 60, "#1a4a3a"], // Asia
      [0.75, 0.55, 35, "#1e4538"],
      [0.82, 0.68, 28, "#164033"], // Australia
      [0.15, 0.75, 22, "#143c30"], // Antarctica fringe
    ];

    for (const [nx, ny, r, color] of continents) {
      const g = ctx.createRadialGradient(
        nx * size,
        ny * size,
        0,
        nx * size,
        ny * size,
        r
      );
      g.addColorStop(0, color);
      g.addColorStop(0.7, color + "cc");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(nx * size, ny * size, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Speckle noise for texture
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 12;
      img.data[i] = Math.min(255, Math.max(0, img.data[i] + n));
      img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n));
      img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshStandardMaterial
        ref={matRef}
        map={texture}
        roughness={0.85}
        metalness={0.08}
        emissive="#041018"
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.045}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 48]} />
      <meshBasicMaterial
        color="#4aa8ff"
        transparent
        opacity={0.07}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function StationMarker({
  station,
  active,
  onSelect,
}: {
  station: Station;
  active: boolean;
  onSelect: (s: Station) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => latLngToVector3(station.lat, station.lng, MARKER_RADIUS),
    [station.lat, station.lng]
  );

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const t = clock.getElapsedTime();
    const pulse = active
      ? 1.2 + Math.sin(t * 4) * 0.25
      : 0.9 + Math.sin(t * 2 + pos.x * 5) * 0.15;
    glowRef.current.scale.setScalar(pulse);
  });

  return (
    <group position={pos}>
      <mesh
        ref={glowRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(station);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[active ? 0.028 : 0.018, 12, 12]} />
        <meshBasicMaterial
          color={active ? "#7dff9a" : "#3dffa0"}
          transparent
          opacity={active ? 0.9 : 0.55}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[active ? 0.012 : 0.008, 10, 10]} />
        <meshBasicMaterial color={active ? "#b8ffcc" : "#6dff9e"} />
      </mesh>
    </group>
  );
}

function CameraFlyer() {
  const flyToId = useRadioStore((s) => s.flyToId);
  const clearFlyTo = useRadioStore((s) => s.clearFlyTo);
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const animating = useRef(false);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (!flyToId) return;
    const station = stations.find((s) => s.id === flyToId);
    if (!station) {
      clearFlyTo();
      return;
    }
    target.current = cameraPosForStation(
      station.lat,
      station.lng,
      GLOBE_RADIUS,
      2.35
    );
    if (reduced.current) {
      camera.position.copy(target.current);
      camera.lookAt(0, 0, 0);
      clearFlyTo();
      return;
    }
    animating.current = true;
  }, [flyToId, camera, clearFlyTo]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(target.current, 0.06);
    camera.lookAt(0, 0, 0);
    if (camera.position.distanceTo(target.current) < 0.02) {
      animating.current = false;
      clearFlyTo();
    }
  });

  return null;
}

function AutoRotate({
  controlsRef,
}: {
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
}) {
  const userInteracting = useRadioStore((s) => s.userInteracting);
  const reduced = useRef(prefersReducedMotion());

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || reduced.current) return;
    controls.autoRotate = !userInteracting;
    controls.autoRotateSpeed = 0.35;
    // keep damping alive
    void delta;
  });

  return null;
}

function Scene() {
  const selectStation = useRadioStore((s) => s.selectStation);
  const current = useRadioStore((s) => s.current);
  const setUserInteracting = useRadioStore((s) => s.setUserInteracting);
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(
    null
  );

  return (
    <>
      <color attach="background" args={["#070a12"]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} color="#c8e0ff" />
      <directionalLight position={[-4, -2, -3]} intensity={0.25} color="#4a6a8a" />

      <Stars
        radius={80}
        depth={40}
        count={2800}
        factor={3.2}
        saturation={0}
        fade
        speed={0.2}
      />

      <Earth />
      <Atmosphere />

      {stations.map((s) => (
        <StationMarker
          key={s.id}
          station={s}
          active={current?.id === s.id}
          onSelect={selectStation}
        />
      ))}

      <CameraFlyer />
      <AutoRotate controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.6}
        minDistance={1.45}
        maxDistance={4.2}
        autoRotate
        autoRotateSpeed={0.35}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        onStart={() => setUserInteracting(true)}
        onEnd={() => setUserInteracting(true)}
      />
    </>
  );
}

export function Globe() {
  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        camera={{ position: [0, 0.4, 2.6], fov: 42, near: 0.1, far: 200 }}
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#070a12");
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

/** Client-only wrapper — mount after hydration to avoid SSR canvas issues. */
export function GlobeClient() {
  return <Globe />;
}
