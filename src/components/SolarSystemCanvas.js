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
const MOON_ORBIT_INCLINATION = 5.145 * DEG;

const PLANETS = [
    {
        id: "mercury",
        name: "Mercury",
        color: "#aaa9a5",
        texture: "/textures/planets/mercury/8k_mercury.jpg",
        radius: 0.38,
        period: 87.969,
        rotation: 58.646,
        tilt: 0.034,
        orbitalRadius: 9,
        description: "The smallest planet in the Solar System.",
    },
    {
        id: "venus",
        name: "Venus",
        color: "#e6b878",
        texture: "/textures/planets/venus/8k_venus_surface.jpg",
        radius: 0.62,
        period: 224.701,
        rotation: -243.025,
        tilt: 177.36,
        orbitalRadius: 14.2,
        description: "A rocky planet with a dense atmosphere.",
    },
    {
        id: "earth",
        name: "Earth",
        color: "#4b91e2",
        texture: "/textures/planets/earth/8k_earth_daymap.jpg",
        nightTexture: "/textures/planets/earth/8k_earth_nightmap.jpg",
        cloudsTexture: "/textures/planets/earth/8k_earth_clouds.jpg",
        normalTexture: "/textures/planets/earth/8k_earth_normal_map.png",
        specularTexture: "/textures/planets/earth/8k_earth_specular_map.png",
        radius: 0.66,
        period: 365.256,
        rotation: 0.99727,
        tilt: 23.439,
        orbitalRadius: 19,
        description: "Our home planet and the only known world with life.",
    },
    {
        id: "mars",
        name: "Mars",
        color: "#d66b4b",
        texture: "/textures/planets/mars/8k_mars.jpg",
        radius: 0.49,
        period: 686.98,
        rotation: 1.02596,
        tilt: 25.19,
        orbitalRadius: 23.8,
        description: "A rocky world known as the Red Planet.",
    },
    {
        id: "jupiter",
        name: "Jupiter",
        color: "#d8b69a",
        texture: "/textures/planets/jupiter/8k_jupiter.jpg",
        radius: 2.25,
        period: 4332.59,
        rotation: 0.41354,
        tilt: 3.13,
        orbitalRadius: 32,
        description: "The largest planet in the Solar System.",
    },
    {
        id: "saturn",
        name: "Saturn",
        color: "#d9c49b",
        texture: "/textures/planets/saturn/8k_saturn.jpg",
        radius: 1.85,
        period: 10759.22,
        rotation: 0.444,
        tilt: 26.73,
        orbitalRadius: 42,
        description: "A gas giant with an extensive ring system.",
    },
    {
        id: "uranus",
        name: "Uranus",
        color: "#91d9e3",
        texture: "/textures/planets/uranus/2k_uranus.jpg",
        radius: 1.18,
        period: 30688.5,
        rotation: -0.71833,
        tilt: 97.77,
        orbitalRadius: 52,
        description: "An ice giant that rotates almost on its side.",
    },
    {
        id: "neptune",
        name: "Neptune",
        color: "#5277ee",
        texture: "/textures/planets/neptune/2k_neptune.jpg",
        radius: 1.14,
        period: 60182,
        rotation: 0.67125,
        tilt: 28.32,
        orbitalRadius: 62,
        description: "A distant, cold ice giant.",
    },
];

