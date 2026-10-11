
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./SolarSystemCanvas.css";

const AU = 18;
const DAY_MS = 86400000;
const J2000 = Date.UTC(2000, 0, 1, 12);
const DEG = Math.PI / 180;
const SUN_RADIUS = 4.5;

const PLANETS = [
    {
        id: "mercury", name: "Mercury", color: "#aaa9a5",
        texture: "/textures/planets/mercury/8k_mercury.jpg",
        radius: 0.38, a: 0.3871, e: 0.2056, period: 87.969,
        rotation: 58.646, tilt: 0.034, phase: 174.8,
        node: 48.331, inclination: 7.005, peri: 29.124,
        description: "The smallest planet in the Solar System.",
    },
    {
        id: "venus", name: "Venus", color: "#e6b878",
        texture: "/textures/planets/venus/8k_venus_surface.jpg",
        radius: 0.62, a: 0.7233, e: 0.0068, period: 224.701,
        rotation: -243.025, tilt: 177.36, phase: 50.4,
        node: 76.68, inclination: 3.3947, peri: 54.884,
        description: "A rocky planet with a dense atmosphere.",
    },
    {
        id: "earth", name: "Earth", color: "#4b91e2",
        texture: "/textures/planets/earth/8k_earth_daymap.jpg",
        radius: 0.66, a: 1, e: 0.0167, period: 365.256,
        rotation: 0.99727, tilt: 23.439, phase: 357.5,
        node: 0, inclination: 0, peri: 102.937,
        description: "Our home planet and the only known world with life.",
    },
    {
        id: "mars", name: "Mars", color: "#d66b4b",
        texture: "/textures/planets/mars/8k_mars.jpg",
        radius: 0.49, a: 1.5237, e: 0.0934, period: 686.98,
        rotation: 1.02596, tilt: 25.19, phase: 19.4,
        node: 49.558, inclination: 1.85, peri: 286.502,
        description: "A rocky world known as the Red Planet.",
    },
    {
        id: "jupiter", name: "Jupiter", color: "#d8b69a",
        texture: "/textures/planets/jupiter/8k_jupiter.jpg",
        radius: 2.25, a: 5.2026, e: 0.0485, period: 4332.59,
        rotation: 0.41354, tilt: 3.13, phase: 20,
        node: 100.464, inclination: 1.303, peri: 273.867,
        description: "The largest planet in the Solar System.",
    },
    {
        id: "saturn", name: "Saturn", color: "#d9c49b",
        texture: "/textures/planets/saturn/8k_saturn.jpg",
        radius: 1.85, a: 9.5549, e: 0.0555, period: 10759.22,
        rotation: 0.444, tilt: 26.73, phase: 317,
        node: 113.665, inclination: 2.489, peri: 339.392,
        description: "A gas giant with an extensive ring system.",
    },
    {
        id: "uranus", name: "Uranus", color: "#91d9e3",
        texture: "/textures/planets/uranus/2k_uranus.jpg",
        radius: 1.18, a: 19.2184, e: 0.0463, period: 30688.5,
        rotation: -0.71833, tilt: 97.77, phase: 142.2,
        node: 74.006, inclination: 0.773, peri: 96.998,
        description: "An ice giant that rotates almost on its side.",
    },
    {
        id: "neptune", name: "Neptune", color: "#5277ee",
        texture: "/textures/planets/neptune/2k_neptune.jpg",
        radius: 1.14, a: 30.11, e: 0.0095, period: 60182,
        rotation: 0.67125, tilt: 28.32, phase: 256.2,
        node: 131.784, inclination: 1.77, peri: 273.187,
        description: "A distant, cold ice giant.",
    },
];

const SPECIAL_OBJECTS = {
    sun: {
        id: "sun", name: "Sun", color: "#ffb45e",
        type: "Star",
        description: "The star at the center of the Solar System. Its light and heat provide energy to the planets.",
        diameter: "About 1,392,700 km",
        temperature: "About 5,500°C",
        detailLabel: "Object type",
        detailValue: "Main-sequence star",
        distanceLabel: "Distance from Earth",
        distanceValue: "About 149.6 million km",
    },
    moon: {
        id: "moon", name: "Moon", color: "#b9c5d8",
        type: "Natural satellite",
        description: "Earth's natural satellite. Its visible phase changes according to its position relative to Earth and the Sun.",
        diameter: "About 3,475 km",
        temperature: "About −173°C to +127°C",
        detailLabel: "Orbital period",
        detailValue: "About 27.3 days",
        distanceLabel: "Average distance from Earth",
        distanceValue: "About 384,400 km",
    },
};

function normalizeAngle(angle) {
    return ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
}

