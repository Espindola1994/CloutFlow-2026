"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { LiveWorldLocationItem, LiveWorldRecentPurchase } from "@/types/admin-live-world";
import type { LiveWorldHistoryTopCity } from "@/types/admin-live-world-history";
import {
  type LiveWorldGlobeMode,
  type MappableCity,
  extractValidMappableCities,
  calculateLogIntensity,
  calculateMarkerSize,
  calculatePointAltitude,
  getHistoricalPointColor,
} from "./live-world-geo-utils";

export interface LiveWorldGlobeProps {
  // Mode selection: "live" (Live Activity), "revenue" (Revenue Map), "purchase" (Purchase Map)
  mode?: LiveWorldGlobeMode;
  // Live Activity datasets
  locations?: LiveWorldLocationItem[];
  recentPurchases?: LiveWorldRecentPurchase[];
  newPurchaseOrderIds?: Set<string>;
  onHoverLocation?: (location: LiveWorldLocationItem | null) => void;
  onHoverPurchase?: (purchase: LiveWorldRecentPurchase | null) => void;

  // Phase 4C Historical datasets
  historicalCities?: LiveWorldHistoryTopCity[];
  selectedCity?: MappableCity | null;
  onHoverHistoricalCity?: (city: MappableCity | null) => void;
  onSelectHistoricalCity?: (city: MappableCity | null) => void;
}

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  altitude: number;
  location?: LiveWorldLocationItem;
  purchase?: LiveWorldRecentPurchase;
  historicalCity?: MappableCity;
  type: "visitor" | "purchase" | "historical";
  glow?: boolean;
}

interface GlobeRing {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: string;
}

interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  altitude: number;
  stroke: number;
}

interface GlobeLabel {
  lat: number;
  lng: number;
  altitude: number;
  text: string;
  color: string;
  size: number;
  dotRadius: number;
}

interface GlobePath {
  coords: Array<[number, number, number]>;
  color: string;
  stroke: number;
}

// -------------------------------------------------------------
// Shaders & Setup Helpers for Phase 2A Cinematic Earth Visuals
// -------------------------------------------------------------

// Local Texture Paths
const LOCAL_GLOBE_IMG = "/admin/live-world/earth-night-v5.jpg";
const LOCAL_CITY_LIGHTS_IMG = "/admin/live-world/earth-city-lights-v5.jpg";
const LOCAL_BUMP_IMG = "/admin/live-world/earth-topology.png";

// Fresnel shaders for the dedicated two-layer atmosphere.
// The glow is derived from the actual surface normal/view direction, so it
// remains stable while the user rotates or zooms the globe.
const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormalView = normalize(normalMatrix * normal);
    vViewDirection = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormalView;
  varying vec3 vViewDirection;

  uniform vec3 color;
  uniform float intensity;
  uniform float power;

  void main() {
    float facing = abs(dot(normalize(vNormalView), normalize(vViewDirection)));
    float fresnel = pow(clamp(1.0 - facing, 0.0, 1.0), power);
    float alpha = clamp(fresnel * intensity, 0.0, 1.0);

    if (alpha < 0.01) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * Preserve the authored texture colors instead of asking a very dark diffuse
 * texture to carry the whole visual through lighting alone. The same loaded
 * map is reused as a restrained emissive contribution, which keeps oceans,
 * continents and warm city lights readable while directional lights still
 * provide curvature/depth. No extra texture request or duplicate globe is
 * created.
 */
function applyEarthMaterial(globe: any) {
  if (!globe || typeof globe.globeMaterial !== "function") return;

  try {
    const mat = globe.globeMaterial();
    if (!mat || !(mat as any).isMeshPhongMaterial) return;
    const phongMat = mat as THREE.MeshPhongMaterial;

    // Global Pulse: deep photographic night surface + a SEPARATE warm city-light
    // emissive mask. The planet no longer emits its oceans/continents.
    phongMat.color.set("#b9cce0");
    phongMat.specular.set("#173f67");
    phongMat.shininess = 7;
    phongMat.bumpScale = 0.055;
    phongMat.emissive.set("#ffd07a");
    phongMat.emissiveIntensity = 1.75;

    if (!(phongMat.userData as any).globalPulseCityMapLoading && !phongMat.emissiveMap) {
      (phongMat.userData as any).globalPulseCityMapLoading = true;
      const loader = new THREE.TextureLoader();
      loader.load(
        LOCAL_CITY_LIGHTS_IMG,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          phongMat.emissiveMap = texture;
          (phongMat.userData as any).globalPulseCityMap = texture;
          phongMat.needsUpdate = true;
        },
        undefined,
        () => {
          (phongMat.userData as any).globalPulseCityMapLoading = false;
          phongMat.emissiveIntensity = 0.18;
          phongMat.emissive.set("#12304d");
          phongMat.needsUpdate = true;
        },
      );
    }
    phongMat.needsUpdate = true;
  } catch (err) {
    console.warn("Failed to configure Global Pulse Earth material:", err);
  }
}