const ORBITAL_ELEMENTS = {
    mercury: {
        a: 0.38709927, ad: 0.00000037,
        e: 0.20563593, ed: 0.00001906,
        i: 7.00497902, id: -0.00594749,
        L: 252.2503235, Ld: 149472.67411175,
        p: 77.45779628, pd: 0.16047689,
        n: 48.33076593, nd: -0.12534081,
    },
    venus: {
        a: 0.72333566, ad: 0.00000390,
        e: 0.00677672, ed: -0.00004107,
        i: 3.39467605, id: -0.00078890,
        L: 181.9790995, Ld: 58517.81538729,
        p: 131.60246718, pd: 0.00268329,
        n: 76.67984255, nd: -0.27769418,
    },
    earth: {
        a: 1.00000261, ad: 0.00000562,
        e: 0.01671123, ed: -0.00004392,
        i: -0.00001531, id: -0.01294668,
        L: 100.46457166, Ld: 35999.37244981,
        p: 102.93768193, pd: 0.32327364,
        n: 0, nd: 0,
    },
    mars: {
        a: 1.52371034, ad: 0.00001847,
        e: 0.09339410, ed: 0.00007882,
        i: 1.84969142, id: -0.00813131,
        L: -4.55343205, Ld: 19140.30268499,
        p: -23.94362959, pd: 0.44441088,
        n: 49.55953891, nd: -0.29257343,
    },
    jupiter: {
        a: 5.202887, ad: -0.00011607,
        e: 0.04838624, ed: -0.00013253,
        i: 1.30439695, id: -0.00183714,
        L: 34.39644051, Ld: 3034.74612775,
        p: 14.72847983, pd: 0.21252668,
        n: 100.47390909, nd: 0.20469106,
    },
    saturn: {
        a: 9.53667594, ad: -0.00125060,
        e: 0.05386179, ed: -0.00050991,
        i: 2.48599187, id: 0.00193609,
        L: 49.95424423, Ld: 1222.49362201,
        p: 92.59887831, pd: -0.41897216,
        n: 113.66242448, nd: -0.28867794,
    },
    uranus: {
        a: 19.18916464, ad: -0.00196176,
        e: 0.04725744, ed: -0.00004397,
        i: 0.77263783, id: -0.00242939,
        L: 313.23810451, Ld: 428.48202785,
        p: 170.9542763, pd: 0.40805281,
        n: 74.01692503, nd: 0.04240589,
    },
    neptune: {
        a: 30.06992276, ad: 0.00026291,
        e: 0.00859048, ed: 0.00005105,
        i: 1.77004347, id: 0.00035372,
        L: -55.12002969, Ld: 218.45945325,
        p: 44.96476227, pd: -0.32241464,
        n: 131.78422574, nd: -0.00508664,
    },
};

