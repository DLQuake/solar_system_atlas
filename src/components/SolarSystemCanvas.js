'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SolarSystemCanvas() {
    const mountRef = useRef(null);

    useEffect(() => {
        const mountElement = mountRef.current;

        // Inicjalizacja sceny, kamery i renderera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000); // Kolor tła
        mountElement.appendChild(renderer.domElement);

        // Dodanie światła
        const ambientLight = new THREE.AmbientLight(0xffffff);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1.5);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Załaduj teksturę Słońca
        const textureLoader = new THREE.TextureLoader();
        const sunTexture = textureLoader.load('/textures/stars/sun/8k_sun.jpg');

        // Stwórz kulę i nałóż teksturę
        const geometry = new THREE.SphereGeometry(1.5, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: sunTexture,
            emissive: 0xffaa00, // Żółta poświata
            emissiveIntensity: 0.5
        });

        const sun = new THREE.Mesh(geometry, material);
        scene.add(sun);

        // Ustawienie kamery
        camera.position.z = 5;

        // Animacja
        const animate = () => {
            requestAnimationFrame(animate);
            sun.rotation.y += 0.005; // Powolny obrót Słońca
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            if (mountElement) {
                mountElement.removeChild(renderer.domElement);
            }
        };
    }, []);

    return <div ref={mountRef} style={{ width: '100%', height: '100vh', backgroundColor: 'black' }} />;
}