function solveKepler(meanAnomaly, eccentricity) {
    const M = normalizeAngle(meanAnomaly);
    let E = eccentricity < 0.8 ? M : Math.PI;

    for (let i = 0; i < 20; i += 1) {
        const delta =
            (E - eccentricity * Math.sin(E) - M) /
            (1 - eccentricity * Math.cos(E));

        E -= delta;
        if (Math.abs(delta) < 1e-10) break;
    }

    return E;
}

function getEccentricAnomaly(planet, dateMs) {
    const days = (dateMs - J2000) / DAY_MS;
    const meanAnomaly = normalizeAngle(
        planet.phase * DEG +
        (days / planet.period) * Math.PI * 2
    );

    return solveKepler(meanAnomaly, planet.e);
}

function getOrbitPoint(planet, eccentricAnomaly, mode, index) {
    if (mode === "visual") {
        const radius = 9 + index * 5.2;

        return new THREE.Vector3(
            radius * Math.cos(eccentricAnomaly),
            0,
            radius * Math.sin(eccentricAnomaly)
        );
    }

    const a = planet.a * AU;
    const e = planet.e;

    const x = a * (Math.cos(eccentricAnomaly) - e);
    const z = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);

    const w = planet.peri * DEG;
    const node = planet.node * DEG;
    const inc = planet.inclination * DEG;

    const x1 = x * Math.cos(w) - z * Math.sin(w);
    const z1 = x * Math.sin(w) + z * Math.cos(w);
    const y2 = z1 * Math.sin(inc);
    const z2 = z1 * Math.cos(inc);

    return new THREE.Vector3(
        x1 * Math.cos(node) - z2 * Math.sin(node),
        y2,
        x1 * Math.sin(node) + z2 * Math.cos(node)
    );
}

function getPlanetPosition(planet, dateMs, mode, index) {
    return getOrbitPoint(
        planet,
        getEccentricAnomaly(planet, dateMs),
        mode,
        index
    );
}

function getOrbitPoints(planet, mode, index) {
    const points = [];

    for (let i = 0; i <= 512; i += 1) {
        points.push(
            getOrbitPoint(
                planet,
                (i / 512) * Math.PI * 2,
                mode,
                index
            )
        );
    }

    return points;
}

function createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = "bold 42px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "#000";
    context.shadowBlur = 8;
    context.fillStyle = color;
    context.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
        })
    );

    sprite.scale.set(5.5, 1.38, 1);
    return sprite;
}

// Generate ring bands procedurally instead of using a flat image.
function createSaturnRingTexture() {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    const image = ctx.createImageData(size, size);
    const center = size / 2;

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const dx = (x - center) / center;
            const dy = (y - center) / center;
            const radius = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const i = (y * size + x) * 4;

            const variation =
                Math.sin(radius * 390) * 0.10 +
                Math.sin(radius * 720 + Math.sin(angle * 9) * 0.8) * 0.06 +
                Math.sin(radius * 1150) * 0.035;

            const noise = (Math.random() - 0.5) * 0.045;

            const gapA =
                Math.pow(Math.max(0, Math.sin(radius * 155 + 0.8)), 18) *
                0.28;

            const gapB =
                Math.pow(Math.max(0, Math.sin(radius * 285)), 24) *
                0.22;

            const brightness = THREE.MathUtils.clamp(
                0.68 + variation + noise - gapA - gapB,
                0.18,
                0.98
            );

            image.data[i] = 204 * brightness;
            image.data[i + 1] = 183 * brightness;
            image.data[i + 2] = 143 * brightness;
            image.data[i + 3] = radius > 0.99 ? 0 : 255;
        }
    }

    ctx.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;

    return texture;
}