const SPECIAL_OBJECTS = {
    sun: {
        id: "sun",
        name: "Sun",
        color: "#ffb45e",
        type: "Star",
        description: "The star at the center of the Solar System.",
        diameter: "About 1,392,700 km",
        temperature: "About 5,500°C",
        detailLabel: "Object type",
        detailValue: "Main-sequence star",
        distanceLabel: "Distance from Earth",
        distanceValue: "About 149.6 million km",
    },
    moon: {
        id: "moon",
        name: "Moon",
        color: "#b9c5d8",
        type: "Natural satellite",
        description: "Earth's natural satellite. Its orbit is simplified in this visualization.",
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

function solveKepler(M, e) {
    let E = M;

    for (let i = 0; i < 30; i += 1) {
        const delta =
            (E - e * Math.sin(E) - M) /
            (1 - e * Math.cos(E));

        E -= delta;

        if (Math.abs(delta) < 1e-12) break;
    }

    return E;
}

function getOrbitalState(planet, dateMs) {
    const el = ORBITAL_ELEMENTS[planet.id];
    const jd = dateMs / DAY_MS + 2440587.5;
    const T = (jd - 2451545.0) / 36525;

    const a = el.a + el.ad * T;
    const e = el.e + el.ed * T;
    const inc = (el.i + el.id * T) * DEG;
    const L = el.L + el.Ld * T;
    const perihelion = el.p + el.pd * T;
    const node = el.n + el.nd * T;

    return {
        a,
        e,
        inc,
        omega: (perihelion - node) * DEG,
        node: node * DEG,
        M: normalizeAngle((L - perihelion) * DEG),
    };
}

function getAstronomicalPosition(planet, dateMs) {
    const state = getOrbitalState(planet, dateMs);
    const E = solveKepler(state.M, state.e);

    const xOrb = state.a * (Math.cos(E) - state.e);
    const yOrb =
        state.a *
        Math.sqrt(1 - state.e * state.e) *
        Math.sin(E);

    const w = state.omega;
    const n = state.node;
    const i = state.inc;

    const cw = Math.cos(w);
    const sw = Math.sin(w);
    const cn = Math.cos(n);
    const sn = Math.sin(n);
    const ci = Math.cos(i);
    const si = Math.sin(i);

    const x =
        (cw * cn - sw * sn * ci) * xOrb +
        (-sw * cn - cw * sn * ci) * yOrb;

    const y =
        (cw * sn + sw * cn * ci) * xOrb +
        (-sw * sn + cw * cn * ci) * yOrb;

    const z =
        sw * si * xOrb +
        cw * si * yOrb;

    return new THREE.Vector3(x * AU, z * AU, -y * AU);
}

function getVisualPosition(planet, dateMs) {
    const state = getOrbitalState(planet, dateMs);
    const E = solveKepler(state.M, state.e);
    const a = planet.orbitalRadius;
    const e = state.e;

    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

    const w = state.omega;
    const n = state.node;
    const i = state.inc;

    const cw = Math.cos(w);
    const sw = Math.sin(w);
    const cn = Math.cos(n);
    const sn = Math.sin(n);
    const ci = Math.cos(i);
    const si = Math.sin(i);

    const x =
        (cw * cn - sw * sn * ci) * xOrb +
        (-sw * cn - cw * sn * ci) * yOrb;

    const y =
        (cw * sn + sw * cn * ci) * xOrb +
        (-sw * sn + cw * cn * ci) * yOrb;

    const z = sw * si * xOrb + cw * si * yOrb;

    return new THREE.Vector3(x, z, -y);
}

function getPlanetPosition(planet, dateMs, mode) {
    return mode === "astro"
        ? getAstronomicalPosition(planet, dateMs)
        : getVisualPosition(planet, dateMs);
}

function getOrbitPoints(planet, mode, dateMs) {
    const points = [];
    const state = getOrbitalState(planet, dateMs);

    const a = mode === "visual" ? planet.orbitalRadius : state.a * AU;
    const e = state.e;
    const w = state.omega;
    const n = state.node;
    const i = state.inc;

    const cw = Math.cos(w);
    const sw = Math.sin(w);
    const cn = Math.cos(n);
    const sn = Math.sin(n);
    const ci = Math.cos(i);
    const si = Math.sin(i);

    for (let j = 0; j <= 512; j += 1) {
        const E = (j / 512) * Math.PI * 2;
        const xOrb = a * (Math.cos(E) - e);
        const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);

        const x =
            (cw * cn - sw * sn * ci) * xOrb +
            (-sw * cn - cw * sn * ci) * yOrb;

        const y =
            (cw * sn + sw * cn * ci) * xOrb +
            (-sw * sn + cw * cn * ci) * yOrb;

        const z = sw * si * xOrb + cw * si * yOrb;

        points.push(new THREE.Vector3(x, z, -y));
    }

    return points;
}

function getEarthRotationAngle(dateMs) {
    const jd = dateMs / DAY_MS + 2440587.5;
    const t = (jd - 2451545.0) / 36525;

    const gmst =
        280.46061837 +
        360.98564736629 * (jd - 2451545.0) +
        0.000387933 * t * t -
        (t * t * t) / 38710000;

    return normalizeAngle(gmst * DEG);
}

function createTextSprite(text, color) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 64);

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

function createSaturnRingTexture() {
    const size = 512;
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
            const idx = (y * size + x) * 4;

            const wave =
                Math.sin(radius * 190) * 0.12 +
                Math.sin(radius * 370) * 0.06;

            const brightness = THREE.MathUtils.clamp(
                0.72 + wave,
                0.2,
                1
            );

            image.data[idx] = 204 * brightness;
            image.data[idx + 1] = 183 * brightness;
            image.data[idx + 2] = 143 * brightness;
            image.data[idx + 3] = radius > 0.99 ? 0 : 255;
        }
    }

    ctx.putImageData(image, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function localDateTimeValue(date) {
    const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    );

    return local.toISOString().slice(0, 16);
}

/**
 * Dodaje mapę nocnych świateł oraz mapę specular do shaderu Ziemi.
 * Światła miast są widoczne przede wszystkim po nocnej stronie globu.
 */
