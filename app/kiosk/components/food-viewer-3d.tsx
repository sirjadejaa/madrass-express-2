"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Html, useProgress, Center } from "@react-three/drei";

interface FoodViewer3DProps {
  modelUrl: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
  onResetCamera?: () => void;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-4 bg-background/80 backdrop-blur-md rounded-2xl shadow-xl pointer-events-none">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-foreground">{progress.toFixed(0)}% Loaded</p>
      </div>
    </Html>
  );
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  
  useEffect(() => {
    // Traverse the scene to enable shadows
    scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export default function FoodViewer3D({ modelUrl, autoRotate = true, rotationSpeed = 1.0 }: FoodViewer3DProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize-width={1024} 
            shadow-mapSize-height={1024}
          />
          <Environment preset="city" />
          <Model url={modelUrl} />
          <OrbitControls 
            autoRotate={autoRotate}
            autoRotateSpeed={rotationSpeed}
            enableZoom={true}
            enablePan={false}
            minDistance={1.5}
            maxDistance={8}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
