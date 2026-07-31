"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function DepthField() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const reduceMotion = useRef(false);
  const { viewport } = useThree();

  const positions = useMemo(() => {
    const values = new Float32Array(180 * 3);
    let seed = 20260731;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let index = 0; index < values.length; index += 3) {
      values[index] = (random() - 0.5) * 18;
      values[index + 1] = (random() - 0.5) * 11;
      values[index + 2] = -1 - random() * 8;
    }
    return values;
  }, []);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handlePointerMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const motionScale = reduceMotion.current ? 0 : 1;
    const elapsed = clock.getElapsedTime();
    group.rotation.y = THREE.MathUtils.lerp(
      group.rotation.y,
      pointer.current.x * 0.09 * motionScale,
      0.035
    );
    group.rotation.x = THREE.MathUtils.lerp(
      group.rotation.x,
      -pointer.current.y * 0.055 * motionScale,
      0.035
    );
    group.position.y = Math.sin(elapsed * 0.22) * 0.1 * motionScale;

    if (pointsRef.current) {
      pointsRef.current.rotation.z = elapsed * 0.008 * motionScale;
      pointsRef.current.position.x = pointer.current.x * -0.22 * motionScale;
    }
  });

  const sceneScale = viewport.width < 8 ? 0.72 : 1;

  return (
    <group ref={groupRef} scale={sceneScale}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 5]} intensity={1.25} color="#f8fafc" />
      <directionalLight position={[-4, -2, 2]} intensity={0.55} color="#7dd3fc" />

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#ffffff"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </points>

      <mesh position={[-5.5, 1.6, -2.6]} rotation={[0.35, 0.55, 0.2]}>
        <octahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial color="#7dd3fc" wireframe transparent opacity={0.42} />
      </mesh>
      <mesh position={[5.2, 0.9, -3.4]} rotation={[0.15, -0.4, 0.45]}>
        <icosahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial color="#f9a8d4" wireframe transparent opacity={0.34} />
      </mesh>
      <mesh position={[-3.8, -3.1, -1.5]} rotation={[0.55, 0.2, -0.3]}>
        <boxGeometry args={[1.25, 1.25, 1.25]} />
        <meshStandardMaterial color="#fde68a" wireframe transparent opacity={0.38} />
      </mesh>
      <mesh position={[4.4, -3.4, -2]} rotation={[0.25, 0.7, 0.1]}>
        <tetrahedronGeometry args={[1.15, 0]} />
        <meshStandardMaterial color="#86efac" wireframe transparent opacity={0.38} />
      </mesh>

      <mesh position={[0, -4.5, -5.5]} rotation={[-Math.PI / 2.35, 0, 0]}>
        <planeGeometry args={[24, 14, 30, 18]} />
        <meshBasicMaterial color="#f8fafc" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

export default function SpatialBackdrop() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 52, near: 0.1, far: 40 }}
        dpr={[1, 1.35]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <DepthField />
      </Canvas>
    </div>
  );
}
