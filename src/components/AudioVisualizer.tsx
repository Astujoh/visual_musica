import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const vertexShader = `
uniform float uTime;
uniform float uAudioFrequency[128];

varying vec3 vPosition;
varying vec2 vUv;
varying float vAudioIntensity;
varying vec3 vNormal;

float pnoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float n = i.x + i.y * 157.0 + 113.0 * i.z;
  return mix(
    mix(
      mix(fract(sin(n + 0.0) * 43758.5453123), fract(sin(n + 1.0) * 43758.5453123), f.x),
      mix(fract(sin(n + 157.0) * 43758.5453123), fract(sin(n + 158.0) * 43758.5453123), f.x),
      f.y
    ),
    mix(
      mix(fract(sin(n + 113.0) * 43758.5453123), fract(sin(n + 114.0) * 43758.5453123), f.x),
      mix(fract(sin(n + 270.0) * 43758.5453123), fract(sin(n + 271.0) * 43758.5453123), f.x),
      f.y
    ),
    f.z
  );
}

float getAudioIntensity() {
  float bass = 0.0;
  float mid = 0.0;
  float high = 0.0;
  
  for(int i = 0; i < 8; i++) {
    bass += uAudioFrequency[i] * 3.0;
  }
  
  for(int i = 8; i < 32; i++) {
    mid += uAudioFrequency[i] * 2.0;
  }
  
  for(int i = 32; i < 128; i++) {
    high += uAudioFrequency[i];
  }
  
  return (bass / 24.0 + mid / 48.0 + high / 96.0) * 2.0;
}

void main() {
  vPosition = position;
  vUv = uv;
  vNormal = normal;
  
  float audioIntensity = getAudioIntensity();
  vAudioIntensity = audioIntensity;
  
  // Create organic movement
  float noise = pnoise(position * 2.0 + vec3(uTime * 0.5));
  float wave = sin(position.x * 3.0 + uTime) * cos(position.z * 2.0 + uTime);
  
  // Dynamic scaling based on audio
  vec3 newPosition = position * (15.0 + audioIntensity * 5.0);
  
  // Apply displacement
  float displacement = noise * audioIntensity * 4.0 + wave * audioIntensity * 2.0;
  newPosition += normal * displacement;
  
  // Add frequency-based ripples
  float ripple = sin(length(position.xz) * 8.0 - uTime * 2.0) * audioIntensity;
  newPosition += normal * ripple * 2.0;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}`;

const fragmentShader = `
uniform float uTime;

varying vec3 vPosition;
varying vec2 vUv;
varying float vAudioIntensity;
varying vec3 vNormal;

void main() {
  // Dynamic color palette
  vec3 color1 = vec3(0.0, 0.8, 1.0); // Bright cyan
  vec3 color2 = vec3(1.0, 0.2, 0.8); // Pink
  
  // Create smooth color transitions
  float colorMix = sin(uTime * 0.5) * 0.5 + 0.5;
  vec3 baseColor = mix(color1, color2, colorMix);
  
  // Add audio-reactive glow
  float glow = smoothstep(0.0, 1.0, vAudioIntensity);
  vec3 finalColor = mix(baseColor, vec3(1.0), glow * 0.6);
  
  // Add rim lighting
  float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
  finalColor += rim * vAudioIntensity * color1;
  
  // Calculate alpha for edge fade
  float alpha = 0.8 + vAudioIntensity * 0.2;
  
  gl_FragColor = vec4(finalColor, alpha);
}`;

export function AudioVisualizer() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);
  const { analyser } = useStore();

  useEffect(() => {
    if (!meshRef.current || !materialRef.current) return;
    materialRef.current.uniforms.uTime = { value: 0 };
    materialRef.current.uniforms.uAudioFrequency = { value: new Float32Array(128) };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current || !analyser) return;

    // Update time uniformly regardless of recording state
    timeRef.current += delta;
    materialRef.current.uniforms.uTime.value = timeRef.current;

    // Update frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Normalize and smooth the frequency data
    const normalizedData = new Float32Array(frequencyData.length);
    for (let i = 0; i < frequencyData.length; i++) {
      const smoothingFactor = 0.8; // Adjust for smoother transitions
      const currentValue = frequencyData[i] / 255;
      const previousValue = materialRef.current.uniforms.uAudioFrequency.value[i] || 0;
      normalizedData[i] = previousValue * smoothingFactor + currentValue * (1 - smoothingFactor);
    }

    materialRef.current.uniforms.uAudioFrequency.value = normalizedData;

    // Ensure continuous rotation during recording
    meshRef.current.rotation.y += delta * 0.2;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 4]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        wireframe={true}
        uniforms={{
          uTime: { value: 0 },
          uAudioFrequency: { value: new Float32Array(128) }
        }}
      />
    </mesh>
  );
}