/**
 * Add only the lighting needed for spherical depth. Because the surface map
 * now contributes a restrained emissive term, these lights no longer have to
 * overpower the texture just to make geography readable.
 */
function setupSceneLighting(scene: THREE.Scene): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];
  const hemisphereLight = new THREE.HemisphereLight(0x4b9fd8, 0x01030a, 0.24);
  scene.add(hemisphereLight); createdObjects.push(hemisphereLight);
  const keyLight = new THREE.DirectionalLight(0xd7ecff, 0.72);
  keyLight.position.set(-120, 150, 185);
  scene.add(keyLight); createdObjects.push(keyLight);
  const rimLight = new THREE.DirectionalLight(0x1b8dff, 0.28);
  rimLight.position.set(160, 40, -120);
  scene.add(rimLight); createdObjects.push(rimLight);
  return createdObjects;
}

/**
 * Create two camera-independent Fresnel shells. There is deliberately no
 * PlaneGeometry backdrop here: the Phase 1 stage already owns the cinematic
 * background, and removing the plane avoids billboard/rotation artifacts.
 */
function setupAtmosphere(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const makeAtmosphereShell = (params: {
    radiusScale: number;
    color: string;
    intensity: number;
    power: number;
    renderOrder: number;
  }) => {
    const geometry = new THREE.SphereGeometry(globeRadius * params.radiusScale, 96, 96);
    const material = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      uniforms: {
        color: { value: new THREE.Color(params.color) },
        intensity: { value: params.intensity },
        power: { value: params.power },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = params.renderOrder;
    scene.add(mesh);
    createdObjects.push(mesh);
  };

  // Reference-style atmosphere: no hard neon outline. The inner shell is tight
  // and soft, while the outer shell provides only a faint cyan-blue bloom.
  makeAtmosphereShell({
    radiusScale: 1.012,
    color: "#7de8ff",
    intensity: 0.22,
    power: 7.2,
    renderOrder: 2,
  });

  makeAtmosphereShell({
    radiusScale: 1.055,
    color: "#126fcb",
    intensity: 0.050,
    power: 9.0,
    renderOrder: 1,
  });

  return createdObjects;
}

/**
 * Decorative orbital guides inspired by the approved Live World reference.
 * They contain no invented customer/location data: they are purely visual
 * infrastructure around the real data-driven globe.
 */
function setupGlobalPulsePlatform(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const y = -globeRadius * 1.07;
  const makeRing = (radius: number, opacity: number, color = "#21b7ff") => {
    const geometry = new THREE.RingGeometry(radius - 0.38, radius + 0.38, 192);
    const material = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = y;
    scene.add(ring); created.push(ring);
  };
  makeRing(globeRadius * 0.78, 0.20, "#55ddff");
  makeRing(globeRadius * 1.02, 0.13, "#159dff");
  makeRing(globeRadius * 1.24, 0.065, "#0c6fff");
  makeRing(globeRadius * 1.40, 0.032, "#36d9ff");

  // Dotted outer telemetry ring — decorative infrastructure, never customer data.
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < 180; i += 1) {
    const a = (i / 180) * Math.PI * 2;
    const r = globeRadius * (1.34 + (i % 7) * 0.002);
    pts.push(new THREE.Vector3(Math.cos(a) * r, y + 0.5, Math.sin(a) * r));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.PointsMaterial({ color: 0x41cfff, size: 0.62, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const dots = new THREE.Points(geo, mat); scene.add(dots); created.push(dots);

  const glow = new THREE.PointLight(0x168cff, 0.48, globeRadius * 3.2, 2);
  glow.position.set(0, y + 8, 24); scene.add(glow); created.push(glow);
  return created;
}

function setupStarField(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const positions: number[] = [];
  // deterministic distribution so SSR/tests/screenshots don't jitter between mounts
  let seed = 9173;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 640; i += 1) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    const r = globeRadius * (2.25 + rand() * 1.65);
    positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x8edcff, size: 0.56, transparent: true, opacity: 0.26, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const stars = new THREE.Points(geometry, material); scene.add(stars);
  return [stars];
}


function setupCinematicBackdrop(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];

  const makeGlowTexture = (inner: string, middle: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 250);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.38, middle);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  };

  const haloTexture = makeGlowTexture("rgba(20,145,255,.34)", "rgba(7,70,145,.13)");
  if (haloTexture) {
    const material = new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      opacity: 0.50,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, 0, -126);
    sprite.scale.set(globeRadius * 2.78, globeRadius * 2.78, 1);
    sprite.renderOrder = -20;
    scene.add(sprite);
    created.push(sprite);
  }

  const floorTexture = makeGlowTexture("rgba(0,205,255,.28)", "rgba(0,93,180,.09)");
  if (floorTexture) {
    const material = new THREE.SpriteMaterial({
      map: floorTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      opacity: 0.42,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(0, -globeRadius * 1.02, -96);
    sprite.scale.set(globeRadius * 3.15, globeRadius * 1.02, 1);
    sprite.renderOrder = -19;
    scene.add(sprite);
    created.push(sprite);
  }

  return created;
}

function setupDecorativeNetwork(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const created: THREE.Object3D[] = [];
  const specs = [
    { rx: 1.30, rz: 0.48, y: -0.54, rotZ: 0.08, opacity: 0.11 },
    { rx: 1.18, rz: 0.62, y: -0.30, rotZ: -0.16, opacity: 0.075 },
    { rx: 1.08, rz: 0.86, y: 0.06, rotZ: 0.27, opacity: 0.055 },
  ];

  specs.forEach((spec, idx) => {
    const pts: THREE.Vector3[] = [];
    const segments = 240;
    for (let i = 0; i <= segments; i += 1) {
      const t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(t) * globeRadius * spec.rx,
        globeRadius * spec.y,
        Math.sin(t) * globeRadius * spec.rz,
      ));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(pts);
    const material = new THREE.LineDashedMaterial({
      color: idx === 0 ? 0x35cfff : 0x197ad6,
      transparent: true,
      opacity: spec.opacity,
      dashSize: 2.2,
      gapSize: 3.8,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    line.rotation.z = spec.rotZ;
    line.renderOrder = -2;
    scene.add(line);
    created.push(line);
  });

  return created;
}
function buildLiveArcs(_locations: LiveWorldLocationItem[]): GlobeArc[] {
  // Intentionally empty. Global Pulse never invents geographic routes.
  // Decorative network infrastructure is rendered as non-data scene geometry,
  // while real visitors/purchases remain points, rings and labels.
  return [];
}

function buildLiveLabels(locations: LiveWorldLocationItem[]): GlobeLabel[] {
  return locations
    .filter((loc) => typeof loc.latitude === "number" && typeof loc.longitude === "number")
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, 6)
    .map((loc) => {
      const city = (loc as any).city || (loc as any).region || (loc as any).country || "Active cluster";
      return {
        lat: loc.latitude as number,
        lng: loc.longitude as number,
        altitude: 0.10,
        text: `${city}  ${loc.activeCount} online`,
        color: "#dffcff",
        size: 0.82,
        dotRadius: 0.18,
      };
    });
}

export default function LiveWorldGlobe({
  mode = "live",
  locations = [],
  recentPurchases = [],
  newPurchaseOrderIds = new Set(),
  onHoverLocation,
  onHoverPurchase,
  historicalCities = [],
  selectedCity = null,
  onHoverHistoricalCity,
  onSelectHistoricalCity,
}: LiveWorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const customSceneObjectsRef = useRef<THREE.Object3D[]>([]);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isGlobeReady, setIsGlobeReady] = useState<boolean>(false);
  const [isInteractionMode, setIsInteractionMode] = useState<boolean>(false);
  const lockedScrollYRef = useRef<number>(0);

  // References to keep callbacks current without re-binding globe event listeners
  const callbacksRef = useRef({
    onHoverLocation,
    onHoverPurchase,
    onHoverHistoricalCity,
    onSelectHistoricalCity,
  });

  useEffect(() => {
    callbacksRef.current = {
      onHoverLocation,
      onHoverPurchase,
      onHoverHistoricalCity,
      onSelectHistoricalCity,
    };
  });

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Initialize Globe once
  useEffect(() => {
    if (!webglSupported || !containerRef.current || globeInstanceRef.current) return;

    let destroyed = false;
    let globe: any = null;

    const initGlobe = async () => {
      try {
        const GlobeModule = await import("globe.gl");
        const GlobeConstructor = (GlobeModule.default || GlobeModule) as any;

        if (destroyed || !containerRef.current) return;

        const width = containerRef.current.clientWidth || 600;
        const height = containerRef.current.clientHeight || 500;

        // Dedicated two-layer atmosphere is rendered via custom Three.js objects (Layer 1 thin cyan rim + Layer 2 soft outer halo)
        globe = new GlobeConstructor(containerRef.current)
          .width(width)
          .height(height)
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(false)
          .globeImageUrl(LOCAL_GLOBE_IMG)
          .bumpImageUrl(LOCAL_BUMP_IMG)
          .pointAltitude("altitude")
          .pointRadius("size")
          .pointColor("color")
          .pointResolution(24)
          .pointsMerge(false)
          .pointLabel(() => "") // Custom UI overlays handle tooltips
          .ringsData([])
          .ringColor("color")
          .ringMaxRadius("maxR")
          .ringPropagationSpeed("propagationSpeed")
          .ringRepeatPeriod("repeatPeriod")
          .onPointHover((point: GlobePoint | null) => {
            if (!point) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
            } else if (point.type === "visitor" && point.location) {
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
              callbacksRef.current.onHoverLocation?.(point.location);
            } else if (point.type === "purchase" && point.purchase) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
              callbacksRef.current.onHoverPurchase?.(point.purchase);
            } else if (point.type === "historical" && point.historicalCity) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(point.historicalCity);
            }
          });

        // Optional globe.gl layers are feature-detected instead of being part of
        // the mandatory constructor chain. This keeps the renderer compatible
        // with the existing test double and older/minimal globe.gl builds while
        // enabling the richer production layers whenever the API is available.
        if (typeof globe.arcsData === "function") {
          globe
            .arcsData([])
            .arcStartLat("startLat")
            .arcStartLng("startLng")
            .arcEndLat("endLat")
            .arcEndLng("endLng")
            .arcColor("color")
            .arcAltitude("altitude")
            .arcStroke("stroke")
            .arcDashLength(0.42)
            .arcDashGap(0.16)
            .arcDashAnimateTime(2600);
        }

        if (typeof globe.labelsData === "function") {
          globe
            .labelsData([])
            .labelLat("lat")
            .labelLng("lng")
            .labelAltitude("altitude")
            .labelText("text")
            .labelColor("color")
            .labelSize("size")
            .labelDotRadius("dotRadius")
            .labelResolution(2);
        }

        if (typeof globe.onPointClick === "function") {
          globe.onPointClick((point: GlobePoint | null) => {
            if (point && point.type === "historical" && point.historicalCity) {
              callbacksRef.current.onSelectHistoricalCity?.(point.historicalCity);
            }
          });
        }

        // Apply rich Earth material properties immediately and upon texture readiness
        applyEarthMaterial(globe);
        if (typeof globe.onGlobeReady === "function") {
          globe.onGlobeReady(() => {
            applyEarthMaterial(globe);
          });
        }

        // Access Three.js Scene and inject custom lighting, outer halo, and backdrop depth
        if (typeof globe.scene === "function") {
          const scene: THREE.Scene | null = globe.scene();
          if (scene && scene.isScene) {
            const lights = setupSceneLighting(scene);
            const backdrop = setupCinematicBackdrop(scene, 100);
            const atmosphere = setupAtmosphere(scene, 100);
            const network = setupDecorativeNetwork(scene, 100);
            const platform = setupGlobalPulsePlatform(scene, 100);
            const stars = setupStarField(scene, 100);
            customSceneObjectsRef.current = [...lights, ...backdrop, ...atmosphere, ...network, ...platform, ...stars];
          }
        }

        // Cinematic renderer baseline. Keep the stage deep navy instead of a
        // pure-black inner canvas, and use filmic tone mapping for city lights.
        if (typeof globe.renderer === "function") {
          try {
            const renderer = globe.renderer();
            renderer.setClearColor?.(0x020916, 1);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.02;
          } catch (err) {
            console.warn("Global Pulse renderer tuning unavailable:", err);
          }
        }

        // Selective global bloom for the Global Pulse scene. Feature-detected so
        // the existing globe test double and reduced WebGL environments remain safe.
        if (typeof globe.postProcessingComposer === "function") {
          try {
            const composer = globe.postProcessingComposer();
            const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
            if (composer && typeof composer.addPass === "function") {
              const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.54, 0.42, 0.82);
              bloom.threshold = 0.82;
              bloom.strength = 0.54;
              bloom.radius = 0.42;
              composer.addPass(bloom);
              (globe as any)._globalPulseBloom = bloom;
            }
          } catch (err) {
            console.warn("Global Pulse bloom unavailable; continuing without post-processing:", err);
          }
        }

        // Configure controls
        const controls = globe.controls();
        if (controls) {
          controls.enableZoom = false;
          controls.enableRotate = false;
          if ("enablePan" in controls) controls.enablePan = false;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.34;
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;

          // Pause auto-rotation on user interaction and resume after delay
          let resumeTimeout: NodeJS.Timeout;
          const onStartInteraction = () => {
            controls.autoRotate = false;
            if (resumeTimeout) clearTimeout(resumeTimeout);
          };
          const onEndInteraction = () => {
            if (resumeTimeout) clearTimeout(resumeTimeout);
            resumeTimeout = setTimeout(() => {
              if (controls) controls.autoRotate = true;
            }, 4000);
          };

          controls.addEventListener("start", onStartInteraction);
          controls.addEventListener("end", onEndInteraction);
        }

        // Global-First initial view: North Atlantic / International (US, Canada, UK, Western Europe, Africa)
        // Phase 2A.1 Camera altitude tuned to 1.70 so Earth diameter occupies ~76-80% of usable stage height
        globe.pointOfView({ lat: 16, lng: -42, altitude: 2.38 }, 0);

        globeInstanceRef.current = globe;
        setIsGlobeReady(true);

        // Resize handler
        const handleResize = () => {
          if (!containerRef.current || !globeInstanceRef.current) return;
          globeInstanceRef.current
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight);
        };
        window.addEventListener("resize", handleResize);

        (globe as any)._cleanupResize = () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err: any) {
        console.error("Failed to initialize globe.gl:", err);
        setInitError(err?.message || "Failed to initialize 3D Globe");
      }
    };

    void initGlobe();

    return () => {
      destroyed = true;
      if (globeInstanceRef.current) {
        try {
          if (globeInstanceRef.current._cleanupResize) {
            globeInstanceRef.current._cleanupResize();
          }

          // Clean up custom Three.js meshes & materials
          if (typeof globeInstanceRef.current.scene === "function") {
            const scene: THREE.Scene | null = globeInstanceRef.current.scene();
            if (scene && scene.isScene) {
              customSceneObjectsRef.current.forEach((obj) => {
                scene.remove(obj);
                if ((obj as any).geometry) {
                  (obj as any).geometry.dispose?.();
                }
                if ((obj as any).material) {
                  const mat = (obj as any).material;
                  if (Array.isArray(mat)) {
                    mat.forEach((m) => m.dispose?.());
                  } else {
                    mat.dispose?.();
                  }
                }
              });
              customSceneObjectsRef.current = [];
            }
          }

          if (typeof globeInstanceRef.current._destructor === "function") {
            globeInstanceRef.current._destructor();
          }
        } catch {
          // ignore cleanup errors
        }
        globeInstanceRef.current = null;
      }
    };
  }, [webglSupported]);

  // Explicit interaction mode:
  // passive = native page scrolling, globe cannot hijack wheel/drag;
  // active = freeze page at its current scroll position and give wheel/drag to the globe.
  useEffect(() => {
    const globe = globeInstanceRef.current;
    const controls = globe && typeof globe.controls === "function" ? globe.controls() : null;

    if (controls) {
      controls.enableZoom = isInteractionMode;
      controls.enableRotate = isInteractionMode;
      if ("enablePan" in controls) controls.enablePan = false;
    }

    const body = document.body;
    const root = document.documentElement;
    const container = containerRef.current;

    if (container) {
      container.style.touchAction = isInteractionMode ? "none" : "pan-y";
      container.style.cursor = isInteractionMode ? "grab" : "default";
    }

    if (!isInteractionMode) return;

    lockedScrollYRef.current = window.scrollY || window.pageYOffset || 0;

    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      rootOverflow: root.style.overflow,
    };

    // position:fixed prevents wheel/trackpad from moving the document while also
    // preserving the exact visual scroll position. We restore it on exit.
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollYRef.current}px`;
    body.style.width = "100%";
    root.style.overflow = "hidden";

    const exitInteraction = () => setIsInteractionMode(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") exitInteraction();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);

      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      root.style.overflow = previous.rootOverflow;

      if (containerRef.current) {
        containerRef.current.style.touchAction = "pan-y";
        containerRef.current.style.cursor = "default";
      }

      // Return the page exactly to where it was before Explore Globe was enabled.
      window.scrollTo({ top: lockedScrollYRef.current, left: 0, behavior: "auto" });
    };
  }, [isInteractionMode, isGlobeReady]);

  // Update Points and Rings dynamically without recreating the Globe or resetting camera/zoom
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    if (mode === "live") {
      // 1. Live Activity Mode
      const pointsData: GlobePoint[] = [];

      // Visitors points
      locations.forEach((loc) => {
        if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;
        const baseRadius = 0.35;
        const size = Math.min(baseRadius + Math.log2(Math.max(1, loc.activeCount)) * 0.22, 1.4);

        pointsData.push({
          lat: loc.latitude,
          lng: loc.longitude,
          size,
          color: "rgba(40, 190, 255, 0.98)",
          altitude: 0.02,
          location: loc,
          type: "visitor",
        });
      });

      // Recent purchases points
      recentPurchases.forEach((purchase) => {
        if (!purchase.mappable || typeof purchase.latitude !== "number" || typeof purchase.longitude !== "number") return;

        const isNew = newPurchaseOrderIds.has(purchase.orderId);
        pointsData.push({
          lat: purchase.latitude,
          lng: purchase.longitude,
          size: isNew ? 0.75 : 0.5,
          color: isNew ? "rgba(255, 184, 0, 1)" : "rgba(245, 158, 11, 0.85)",
          altitude: isNew ? 0.06 : 0.035,
          purchase,
          type: "purchase",
        });
      });

      globe.pointsData(pointsData);

      // Rings: real visitor clusters receive restrained cyan pulses; new
      // purchases retain the stronger amber pulse already used by production.
      const ringsData: GlobeRing[] = [];

      locations.forEach((loc) => {
        if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;
        if (loc.activeCount < 2) return;
        ringsData.push({
          lat: loc.latitude,
          lng: loc.longitude,
          maxR: Math.min(2.8 + Math.log2(Math.max(2, loc.activeCount)) * 0.75, 6.8),
          propagationSpeed: 1.25,
          repeatPeriod: 2200,
          color: "rgba(63, 210, 255, 0.62)",
        });
      });

      recentPurchases.forEach((purchase) => {
        if (!purchase.mappable || typeof purchase.latitude !== "number" || typeof purchase.longitude !== "number") return;

        if (newPurchaseOrderIds.has(purchase.orderId)) {
          ringsData.push({
            lat: purchase.latitude,
            lng: purchase.longitude,
            maxR: 3.5,
            propagationSpeed: 2.2,
            repeatPeriod: 1200,
            color: "rgba(255, 196, 0, 0.85)",
          });
        }
      });

      globe.ringsData(ringsData);
      if (typeof globe.arcsData === "function") {
        globe.arcsData(buildLiveArcs(locations));
      }
      if (typeof globe.labelsData === "function") {
        globe.labelsData(buildLiveLabels(locations));
      }
    } else {
      // 2. Historical Mode (Revenue Map or Purchase Map)
      // Zero live-only overlays in historical mode.
      globe.ringsData([]);
      if (typeof globe.arcsData === "function") globe.arcsData([]);
      if (typeof globe.labelsData === "function") globe.labelsData([]);

      const validCities = extractValidMappableCities(historicalCities);

      if (validCities.length === 0) {
        globe.pointsData([]);
        return;
      }

      // Compute max value for normalized log scaling
      let maxValue = 1;
      if (mode === "revenue") {
        maxValue = Math.max(...validCities.map((c) => c.revenueCents), 1);
      } else {
        maxValue = Math.max(...validCities.map((c) => c.purchaseCount), 1);
      }

      const pointsData: GlobePoint[] = validCities.map((city) => {
        const val = mode === "revenue" ? city.revenueCents : city.purchaseCount;
        const intensity = calculateLogIntensity(val, maxValue, 0.2);
        const isSelected = selectedCity?.city === city.city && selectedCity?.countryCode === city.countryCode;

        const size = calculateMarkerSize(val, maxValue, isSelected ? 0.7 : 0.45, isSelected ? 1.6 : 1.35);
        const altitude = calculatePointAltitude(val, maxValue, 0.02, 0.10);
        const color = getHistoricalPointColor(mode, intensity, isSelected);

        return {
          lat: city.latitude,
          lng: city.longitude,
          size,
          color,
          altitude: isSelected ? altitude + 0.03 : altitude,
          historicalCity: city,
          type: "historical",
        };
      });

      globe.pointsData(pointsData);
    }
  }, [
    mode,
    locations,
    recentPurchases,
    newPurchaseOrderIds,
    historicalCities,
    selectedCity,
    isGlobeReady,
  ]);

  if (!webglSupported || initError) {
    return (
      <div 
        data-testid="webgl-fallback"
        className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-[#071D26] rounded-[12px] border border-[#11313B] p-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#11313B] flex items-center justify-center text-[#8A979D] mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-[15px]">3D view unavailable on this device.</h3>
        <p className="text-[#8A979D] text-[12px] mt-1 max-w-sm">
          WebGL hardware acceleration is disabled or unsupported. Activity metrics, Top Countries, and analytics cards remain fully operational.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`global-pulse-globe-interaction w-full h-full min-h-[440px] relative select-none ${
        isInteractionMode ? "is-active" : "is-passive"
      }`}
      ref={containerRef}
      data-globe-interaction={isInteractionMode ? "active" : "passive"}
    >
      {/* Globe canvas attaches here */}

      <button
        type="button"
        className="global-pulse-interaction-toggle"
        aria-pressed={isInteractionMode}
        aria-label={isInteractionMode ? "Exit globe interaction mode" : "Explore globe"}
        title={isInteractionMode ? "Return mouse wheel to page scrolling" : "Lock page scrolling and interact with the globe"}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsInteractionMode((current) => !current);
        }}
      >
        <span className="global-pulse-interaction-toggle-dot" aria-hidden="true" />
        <span>{isInteractionMode ? "Exit Globe" : "Explore Globe"}</span>
        <small>{isInteractionMode ? "ESC" : "SCROLL"}</small>
      </button>

      {isInteractionMode && (
        <div className="global-pulse-interaction-note" role="status">
          Scroll to zoom · Drag to rotate · Press Esc to exit
        </div>
      )}
    </div>
  );
}
