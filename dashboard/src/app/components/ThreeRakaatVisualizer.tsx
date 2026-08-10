"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeRakaatVisualizer({
  rakaat = 1,
  maxRakaat = 4,
  status = "BERDIRI",
}: {
  rakaat: number;
  maxRakaat: number;
  status?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 280;
    const height = container.clientHeight || 200;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 2, 7);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);

    const pLight = new THREE.PointLight(0x059669, 3, 30);
    pLight.position.set(5, 8, 5);
    scene.add(pLight);

    // 3D Clean Base Frame
    const matGeo = new THREE.BoxGeometry(3.5, 0.1, 4.5);
    const matMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.1,
    });
    const matMesh = new THREE.Mesh(matGeo, matMaterial);
    matMesh.position.y = -1.2;
    scene.add(matMesh);

    const group = new THREE.Group();
    scene.add(group);

    const activePillars: THREE.Mesh[] = [];

    for (let i = 0; i < maxRakaat; i++) {
      const heightVal = 1.2 + i * 0.35;
      const geo = new THREE.CylinderGeometry(0.22, 0.3, heightVal, 32);
      const isActive = i < rakaat;
      const mat = new THREE.MeshStandardMaterial({
        color: isActive ? 0x059669 : 0x94a3b8,
        metalness: isActive ? 0.3 : 0.1,
        roughness: isActive ? 0.2 : 0.8,
        wireframe: !isActive,
        transparent: true,
        opacity: isActive ? 0.95 : 0.3,
      });

      const pillar = new THREE.Mesh(geo, mat);
      pillar.position.x = (i - (maxRakaat - 1) / 2) * 1.0;
      pillar.position.y = heightVal / 2 - 1.1;
      pillar.position.z = 0;
      group.add(pillar);
      activePillars.push(pillar);
    }

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      group.rotation.y += 0.006;

      activePillars.forEach((p, idx) => {
        if (idx < rakaat) {
          p.rotation.y += 0.015;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [rakaat, maxRakaat, status]);

  return (
    <div className="relative w-full h-52 flex items-center justify-center">
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
}
