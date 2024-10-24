"use client";
import { useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const EarthCanvas = () => {
    useEffect(() => {
        // Ustawienia sceny
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);

        // Geometria Ziemi
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const material = new THREE.MeshBasicMaterial({ map: textureLoader.load('/8k_earth_daymap.jpg') });
        const earth = new THREE.Mesh(geometry, material);

        scene.add(earth);

        camera.position.z = 5;

        // Dodaj OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            renderer.dispose();
            document.body.removeChild(renderer.domElement);
        };
    }, []);

    return null; // Nie renderuj nic, wszystko robi Three.js
};

export default EarthCanvas;