export default function SolarSystemCanvas() {
    const mountRef = useRef(null);
    const apiRef = useRef(null);

    const [mode, setMode] = useState("astro");
    const [showOrbits, setShowOrbits] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [selectedPlanet, setSelectedPlanet] = useState("earth");
    const [speed, setSpeed] = useState(10);

    const [sunIntensity, setSunIntensity] = useState(850);
    const [ambientIntensity, setAmbientIntensity] = useState(0.14);
    const [sunGlowIntensity, setSunGlowIntensity] = useState(0.06);

    const [dateValue, setDateValue] = useState(() => {
        const now = new Date();
        const local = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        );

        return local.toISOString().slice(0, 16);
    });

    const modeRef = useRef(mode);
    const showOrbitsRef = useRef(showOrbits);
    const showLabelsRef = useRef(showLabels);
    const playingRef = useRef(isPlaying);
    const selectedRef = useRef(selectedPlanet);
    const speedRef = useRef(speed);
    const dateRef = useRef(new Date(dateValue).getTime());

    useEffect(() => {
        modeRef.current = mode;
        showOrbitsRef.current = showOrbits;
        showLabelsRef.current = showLabels;
        playingRef.current = isPlaying;
        selectedRef.current = selectedPlanet;
        speedRef.current = speed;

        apiRef.current?.updateAll();
    }, [mode, showOrbits, showLabels, isPlaying, selectedPlanet, speed]);

    useEffect(() => {
        const parsedDate = new Date(dateValue).getTime();

        if (Number.isFinite(parsedDate)) {
            dateRef.current = parsedDate;
            apiRef.current?.updateAll();
        }
    }, [dateValue]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return undefined;

        let destroyed = false;
        let animationFrame = 0;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x03050c);

        const camera = new THREE.PerspectiveCamera(
            48,
            Math.max(mount.clientWidth, 1) /
                Math.max(mount.clientHeight, 1),
            0.1,
            10000
        );

        camera.position.set(0, 105, 185);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.85;
        mount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.enableZoom = true;
        controls.minDistance = 2;
        controls.maxDistance = 2500;
        controls.target.set(0, 0, 0);

        const ambient = new THREE.AmbientLight(
            0x667086,
            ambientIntensity
        );
        scene.add(ambient);

        const sunLight = new THREE.PointLight(
            0xfff0dc,
            sunIntensity,
            0,
            2
        );
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const loader = new THREE.TextureLoader();

        const planetGroups = {};
        const planetMeshes = {};
        const planetMaterials = {};
        const orbitLines = {};
        const labels = {};
        const pickables = [];

        let moonMesh = null;
        let moonLabel = null;

        const moonWorldPosition = new THREE.Vector3();
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        const cameraOffset = new THREE.Vector3();
        const desiredCameraPosition = new THREE.Vector3();
        const desiredTarget = new THREE.Vector3();
        const currentTarget = new THREE.Vector3();
        const movementDelta = new THREE.Vector3();

        let followedPlanetId = null;
        let cameraTransition = 0;

        function loadTexture(path) {
            const texture = loader.load(
                path,
                undefined,
                undefined,
                () => console.warn(`Failed to load texture: ${path}`)
            );

            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = Math.min(
                renderer.capabilities.getMaxAnisotropy(),
                8
            );

            return texture;
        }

        // Background stars.
        {
            const count = 7000;
            const positions = new Float32Array(count * 3);
            const colors = new Float32Array(count * 3);

            for (let i = 0; i < count; i += 1) {
                const radius = 800 + Math.random() * 1800;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const brightness = 0.45 + Math.random() * 0.55;

                positions[i * 3] =
                    radius * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = radius * Math.cos(phi);
                positions[i * 3 + 2] =
                    radius * Math.sin(phi) * Math.sin(theta);

                colors[i * 3] = brightness;
                colors[i * 3 + 1] = brightness * 0.95;
                colors[i * 3 + 2] = brightness * 0.9;
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            );
            geometry.setAttribute(
                "color",
                new THREE.BufferAttribute(colors, 3)
            );

            scene.add(
                new THREE.Points(
                    geometry,
                    new THREE.PointsMaterial({
                        size: 1.4,
                        vertexColors: true,
                        sizeAttenuation: true,
                        transparent: true,
                        opacity: 0.9,
                        depthWrite: false,
                    })
                )
            );
        }

        const sunTexture = loadTexture("/textures/stars/sun/8k_sun.jpg");

        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(SUN_RADIUS, 96, 64),
            new THREE.MeshBasicMaterial({
                map: sunTexture,
                toneMapped: false,
            })
        );

        sun.name = "sun";
        sun.userData.isSun = true;
        scene.add(sun);
        pickables.push(sun);

        const sunGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffa13a,
            transparent: true,
            opacity: sunGlowIntensity,
            side: THREE.BackSide,
            depthWrite: false,
            toneMapped: true,
            blending: THREE.AdditiveBlending,
        });

        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(SUN_RADIUS * 1.18, 48, 32),
            sunGlowMaterial
        );
        scene.add(sunGlow);

        const sunLabel = createTextSprite("Sun", "#ffbd72");
        sunLabel.position.set(0, SUN_RADIUS + 1.4, 0);
        scene.add(sunLabel);

        function updateOrbit(planet, nextMode = modeRef.current) {
            const line = orbitLines[planet.id];
            if (!line) return;

            const index = PLANETS.findIndex(
                (item) => item.id === planet.id
            );

            const oldGeometry = line.geometry;
            line.geometry = new THREE.BufferGeometry().setFromPoints(
                getOrbitPoints(planet, nextMode, index)
            );

            oldGeometry.dispose();
            line.visible = showOrbitsRef.current;
        }

        function createOrbit(planet) {
            const line = new THREE.Line(
                new THREE.BufferGeometry(),
                new THREE.LineBasicMaterial({
                    color: 0x6487b4,
                    transparent: true,
                    opacity: 0.48,
                    depthWrite: false,
                })
            );

            line.frustumCulled = false;
            orbitLines[planet.id] = line;
            scene.add(line);
            updateOrbit(planet);
        }

        function createPlanet(planet) {
            const group = new THREE.Group();
            group.name = `${planet.id}-orbit-position`;

            // The axial group tilts the planet and Saturn's rings together.
            const axialGroup = new THREE.Group();
            axialGroup.name = `${planet.id}-axial-tilt`;
            axialGroup.rotation.z = planet.tilt * DEG;
            group.add(axialGroup);

            const material = new THREE.MeshStandardMaterial({
                map: loadTexture(planet.texture),
                roughness: 0.88,
                metalness: 0,
                color: 0xffffff,
            });

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(planet.radius, 96, 64),
                material
            );

            mesh.userData.planetId = planet.id;
            axialGroup.add(mesh);

            planetGroups[planet.id] = group;
            planetMeshes[planet.id] = mesh;
            planetMaterials[planet.id] = material;

            pickables.push(mesh);
            scene.add(group);

            const label = createTextSprite(planet.name, planet.color);
            labels[planet.id] = label;
            scene.add(label);

            createOrbit(planet);

            if (planet.id === "saturn") {
                const ringTexture = createSaturnRingTexture();

                const ringMaterial = new THREE.MeshStandardMaterial({
                    map: ringTexture,
                    alphaMap: ringTexture,
                    color: 0xffffff,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.96,
                    roughness: 1,
                    metalness: 0,
                    depthWrite: false,
                });

                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(
                        planet.radius * 1.25,
                        planet.radius * 2.45,
                        256
                    ),
                    ringMaterial
                );

                // Align the ring plane with the planet's local equator.
                ring.rotation.x = -Math.PI / 2;
                axialGroup.add(ring);
            }

            if (planet.id === "earth") {
                const clouds = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        planet.radius * 1.012,
                        96,
                        64
                    ),
                    new THREE.MeshStandardMaterial({
                        map: loadTexture(
                            "/textures/planets/earth/8k_earth_clouds.jpg"
                        ),
                        transparent: true,
                        opacity: 0.2,
                        depthWrite: false,
                        roughness: 1,
                    })
                );

                clouds.name = "earth-clouds";
                mesh.add(clouds);

                const moonOrbitPlane = new THREE.Group();
                moonOrbitPlane.name = "moon-orbit-plane";

                const moonOrbitNode = new THREE.Group();
                moonOrbitNode.name = "moon-orbit-node";

                const moonGroup = new THREE.Group();
                moonGroup.name = "moon-orbit-angle";

                const moon = new THREE.Mesh(
                    new THREE.SphereGeometry(0.18, 48, 32),
                    new THREE.MeshStandardMaterial({
                        map: loadTexture("/textures/moons/luna/8k_moon.jpg"),
                        roughness: 1,
                        metalness: 0,
                    })
                );

                moon.name = "moon";
                moon.userData.planetId = "moon";
                moon.position.x = 2.2;

                moonGroup.add(moon);
                moonOrbitNode.add(moonGroup);
                moonOrbitPlane.add(moonOrbitNode);
                group.add(moonOrbitPlane);

                moonMesh = moon;
                pickables.push(moon);

                const points = [];

                for (let i = 0; i <= 128; i += 1) {
                    const angle = (i / 128) * Math.PI * 2;
                    points.push(
                        new THREE.Vector3(
                            Math.cos(angle) * 2.2,
                            0,
                            Math.sin(angle) * 2.2
                        )
                    );
                }

                const moonOrbitLine = new THREE.LineLoop(
                    new THREE.BufferGeometry().setFromPoints(points),
                    new THREE.LineBasicMaterial({
                        color: 0x8a9ab8,
                        transparent: true,
                        opacity: 0.32,
                        depthWrite: false,
                    })
                );

                moonOrbitPlane.add(moonOrbitLine);

                group.userData.moonOrbitPlane = moonOrbitPlane;
                group.userData.moonOrbitNode = moonOrbitNode;
                group.userData.moonGroup = moonGroup;
                group.userData.moonOrbitLine = moonOrbitLine;

                moonLabel = createTextSprite("Moon", "#c7d2e4");
                scene.add(moonLabel);
            }
        }

        PLANETS.forEach(createPlanet);

        function updateOrbitVisibility() {
            Object.values(orbitLines).forEach((line) => {
                line.visible = showOrbitsRef.current;
            });

            const moonOrbitLine =
                planetGroups.earth?.userData.moonOrbitLine;

            if (moonOrbitLine) {
                moonOrbitLine.visible = showOrbitsRef.current;
            }

            Object.values(labels).forEach((label) => {
                label.visible = showLabelsRef.current;
            });

            sunLabel.visible = showLabelsRef.current;

            if (moonLabel) moonLabel.visible = showLabelsRef.current;
        }

        function getMoonWorldPosition(target = moonWorldPosition) {
            if (!moonMesh) return target.set(0, 0, 0);

            scene.updateMatrixWorld(true);
            moonMesh.getWorldPosition(target);
            return target;
        }

        function updatePositions(dateMs) {
            const elapsedDays = (dateMs - J2000) / DAY_MS;

            PLANETS.forEach((planet, index) => {
                const group = planetGroups[planet.id];
                const mesh = planetMeshes[planet.id];

                if (!group || !mesh) return;

                group.position.copy(
                    getPlanetPosition(
                        planet,
                        dateMs,
                        modeRef.current,
                        index
                    )
                );

                mesh.rotation.y =
                    (elapsedDays / planet.rotation) * Math.PI * 2;

                const clouds = mesh.getObjectByName("earth-clouds");

                if (clouds) {
                    clouds.rotation.y = mesh.rotation.y * 1.04;
                }

                const moonGroup = group.userData.moonGroup;
                const moonOrbitPlane = group.userData.moonOrbitPlane;
                const moonOrbitNode = group.userData.moonOrbitNode;

                if (moonGroup && moonOrbitPlane && moonOrbitNode) {
                    moonGroup.rotation.y =
                        elapsedDays * (Math.PI * 2 / 27.321661);

                    if (modeRef.current === "astro") {
                        moonOrbitPlane.rotation.set(0, 0, 5.145 * DEG);
                        moonOrbitNode.rotation.y = 125.08 * DEG;
                    } else {
                        moonOrbitPlane.rotation.set(0, 0, 0);
                        moonOrbitNode.rotation.y = 0;
                    }
                }

                const label = labels[planet.id];
                label.position.copy(group.position);
                label.position.y += planet.radius + 1.1;

                planetMaterials[planet.id].emissive.set(
                    selectedRef.current === planet.id
                        ? 0x080808
                        : 0x000000
                );

                if (orbitLines[planet.id]) {
                    orbitLines[planet.id].visible =
                        showOrbitsRef.current;
                }
            });

            if (moonLabel && moonMesh) {
                getMoonWorldPosition(moonLabel.position);
                moonLabel.position.y += 0.45;
            }

            updateOrbitVisibility();
        }

        function updateAll() {
            PLANETS.forEach((planet) => updateOrbit(planet));
            updatePositions(dateRef.current);
        }

        function setLighting(sunPower, ambientPower, glowPower) {
            sunLight.intensity = sunPower;
            ambient.intensity = ambientPower;
            sunGlowMaterial.opacity = glowPower;
        }

        function getFollowPosition() {
            if (followedPlanetId === "sun") return sun.position;

            if (followedPlanetId === "moon" && moonMesh) {
                return getMoonWorldPosition();
            }

            if (followedPlanetId && planetGroups[followedPlanetId]) {
                return planetGroups[followedPlanetId].position;
            }

            return null;
        }

        function beginFocus(targetPosition, distance, animate = true) {
            cameraOffset.copy(camera.position).sub(controls.target);

            if (cameraOffset.lengthSq() < 0.001) {
                cameraOffset.set(0.6, 0.65, 1);
            }

            cameraOffset.normalize().multiplyScalar(distance);
            desiredTarget.copy(targetPosition);
            desiredCameraPosition.copy(targetPosition).add(cameraOffset);
            currentTarget.copy(targetPosition);

            if (animate) {
                cameraTransition = 1;
            } else {
                camera.position.copy(desiredCameraPosition);
                controls.target.copy(desiredTarget);
                currentTarget.copy(desiredTarget);
                cameraTransition = 0;
            }

            controls.update();
        }

        function focusPlanet(planetId, animate = true) {
            const group = planetGroups[planetId];
            const planet = PLANETS.find(
                (item) => item.id === planetId
            );

            if (!group || !planet || followedPlanetId === planetId) return;

            followedPlanetId = planetId;

            const currentDistance = camera.position.distanceTo(
                controls.target
            );

            const distance = THREE.MathUtils.clamp(
                Math.max(
                    planet.radius * 7,
                    Math.min(currentDistance * 0.28, 16)
                ),
                planet.radius * 3.5,
                20
            );

            beginFocus(group.position, distance, animate);
        }

        function focusSun(animate = true) {
            if (followedPlanetId === "sun") return;

            followedPlanetId = "sun";

            const distance = THREE.MathUtils.clamp(
                Math.max(
                    camera.position.distanceTo(controls.target) * 0.25,
                    15
                ),
                12,
                30
            );

            beginFocus(sun.position, distance, animate);
        }

        function focusMoon(animate = true) {
            if (!moonMesh || followedPlanetId === "moon") return;

            followedPlanetId = "moon";
            beginFocus(getMoonWorldPosition(), 5, animate);
        }

        controls.addEventListener("start", () => {
            cameraTransition = 0;
            const followPosition = getFollowPosition();
            currentTarget.copy(followPosition || controls.target);
        });

        apiRef.current = {
            updateAll,
            focusPlanet,
            focusSun,
            focusMoon,
            setLighting,
        };

        setLighting(sunIntensity, ambientIntensity, sunGlowIntensity);
        updateAll();

        function onPointerDown(event) {
            const rect = renderer.domElement.getBoundingClientRect();

            pointer.x =
                ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y =
                -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            const intersections = raycaster.intersectObjects(
                pickables,
                false
            );

            if (intersections.length === 0) return;

            const clickedObject = intersections[0].object;

            if (clickedObject.userData.isSun) {
                setSelectedPlanet("sun");
                focusSun(true);
                return;
            }

            const objectId = clickedObject.userData.planetId;
            if (!objectId) return;

            setSelectedPlanet(objectId);

            if (objectId === "moon") focusMoon(true);
            else focusPlanet(objectId, true);
        }

        renderer.domElement.addEventListener(
            "pointerdown",
            onPointerDown
        );

        let previousTime = performance.now();

        function animate(now) {
            if (destroyed) return;

            animationFrame = requestAnimationFrame(animate);

            const deltaSeconds = Math.min(
                (now - previousTime) / 1000,
                0.1
            );

            previousTime = now;

            if (playingRef.current) {
                dateRef.current +=
                    deltaSeconds * speedRef.current * DAY_MS;

                updatePositions(dateRef.current);
            }

            const sunScale = modeRef.current === "astro" ? 0.52 : 1;
            sun.scale.setScalar(sunScale);
            sunGlow.scale.setScalar(sunScale);

            const followPosition = getFollowPosition();

            if (followPosition) {
                desiredTarget.copy(followPosition);

                if (cameraTransition > 0) {
                    desiredCameraPosition
                        .copy(followPosition)
                        .add(cameraOffset);

                    const alpha = 1 - Math.exp(-5 * deltaSeconds);

                    camera.position.lerp(desiredCameraPosition, alpha);
                    controls.target.lerp(desiredTarget, alpha);

                    if (
                        camera.position.distanceTo(desiredCameraPosition) < 0.05 &&
                        controls.target.distanceTo(desiredTarget) < 0.05
                    ) {
                        camera.position.copy(desiredCameraPosition);
                        controls.target.copy(desiredTarget);
                        cameraTransition = 0;
                    }

                    currentTarget.copy(followPosition);
                } else {
                    movementDelta.subVectors(followPosition, currentTarget);
                    camera.position.add(movementDelta);
                    controls.target.add(movementDelta);
                    currentTarget.copy(followPosition);
                }
            }

            controls.update();
            renderer.render(scene, camera);
        }

        animationFrame = requestAnimationFrame(animate);

        function onResize() {
            if (destroyed) return;

            const width = Math.max(mount.clientWidth, 1);
            const height = Math.max(mount.clientHeight, 1);

            camera.aspect = width / height;
            camera.updateProjectionMatrix();

            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        }

        window.addEventListener("resize", onResize);
        focusPlanet("earth", false);

        return () => {
            destroyed = true;
            cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", onResize);

            renderer.domElement.removeEventListener(
                "pointerdown",
                onPointerDown
            );

            controls.dispose();

            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();

                if (object.material) {
                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];

                    materials.forEach((material) => {
                        const textures = new Set();

                        [
                            material.map,
                            material.alphaMap,
                            material.emissiveMap,
                            material.normalMap,
                            material.roughnessMap,
                            material.metalnessMap,
                        ].forEach((texture) => {
                            if (texture) textures.add(texture);
                        });

                        textures.forEach((texture) => texture.dispose());
                        material.dispose();
                    });
                }
            });

            renderer.dispose();

            if (renderer.domElement.parentNode === mount) {
                mount.removeChild(renderer.domElement);
            }

            apiRef.current = null;
        };
    }, []);


    useEffect(() => {
        apiRef.current?.setLighting(
            sunIntensity,
            ambientIntensity,
            sunGlowIntensity
        );
    }, [sunIntensity, ambientIntensity, sunGlowIntensity]);

    const selectedData =
        PLANETS.find((planet) => planet.id === selectedPlanet) ??
        SPECIAL_OBJECTS[selectedPlanet] ??
        null;

    const handleDateChange = useCallback((value) => {
        setDateValue(value);

        const timestamp = new Date(value).getTime();
        if (Number.isFinite(timestamp)) dateRef.current = timestamp;
    }, []);

    function setCurrentDate() {
        const now = new Date();
        const local = new Date(
            now.getTime() - now.getTimezoneOffset() * 60000
        );

        handleDateChange(local.toISOString().slice(0, 16));
    }

    function focusSelectedObject() {
        if (!selectedData) return;

        if (selectedPlanet === "sun") {
            apiRef.current?.focusSun(true);
        } else if (selectedPlanet === "moon") {
            apiRef.current?.focusMoon(true);
        } else {
            apiRef.current?.focusPlanet(selectedPlanet, true);
        }
    }

    return (
        <div className="solar-app">
            <header className="solar-header">
                <div className="solar-brand">
                    <div className="solar-brand__title">SOLAR ATLAS</div>
                    <div className="solar-brand__subtitle">
                        Interactive Solar System Atlas
                    </div>
                </div>

                <div className="solar-status">
                    <span className="solar-status__dot" />
                    3D Simulation
                </div>
            </header>

            <div className="solar-workspace">
                <main className="solar-scene">
                    <div ref={mountRef} className="solar-canvas" />

                    <div className="solar-scene__controls">
                        <button
                            className="solar-button"
                            onClick={() =>
                                setMode((current) =>
                                    current === "astro" ? "visual" : "astro"
                                )
                            }
                        >
                            {mode === "astro" ? "Visual View" : "Astronomical View"}
                        </button>

                        <button
                            className="solar-button"
                            onClick={() => setShowOrbits((value) => !value)}
                        >
                            {showOrbits ? "Hide Orbits" : "Show Orbits"}
                        </button>

                        <button
                            className="solar-button"
                            onClick={() => setShowLabels((value) => !value)}
                        >
                            {showLabels ? "Hide Labels" : "Show Labels"}
                        </button>

                        <button
                            className="solar-button"
                            onClick={() => {
                                setSelectedPlanet("earth");
                                apiRef.current?.focusPlanet("earth", true);
                            }}
                        >
                            Earth
                        </button>
                    </div>

                    <div className="solar-scene__hint">
                        Click the Sun, a planet, or the Moon to view details and
                        follow the object · Drag to rotate the view · Scroll to zoom
                    </div>
                </main>

                <aside className="solar-sidebar">
                    <section className="solar-panel">
                        <h2 className="solar-panel__title">
                            SIMULATION SETTINGS
                        </h2>

                        <label className="solar-label" htmlFor="solar-date">
                            Date and Time
                        </label>

                        <input
                            id="solar-date"
                            className="solar-date"
                            type="datetime-local"
                            value={dateValue}
                            onChange={(event) =>
                                handleDateChange(event.target.value)
                            }
                        />

                        <div className="solar-button-row">
                            <button
                                className="solar-button solar-button--primary"
                                onClick={() =>
                                    setIsPlaying((value) => !value)
                                }
                            >
                                {isPlaying ? "❚❚ Pause" : "▶ Play"}
                            </button>

                            <button
                                className="solar-button"
                                onClick={setCurrentDate}
                            >
                                Now
                            </button>
                        </div>

                        <label className="solar-label" htmlFor="solar-speed">
                            Time Speed: {speed} days/s
                        </label>

                        <input
                            id="solar-speed"
                            className="solar-range"
                            type="range"
                            min="0"
                            max="365"
                            step="1"
                            value={speed}
                            onChange={(event) =>
                                setSpeed(Number(event.target.value))
                            }
                        />

                        <div className="solar-range-labels">
                            <span>0 days/s</span>
                            <span>365 days/s</span>
                        </div>

                        <div className="solar-light-settings">
                            <h3 className="solar-label">LIGHTING</h3>

                            <label className="solar-label" htmlFor="sun-intensity">
                                Sunlight: {sunIntensity}
                            </label>
                            <input
                                id="sun-intensity"
                                className="solar-range"
                                type="range"
                                min="100"
                                max="1800"
                                step="25"
                                value={sunIntensity}
                                onChange={(event) =>
                                    setSunIntensity(Number(event.target.value))
                                }
                            />

                            <label
                                className="solar-label"
                                htmlFor="ambient-intensity"
                            >
                                Ambient light: {ambientIntensity.toFixed(2)}
                            </label>
                            <input
                                id="ambient-intensity"
                                className="solar-range"
                                type="range"
                                min="0"
                                max="0.8"
                                step="0.02"
                                value={ambientIntensity}
                                onChange={(event) =>
                                    setAmbientIntensity(Number(event.target.value))
                                }
                            />

                            <label className="solar-label" htmlFor="sun-glow">
                                Sun glow: {sunGlowIntensity.toFixed(3)}
                            </label>
                            <input
                                id="sun-glow"
                                className="solar-range"
                                type="range"
                                min="0"
                                max="0.2"
                                step="0.005"
                                value={sunGlowIntensity}
                                onChange={(event) =>
                                    setSunGlowIntensity(Number(event.target.value))
                                }
                            />

                            <button
                                className="solar-button solar-button--wide"
                                onClick={() => {
                                    setSunIntensity(850);
                                    setAmbientIntensity(0.14);
                                    setSunGlowIntensity(0.06);
                                }}
                            >
                                Reset lighting
                            </button>
                        </div>
                    </section>

                    <section className="solar-panel">
                        <h2 className="solar-panel__title">PLANETS</h2>

                        <div className="solar-planet-list">
                            {PLANETS.map((planet) => (
                                <button
                                    key={planet.id}
                                    className={`solar-planet-button ${
                                        selectedPlanet === planet.id
                                            ? "solar-planet-button--active"
                                            : ""
                                    }`}
                                    onClick={() => {
                                        setSelectedPlanet(planet.id);
                                        apiRef.current?.focusPlanet(
                                            planet.id,
                                            true
                                        );
                                    }}
                                >
                                    <span
                                        className="solar-planet-button__dot"
                                        style={{ backgroundColor: planet.color }}
                                    />

                                    <span className="solar-planet-button__name">
                                        {planet.name}
                                    </span>

                                    {selectedPlanet === planet.id && (
                                        <span className="solar-planet-button__marker">
                                            ●
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="solar-planet-list">
                            {[SPECIAL_OBJECTS.sun, SPECIAL_OBJECTS.moon].map(
                                (object) => (
                                    <button
                                        key={object.id}
                                        className={`solar-planet-button ${
                                            selectedPlanet === object.id
                                                ? "solar-planet-button--active"
                                                : ""
                                        }`}
                                        onClick={() => {
                                            setSelectedPlanet(object.id);

                                            if (object.id === "sun") {
                                                apiRef.current?.focusSun(true);
                                            } else {
                                                apiRef.current?.focusMoon(true);
                                            }
                                        }}
                                    >
                                        <span
                                            className="solar-planet-button__dot"
                                            style={{
                                                backgroundColor: object.color,
                                            }}
                                        />

                                        <span className="solar-planet-button__name">
                                            {object.name}
                                        </span>

                                        {selectedPlanet === object.id && (
                                            <span className="solar-planet-button__marker">
                                                ●
                                            </span>
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    </section>

                    <section className="solar-panel">
                        <h2 className="solar-panel__title">SELECTED OBJECT</h2>

                        {selectedData && (
                            <>
                                <div className="solar-selected-title">
                                    <span
                                        className="solar-selected-title__dot"
                                        style={{
                                            backgroundColor: selectedData.color,
                                        }}
                                    />
                                    {selectedData.name}
                                </div>

                                <p className="solar-description">
                                    {selectedData.description}
                                </p>

                                {"a" in selectedData ? (
                                    <>
                                        <div className="solar-data-row">
                                            <span>Average Distance</span>
                                            <strong>{selectedData.a} AU</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Orbital Period</span>
                                            <strong>
                                                {selectedData.period.toLocaleString(
                                                    "en-US"
                                                )} days
                                            </strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Orbital Eccentricity</span>
                                            <strong>{selectedData.e}</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Orbital Inclination</span>
                                            <strong>
                                                {selectedData.inclination}°
                                            </strong>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="solar-data-row">
                                            <span>Object Type</span>
                                            <strong>{selectedData.type}</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Diameter</span>
                                            <strong>{selectedData.diameter}</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Temperature</span>
                                            <strong>{selectedData.temperature}</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>{selectedData.distanceLabel}</span>
                                            <strong>{selectedData.distanceValue}</strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>{selectedData.detailLabel}</span>
                                            <strong>{selectedData.detailValue}</strong>
                                        </div>
                                    </>
                                )}

                                <button
                                    className="solar-button solar-button--wide"
                                    onClick={focusSelectedObject}
                                >
                                    Focus and Follow
                                </button>
                            </>
                        )}
                    </section>

                    <div className="solar-footer-note">
                        <strong>Model Information</strong>
                        <p>
                            Distances and orbital elements are approximate.
                            Planet sizes have been increased to improve
                            visibility in the 3D view. Lighting and brightness
                            are adjusted for a clear visualization.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
