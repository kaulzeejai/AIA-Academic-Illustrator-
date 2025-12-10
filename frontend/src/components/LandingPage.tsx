'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointMaterial, Stars, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as THREE from 'three';

// Generate a simple circular glow texture
function getGlowTexture() {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

// Generate particles mapping to a Jupiter-like banded sphere
function generateJupiterParticles(count: number): { positions: Float32Array; colors: Float32Array } {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
        // Uniform sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const radius = 2.0;

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Jupiter banding based on Latitude (y)
        const normalizedY = (y + radius) / (radius * 2); // 0 to 1

        // Define bands approx
        if (normalizedY > 0.8 || normalizedY < 0.2) {
            color.setHex(0x8c8376); // Poles
        } else if ((normalizedY > 0.6 && normalizedY < 0.7) || (normalizedY > 0.3 && normalizedY < 0.4)) {
            color.setHex(0xbc8054); // Dark Bands
        } else if (normalizedY > 0.45 && normalizedY < 0.55) {
            // Great Red Spot area / Equator
            if (Math.random() > 0.95 && theta > 0 && theta < 0.5) {
                color.setHex(0xd66c4c); // Spot
            } else {
                color.setHex(0xe8dcc2);
            }
        } else {
            color.setHex(0xf2e6ce); // Zones
        }

        // Add variation
        color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
}

// Generate particles for planetary rings
function generateRingParticles(count: number, innerRadius: number, outerRadius: number): { positions: Float32Array; colors: Float32Array } {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = innerRadius + Math.random() * (outerRadius - innerRadius);

        const x = r * Math.cos(angle);
        const y = (Math.random() - 0.5) * 0.05; // Thin disk
        const z = r * Math.sin(angle);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Color variation for ring bands
        if (Math.random() > 0.5) {
            color.setHex(0xa99b8e); // Dusty
        } else {
            color.setHex(0xd6d1cc); // Icy
        }

        // Darker patches for gaps
        if (Math.random() < 0.2) {
            color.multiplyScalar(0.6);
        }

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    return { positions, colors };
}

function Jupiter({ isExploding }: { isExploding: boolean }) {
    const ref = useRef<THREE.Points>(null!);
    const ringsRef = useRef<THREE.Points>(null!);

    const [data] = useState(() => generateJupiterParticles(5000));
    const [ringData] = useState(() => generateRingParticles(5000, 2.8, 5.2));

    // Generate texture on mount
    const [glowTex, setGlowTex] = useState<THREE.Texture | null>(null);
    useEffect(() => {
        setGlowTex(getGlowTexture());
    }, []);

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(data.colors, 3));
        return geo;
    }, [data]);

    const ringGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(ringData.positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(ringData.colors, 3));
        return geo;
    }, [ringData]);

    useFrame((state, delta) => {
        if (!ref.current || !ringsRef.current) return;

        // Rotate Jupiter
        ref.current.rotation.y += delta * 0.1;

        // Rotate Rings
        ringsRef.current.rotation.y -= delta * 0.02; // Slow counter-rotation for visual interest

        // Explosion animation
        if (isExploding) {
            const positions = ref.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] *= 1.05;
                positions[i + 1] *= 1.05;
                positions[i + 2] *= 1.05;
            }
            ref.current.geometry.attributes.position.needsUpdate = true;
            ref.current.rotation.y += delta * 1.5;

            // Explode rings
            const ringPos = ringsRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < ringPos.length; i += 3) {
                ringPos[i] *= 1.08;
                ringPos[i + 2] *= 1.08;
                ringPos[i + 1] += (Math.random() - 0.5) * 0.2;
            }
            ringsRef.current.geometry.attributes.position.needsUpdate = true;
            // Manual fade out if material supports it, or just fly away
        }
    });

    return (
        <group rotation={[0.2, 0, 0.15]}>
            {/* Planet */}
            <points ref={ref} geometry={geometry}>
                <PointMaterial
                    transparent
                    vertexColors
                    map={glowTex}
                    size={0.12}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.NormalBlending}
                    opacity={0.9}
                />
            </points>

            {/* Rings */}
            <points ref={ringsRef} geometry={ringGeometry} rotation={[0, 0, 0.2]}> {/* Tilt relative to planet slightly or align? Usually aligned equatorially. */}
                {/* Actually, true rings are equatorial. Let's align them with the planet's equator (XZ plane), 
                    but the whole group is tilted, so they should be flat in local space */}
                <PointMaterial
                    transparent
                    vertexColors
                    map={glowTex}
                    size={0.08}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    opacity={0.5}
                />
            </points>

            {/* Atmosphere Glow */}
            <mesh scale={[2.1, 2.1, 2.1]}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshBasicMaterial color="#d4be96" transparent opacity={0.04} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    );
}

function BackgroundStars() {
    return (
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.2} />
    );
}

interface LandingPageProps {
    onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
    const [exploding, setExploding] = useState(false);
    const [finished, setFinished] = useState(false);

    const handleStart = () => {
        setExploding(true);
        setTimeout(() => {
            setFinished(true);
            onStart();
        }, 800);
    };

    if (finished) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black overflow-hidden font-sans"
        >
            <div className="absolute inset-0 z-0">
                <Canvas camera={{ position: [0, 0, 9], fov: 40 }}>
                    <color attach="background" args={['#050505']} />
                    <BackgroundStars />
                    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
                        <Jupiter isExploding={exploding} />
                    </Float>
                    <ambientLight intensity={0.5} />
                </Canvas>
            </div>

            <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                animate={{ opacity: exploding ? 0 : 1, scale: exploding ? 1.5 : 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
            >
                <div className="relative z-10 text-center px-4">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4 drop-shadow-2xl">
                            AIA<span className="text-amber-500">.</span>Agent
                        </h1>
                        <div className="mb-12 inline-block relative group">
                            {/* Glow effect behind the subtitle */}
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <p className="relative px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-amber-100/80 text-lg md:text-xl font-mono tracking-[0.2em] uppercase shadow-2xl transition-all hover:bg-white/10 hover:border-amber-500/30">
                                Academic Illustrator Assistant
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="pointer-events-auto"
                    >
                        <button
                            onClick={handleStart}
                            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse" />
                            <span className="text-slate-200 font-medium tracking-wide group-hover:text-white">
                                EXPLORE COSMOS
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all" />
                        </button>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