function addEarthShaderMaps(material, nightTexture, specularTexture) {
    material.customProgramCacheKey = () => "earth-night-specular-v1";

    material.onBeforeCompile = (shader) => {
        shader.uniforms.earthNightMap = { value: nightTexture };
        shader.uniforms.earthSpecularMap = { value: specularTexture };

        shader.vertexShader = shader.vertexShader.replace(
            "#include <common>",
            `#include <common>
             varying vec3 vEarthWorldPosition;
             varying vec3 vEarthWorldNormal;`
        );

        shader.vertexShader = shader.vertexShader.replace(
            "#include <worldpos_vertex>",
            `#include <worldpos_vertex>
             vec4 earthWorldPosition = modelMatrix * vec4(transformed, 1.0);
             vEarthWorldPosition = earthWorldPosition.xyz;
             vEarthWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `#include <common>
             uniform sampler2D earthNightMap;
             uniform sampler2D earthSpecularMap;
             varying vec3 vEarthWorldPosition;
             varying vec3 vEarthWorldNormal;`
        );

        // Mapa specular steruje połyskiem. Wysoka wartość mapy
        // zmniejsza roughness, a niska pozostawia powierzchnię matową.
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <roughnessmap_fragment>",
            `#include <roughnessmap_fragment>
             #ifdef USE_MAP
               float earthSpecularValue = texture2D(earthSpecularMap, vMapUv).r;
               roughnessFactor = clamp(
                 roughnessFactor - earthSpecularValue * 0.55,
                 0.12,
                 1.0
               );
             #endif`
        );

        // Wektor skierowany z punktu powierzchni ku Słońcu,
        // które w tej scenie znajduje się w początku układu.
        shader.fragmentShader = shader.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
             vec3 earthNormalWorld = normalize(vEarthWorldNormal);
             vec3 earthToSun = normalize(-vEarthWorldPosition);
             float earthDayFactor = dot(earthNormalWorld, earthToSun);
             float earthNightFactor =
               1.0 - smoothstep(-0.12, 0.18, earthDayFactor);
             vec3 earthNightColor = texture2D(earthNightMap, vMapUv).rgb;
             totalEmissiveRadiance += earthNightColor * earthNightFactor * 1.8;`
        );
    };

    material.needsUpdate = true;
}

export default function SolarSystemCanvas() {
    const mountRef = useRef(null);
    const apiRef = useRef(null);
    const dateRef = useRef(Date.now());
    const lastDateUiUpdateRef = useRef(0);
    const lastProgrammaticDateRef = useRef("");

    const [mode, setMode] = useState("astro");
    const [showOrbits, setShowOrbits] = useState(true);
    const [showLabels, setShowLabels] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const [selectedPlanet, setSelectedPlanet] = useState("earth");
    const [speed, setSpeed] = useState(10);
    const [sunIntensity, setSunIntensity] = useState(850);
    const [ambientIntensity, setAmbientIntensity] = useState(0.14);
    const [sunGlowIntensity, setSunGlowIntensity] = useState(0.06);
    const [dateValue, setDateValue] = useState(() =>
        localDateTimeValue(new Date())
    );

    const modeRef = useRef(mode);
    const showOrbitsRef = useRef(showOrbits);
    const showLabelsRef = useRef(showLabels);
    const playingRef = useRef(isPlaying);
    const selectedRef = useRef(selectedPlanet);
    const speedRef = useRef(speed);

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
        if (dateValue === lastProgrammaticDateRef.current) {
            lastProgrammaticDateRef.current = "";
            return;
        }

        const parsed = new Date(dateValue).getTime();

        if (Number.isFinite(parsed)) {
            dateRef.current = parsed;
            apiRef.current?.updateAll();
        }
    }, [dateValue]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return undefined;

        let destroyed = false;
        let animationFrame = 0;
        let previousTime = performance.now();

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
        controls.minDistance = 2;
        controls.maxDistance = 2500;
        controls.target.set(0, 0, 0);

        const ambient = new THREE.AmbientLight(0x667086, ambientIntensity);
        scene.add(ambient);

        const sunLight = new THREE.PointLight(0xfff0dc, sunIntensity, 0, 2);
        scene.add(sunLight);

        const loader = new THREE.TextureLoader();
        const anisotropy = Math.min(
            renderer.capabilities.getMaxAnisotropy(),
            8
        );

        const planetGroups = {};
        const planetMeshes = {};
        const planetMaterials = {};
        const orbitLines = {};
        const labels = {};
        const pickables = [];
        const loadedTextures = new Set();

        let moonMesh = null;
        let moonLabel = null;
        let followedId = null;
        let cameraTransition = 0;

        const moonWorldPosition = new THREE.Vector3();
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const cameraOffset = new THREE.Vector3();
        const desiredCameraPosition = new THREE.Vector3();
        const desiredTarget = new THREE.Vector3();
        const currentTarget = new THREE.Vector3();
        const movementDelta = new THREE.Vector3();

        function loadTexture(path, optional = false, colorTexture = true) {
            const texture = loader.load(
                path,
                undefined,
                undefined,
                () => {
                    if (!optional) {
                        console.warn(`Failed to load texture: ${path}`);
                    }
                }
            );

            if (colorTexture) {
                texture.colorSpace = THREE.SRGBColorSpace;
            }

            texture.anisotropy = anisotropy;
            loadedTextures.add(texture);
            return texture;
        }

        // Tło gwiazdowe.
        {
            const count = 5000;
            const positions = new Float32Array(count * 3);

            for (let i = 0; i < count; i += 1) {
                const r = 800 + Math.random() * 1800;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                positions[i * 3 + 1] = r * Math.cos(phi);
                positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(positions, 3)
            );

            scene.add(
                new THREE.Points(
                    geometry,
                    new THREE.PointsMaterial({
                        color: 0xffffff,
                        size: 1.4,
                        sizeAttenuation: true,
                        transparent: true,
                        opacity: 0.9,
                        depthWrite: false,
                    })
                )
            );
        }

        // Słońce.
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(SUN_RADIUS, 96, 64),
            new THREE.MeshBasicMaterial({
                map: loadTexture("/textures/stars/sun/8k_sun.jpg"),
                toneMapped: false,
            })
        );

        sun.userData.isSun = true;
        sun.name = "sun";
        scene.add(sun);
        pickables.push(sun);

        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(SUN_RADIUS * 1.18, 64, 48),
            new THREE.MeshBasicMaterial({
                color: 0xffa13a,
                transparent: true,
                opacity: sunGlowIntensity,
                side: THREE.BackSide,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );

        scene.add(sunGlow);

        const sunLabel = createTextSprite("Sun", "#ffbd72");
        sunLabel.position.y = SUN_RADIUS + 1.4;
        scene.add(sunLabel);

        function updateOrbit(planet) {
            const line = orbitLines[planet.id];
            if (!line) return;

            const oldGeometry = line.geometry;
            line.geometry = new THREE.BufferGeometry().setFromPoints(
                getOrbitPoints(planet, modeRef.current, dateRef.current)
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
            group.name = `${planet.id}-position`;
            scene.add(group);

            const axialGroup = new THREE.Group();
            axialGroup.rotation.z = planet.tilt * DEG;
            group.add(axialGroup);

            const materialOptions = {
                map: loadTexture(planet.texture),
                roughness: 0.9,
                metalness: 0,
                color: 0xffffff,
            };

            let nightTexture = null;
            let specularTexture = null;

            if (planet.id === "earth") {
                // Mapy normalnych i specular nie są mapami koloru,
                // dlatego nie konwertujemy ich do przestrzeni sRGB.
                materialOptions.normalMap = loadTexture(
                    planet.normalTexture,
                    false,
                    false
                );
                materialOptions.normalScale = new THREE.Vector2(0.65, 0.65);

                nightTexture = loadTexture(
                    planet.nightTexture,
                    false,
                    true
                );

                specularTexture = loadTexture(
                    planet.specularTexture,
                    false,
                    false
                );

                materialOptions.roughness = 0.92;
                materialOptions.metalness = 0;
            }

            const material = new THREE.MeshStandardMaterial(materialOptions);

            if (planet.id === "earth") {
                addEarthShaderMaps(material, nightTexture, specularTexture);
            }

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(planet.radius, 96, 64),
                material
            );

            mesh.name = `${planet.id}-surface`;
            mesh.userData.planetId = planet.id;
            axialGroup.add(mesh);

            planetGroups[planet.id] = group;
            planetMeshes[planet.id] = mesh;
            planetMaterials[planet.id] = material;
            pickables.push(mesh);

            const label = createTextSprite(planet.name, planet.color);
            labels[planet.id] = label;
            scene.add(label);

            if (planet.id === "saturn") {
                const ringTexture = createSaturnRingTexture();
                loadedTextures.add(ringTexture);

                const ring = new THREE.Mesh(
                    new THREE.RingGeometry(
                        planet.radius * 1.25,
                        planet.radius * 2.45,
                        256
                    ),
                    new THREE.MeshStandardMaterial({
                        map: ringTexture,
                        alphaMap: ringTexture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.96,
                        roughness: 1,
                        depthWrite: false,
                    })
                );

                ring.rotation.x = -Math.PI / 2;
                axialGroup.add(ring);
            }

            
            if (planet.id === "earth") {
                const cloudsTexture = loadTexture(
                    planet.cloudsTexture,
                    false,
                    true
                );

                const cloudsMaterial = new THREE.MeshStandardMaterial({
                    map: cloudsTexture,
                    transparent: true,
                    opacity: 0.32,
                    depthWrite: false,
                    roughness: 1,
                    metalness: 0,
                    side: THREE.FrontSide,
                    color: 0xffffff,
                });

                const clouds = new THREE.Mesh(
                    new THREE.SphereGeometry(
                        planet.radius * 1.012,
                        96,
                        64
                    ),
                    cloudsMaterial
                );

                clouds.name = "earth-clouds";
                mesh.add(clouds);

                // Nachylenie orbity Księżyca względem płaszczyzny ekliptyki
                const moonOrbitInclination = 5.145 * DEG;

                const moonOrbitPlane = new THREE.Group();
                moonOrbitPlane.rotation.x = moonOrbitInclination;
                group.add(moonOrbitPlane);

                // Grupa obracająca Księżyc wokół Ziemi
                const moonGroup = new THREE.Group();
                moonGroup.name = "moon-orbit-angle";
                moonOrbitPlane.add(moonGroup);

                moonMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.18, 48, 32),
                    new THREE.MeshStandardMaterial({
                        map: loadTexture("/textures/moons/luna/8k_moon.jpg"),
                        roughness: 1,
                    })
                );

                moonMesh.name = "moon";
                moonMesh.userData.planetId = "moon";
                moonMesh.position.x = 2.2;
                moonGroup.add(moonMesh);

                // Linia orbity w tej samej nachylonej płaszczyźnie
                const moonOrbitPoints = [];
                const moonOrbitSegments = 128;
                const moonOrbitRadius = 2.2;

                for (let i = 0; i <= moonOrbitSegments; i += 1) {
                    const angle =
                        (i / moonOrbitSegments) * Math.PI * 2;

                    moonOrbitPoints.push(
                        new THREE.Vector3(
                            Math.cos(angle) * moonOrbitRadius,
                            0,
                            Math.sin(angle) * moonOrbitRadius
                        )
                    );
                }

                const moonOrbitLine = new THREE.LineLoop(
                    new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
                    new THREE.LineBasicMaterial({
                        color: 0x8a9ab8,
                        transparent: true,
                        opacity: 0.32,
                        depthWrite: false,
                    })
                );

                moonOrbitPlane.add(moonOrbitLine);

                group.userData.moonGroup = moonGroup;
                group.userData.moonOrbitLine = moonOrbitLine;
                group.userData.moonOrbitPlane = moonOrbitPlane;

                pickables.push(moonMesh);

                moonLabel = createTextSprite("Moon", "#c7d2e4");
                scene.add(moonLabel);
            }


            createOrbit(planet);
        }

        PLANETS.forEach(createPlanet);

        function updateOrbitVisibility() {
            Object.values(orbitLines).forEach((line) => {
                line.visible = showOrbitsRef.current;
            });

            Object.values(labels).forEach((label) => {
                label.visible = showLabelsRef.current;
            });

            sunLabel.visible = showLabelsRef.current;

            if (moonLabel) {
                moonLabel.visible = showLabelsRef.current;
            }

            const moonLine = planetGroups.earth?.userData.moonOrbitLine;
            if (moonLine) moonLine.visible = showOrbitsRef.current;
        }

        function getMoonWorldPosition(target = moonWorldPosition) {
            if (!moonMesh) return target.set(0, 0, 0);

            scene.updateMatrixWorld(true);
            moonMesh.getWorldPosition(target);
            return target;
        }

        function updatePositions(dateMs) {
            const elapsedDays = (dateMs - J2000) / DAY_MS;

            PLANETS.forEach((planet) => {
                const group = planetGroups[planet.id];
                const mesh = planetMeshes[planet.id];

                if (!group || !mesh) return;

                group.position.copy(
                    getPlanetPosition(planet, dateMs, modeRef.current)
                );

                if (planet.id === "earth") {
                    mesh.rotation.y = getEarthRotationAngle(dateMs);
                } else {
                    const direction = planet.rotation < 0 ? -1 : 1;
                    mesh.rotation.y =
                        direction *
                        (elapsedDays / Math.abs(planet.rotation)) *
                        Math.PI *
                        2;
                }

                const clouds = mesh.getObjectByName("earth-clouds");
                if (clouds) {
                    clouds.rotation.y = mesh.rotation.y * 1.015;
                }

                const moonGroup = group.userData.moonGroup;
                if (moonGroup) {
                    moonGroup.rotation.y =
                        elapsedDays * (Math.PI * 2 / 27.321661);
                }

                const label = labels[planet.id];
                label.position.copy(group.position);
                label.position.y += planet.radius + 1.1;

                // Nie każdy materiał ma emissive ustawione jawnie.
                if (planetMaterials[planet.id].emissive) {
                    planetMaterials[planet.id].emissive.set(
                        selectedRef.current === planet.id
                            ? 0x080808
                            : 0x000000
                    );
                }
            });

            if (moonLabel && moonMesh) {
                getMoonWorldPosition(moonLabel.position);
                moonLabel.position.y += 0.45;
            }

            updateOrbitVisibility();
        }

        function updateAll() {
            PLANETS.forEach(updateOrbit);
            updatePositions(dateRef.current);
        }

        function setLighting(sunPower, ambientPower, glowPower) {
            sunLight.intensity = sunPower;
            ambient.intensity = ambientPower;
            sunGlow.material.opacity = glowPower;
        }

        function getFollowPosition() {
            if (followedId === "sun") return sun.position;

            if (followedId === "moon" && moonMesh) {
                return getMoonWorldPosition();
            }

            if (followedId && planetGroups[followedId]) {
                return planetGroups[followedId].position;
            }

            return null;
        }

        function beginFocus(position, distance, animate = true) {
            cameraOffset.copy(camera.position).sub(controls.target);

            if (cameraOffset.lengthSq() < 0.001) {
                cameraOffset.set(0.6, 0.65, 1);
            }

            cameraOffset.normalize().multiplyScalar(distance);
            desiredTarget.copy(position);
            desiredCameraPosition.copy(position).add(cameraOffset);
            currentTarget.copy(position);

            if (animate) {
                cameraTransition = 1;
            } else {
                camera.position.copy(desiredCameraPosition);
                controls.target.copy(desiredTarget);
                cameraTransition = 0;
            }

            controls.update();
        }

        function focusPlanet(id, animate = true) {
            const planet = PLANETS.find((item) => item.id === id);
            const group = planetGroups[id];

            if (!planet || !group) return;

            followedId = id;

            const currentDistance = camera.position.distanceTo(controls.target);

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
            followedId = "sun";
            beginFocus(sun.position, 18, animate);
        }

        function focusMoon(animate = true) {
            if (!moonMesh) return;

            followedId = "moon";
            beginFocus(getMoonWorldPosition(), 5, animate);
        }

        controls.addEventListener("start", () => {
            cameraTransition = 0;
            currentTarget.copy(getFollowPosition() || controls.target);
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

            pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            const hits = raycaster.intersectObjects(pickables, false);
            if (!hits.length) return;

            const object = hits[0].object;

            if (object.userData.isSun) {
                setSelectedPlanet("sun");
                focusSun(true);
                return;
            }

            const id = object.userData.planetId;
            if (!id) return;

            setSelectedPlanet(id);

            if (id === "moon") {
                focusMoon(true);
            } else {
                focusPlanet(id, true);
            }
        }

        renderer.domElement.addEventListener("pointerdown", onPointerDown);

        function animate(now) {
            if (destroyed) return;

            animationFrame = requestAnimationFrame(animate);

            const deltaSeconds = Math.min((now - previousTime) / 1000, 0.1);
            previousTime = now;

            if (playingRef.current) {
                dateRef.current +=
                    deltaSeconds * speedRef.current * DAY_MS;

                updatePositions(dateRef.current);

                if (now - lastDateUiUpdateRef.current >= 250) {
                    lastDateUiUpdateRef.current = now;

                    const nextValue = localDateTimeValue(
                        new Date(dateRef.current)
                    );

                    lastProgrammaticDateRef.current = nextValue;
                    setDateValue(nextValue);
                }
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

                    materials.forEach((material) => material.dispose());
                }
            });

            loadedTextures.forEach((texture) => texture.dispose());

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
        lastProgrammaticDateRef.current = "";
        setDateValue(value);

        const timestamp = new Date(value).getTime();

        if (Number.isFinite(timestamp)) {
            dateRef.current = timestamp;
            apiRef.current?.updateAll();
        }
    }, []);

    function setCurrentDate() {
        handleDateChange(localDateTimeValue(new Date()));
    }

    function focusSelectedObject() {
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
                            onClick={() => setShowOrbits((v) => !v)}
                        >
                            {showOrbits ? "Hide Orbits" : "Show Orbits"}
                        </button>

                        <button
                            className="solar-button"
                            onClick={() => setShowLabels((v) => !v)}
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
                        Click an object to view details and follow it · Drag to
                        rotate · Scroll to zoom
                    </div>
                </main>

                <aside className="solar-sidebar">
                    <section className="solar-panel">
                        <h2 className="solar-panel__title">SIMULATION SETTINGS</h2>

                        <label className="solar-label" htmlFor="solar-date">
                            Date and Time
                        </label>

                        <input
                            id="solar-date"
                            className="solar-date"
                            type="datetime-local"
                            value={dateValue}
                            onChange={(event) => handleDateChange(event.target.value)}
                        />

                        <div className="solar-button-row">
                            <button
                                className="solar-button solar-button--primary"
                                onClick={() => setIsPlaying((v) => !v)}
                            >
                                {isPlaying ? "❚❚ Pause" : "▶ Play"}
                            </button>

                            <button className="solar-button" onClick={setCurrentDate}>
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
                            onChange={(event) => setSpeed(Number(event.target.value))}
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

                            <label className="solar-label" htmlFor="ambient-intensity">
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
                                        apiRef.current?.focusPlanet(planet.id, true);
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
                                            style={{ backgroundColor: object.color }}
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
                                        style={{ backgroundColor: selectedData.color }}
                                    />
                                    {selectedData.name}
                                </div>

                                <p className="solar-description">
                                    {selectedData.description}
                                </p>

                                {"period" in selectedData ? (
                                    <>
                                        <div className="solar-data-row">
                                            <span>Orbital Period</span>
                                            <strong>
                                                {selectedData.period.toLocaleString("en-US")} days
                                            </strong>
                                        </div>

                                        <div className="solar-data-row">
                                            <span>Axial Tilt</span>
                                            <strong>{selectedData.tilt}°</strong>
                                        </div>

                                        {mode === "astro" && (
                                            <>
                                                <div className="solar-data-row">
                                                    <span>Semi-major Axis</span>
                                                    <strong>
                                                        {ORBITAL_ELEMENTS[selectedData.id].a} AU
                                                    </strong>
                                                </div>

                                                <div className="solar-data-row">
                                                    <span>Eccentricity</span>
                                                    <strong>
                                                        {ORBITAL_ELEMENTS[selectedData.id].e}
                                                    </strong>
                                                </div>

                                                <div className="solar-data-row">
                                                    <span>Inclination</span>
                                                    <strong>
                                                        {ORBITAL_ELEMENTS[selectedData.id].i}°
                                                    </strong>
                                                </div>
                                            </>
                                        )}
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
                            Astronomical positions use approximate JPL
                            Keplerian elements valid for 1800–2050. Planet
                            sizes are enlarged for visibility. The Moon's
                            orbit and planetary rotations are simplified.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
}