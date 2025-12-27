"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

/* -------------------- WebGL Check -------------------- */

function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
            (canvas.getContext('webgl') ||
                canvas.getContext('experimental-webgl'))
        );
    } catch {
        return false;
    }
}

/* -------------------- Tech Artifact -------------------- */

const TechArtifact = ({ position, color, speed, scale, opacity }) => {
    const mesh = useRef();

    useFrame(({ clock }) => {
        if (!mesh.current) return;
        const t = clock.getElapsedTime();
        mesh.current.rotation.x = t * 0.2 * speed;
        mesh.current.rotation.y = t * 0.3 * speed;
    });

    return (
        <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={position} scale={scale}>
                <mesh ref={mesh}>
                    <icosahedronGeometry args={[1, 0]} />
                    <meshBasicMaterial
                        wireframe
                        transparent
                        opacity={opacity}
                        color={color}
                    />
                </mesh>
                <mesh>
                    <octahedronGeometry args={[0.4, 0]} />
                    <meshBasicMaterial
                        transparent
                        opacity={opacity * 0.7}
                        color={color}
                    />
                </mesh>
            </group>
        </Float>
    );
};

/* -------------------- Scene -------------------- */

const Scene = ({ isDark }) => {
    const { mouse } = useThree();
    const group = useRef();

    useFrame(() => {
        if (!group.current) return;
        group.current.rotation.y = THREE.MathUtils.lerp(
            group.current.rotation.y,
            mouse.x * 0.15,
            0.04
        );
        group.current.rotation.x = THREE.MathUtils.lerp(
            group.current.rotation.x,
            -mouse.y * 0.15,
            0.04
        );
    });

    return (
        <group ref={group}>
            <Stars
                radius={80}
                depth={40}
                count={1200}
                factor={2}
                fade
                speed={0.5}
            />

            <Sparkles
                count={60}
                scale={10}
                size={4}
                speed={0.3}
                opacity={0.6}
                color={isDark ? '#06b6d4' : '#d97706'}
            />

            <TechArtifact
                position={[4, 2, -6]}
                color={isDark ? '#06b6d4' : '#d97706'}
                speed={0.8}
                scale={1.3}
                opacity={0.35}
            />
            <TechArtifact
                position={[-4, -3, -7]}
                color={isDark ? '#a855f7' : '#059669'}
                speed={0.9}
                scale={1.5}
                opacity={0.35}
            />

            <ambientLight intensity={0.8} />
        </group>
    );
};

/* -------------------- Main Wrapper -------------------- */

export default function ThreeBackground() {
    const { isDark } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [canUseWebGL, setCanUseWebGL] = useState(false);

    useEffect(() => {
        setMounted(true);
        setCanUseWebGL(isWebGLAvailable());
    }, []);

    if (!mounted) return null;

    /* 🚑 FALLBACK WHEN WEBGL IS DISABLED */
    if (!canUseWebGL) {
        return (
            <div
                className={`fixed inset-0 -z-20 ${
                    isDark
                        ? 'bg-gradient-to-br from-[#030014] via-[#1e1b4b] to-[#030014]'
                        : 'bg-gradient-to-br from-[#fff7ed] via-[#fde68a] to-[#fff7ed]'
                }`}
            />
        );
    }

    return (
        <div className={`fixed inset-0 -z-20 pointer-events-none`}>
            <Canvas
                dpr={1}
                camera={{ position: [0, 0, 10], fov: 60 }}
                gl={{
                    antialias: false,
                    alpha: true,
                    powerPreference: 'low-power'
                }}
            >
                <Scene isDark={isDark} />
            </Canvas>
        </div>
    );
}
