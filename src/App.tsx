import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { AudioVisualizer } from './components/AudioVisualizer';
import { Controls } from './components/Controls';
import { useStore } from './store';

function App() {
  const isPlaying = useStore((state) => state.isPlaying);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas
        camera={{ position: [0, 0, 50], fov: 75 }}
        gl={{ antialias: true }}
        className="w-full h-full"
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />
          <OrbitControls enableZoom={true} enablePan={false} />
          {isPlaying && <AudioVisualizer />}
          <EffectComposer>
            <Bloom
              intensity={2.0}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.9}
              blendFunction={1}
            />
            <ChromaticAberration
              offset={[0.002, 0.002]}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <Controls />
    </div>
  );
}

export default App;