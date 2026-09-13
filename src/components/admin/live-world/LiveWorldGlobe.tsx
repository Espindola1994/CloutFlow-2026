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

interface GlobeLabel {
  lat: number;
  lng: number;
  altitude: number;
  text: string;
  color: string;
  size: number;
  dotRadius: number;
}


// -------------------------------------------------------------
// Live World V4 — cinematic Earth renderer helpers
// -------------------------------------------------------------

// The V4 diffuse texture is intentionally darker than the source composite.
// Warm city lights are separated into their own emissive map so the oceans can
// stay deep/navy without sacrificing the night-side detail from the reference.
const LOCAL_GLOBE_IMG = "/admin/live-world/earth-night-v4.jpg";
const LOCAL_CITY_LIGHTS_IMG = "/admin/live-world/earth-city-lights-v4.jpg";
const LOCAL_BUMP_IMG = "/admin/live-world/earth-topology.png";

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

    if (alpha < 0.006) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

function applyEarthMaterial(globe: any, cityLightsTexture: THREE.Texture | null = null) {
  if (!globe || typeof globe.globeMaterial !== "function") return;

  try {
    const mat = globe.globeMaterial();
    if (!mat || !(mat as any).isMeshPhongMaterial) return;

    const phongMat = mat as THREE.MeshPhongMaterial;

    // The diffuse texture now carries geography/terrain only. Avoid the old
    // whole-map emissive treatment that made the planet look like blue plastic.
    phongMat.color.set("#d9e5ed");
    phongMat.emissive.set("#fff0cf");
    phongMat.emissiveIntensity = cityLightsTexture ? 1.42 : 0.02;
    phongMat.emissiveMap = cityLightsTexture;

    // Small, cool ocean sheen. The low shininess is deliberate: city lights,
    // not a glossy specular wash, should be the brightest surface feature.
    phongMat.specular.set("#2d7198");
    phongMat.shininess = 11;
    phongMat.bumpScale = 0.042;
    phongMat.needsUpdate = true;
  } catch (err) {
    console.warn("Failed to configure V4 globe material:", err);
  }
}

function setupSceneLighting(scene: THREE.Scene): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const hemisphereLight = new THREE.HemisphereLight(0x6dbbe2, 0x01040a, 0.28);
  scene.add(hemisphereLight);
  createdObjects.push(hemisphereLight);

  // Soft moonlight from upper-right gives the continents curvature without
  // bleaching the night texture or the polar regions.
  const keyLight = new THREE.DirectionalLight(0xbfe7ff, 0.52);
  keyLight.position.set(150, 120, 170);
  scene.add(keyLight);
  createdObjects.push(keyLight);

  const rimFill = new THREE.DirectionalLight(0x18b9d8, 0.10);
  rimFill.position.set(-160, 20, 110);
  scene.add(rimFill);
  createdObjects.push(rimFill);

  return createdObjects;
}

function setupAtmosphere(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const makeAtmosphereShell = (params: {
    radiusScale: number;
    color: string;
    intensity: number;
    power: number;
    blending: THREE.Blending;
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
      blending: params.blending,
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

  // Broad low-opacity shell + a tighter cyan edge. Lower Fresnel powers produce
  // the soft photographic atmosphere from the approved reference, not a neon ring.
  makeAtmosphereShell({
    radiusScale: 1.022,
    color: "#75dfff",
    intensity: 0.18,
    power: 2.9,
    blending: THREE.NormalBlending,
    renderOrder: 2,
  });

  makeAtmosphereShell({
    radiusScale: 1.085,
    color: "#22b8e6",
    intensity: 0.065,
    power: 4.2,
    blending: THREE.AdditiveBlending,
    renderOrder: 1,
  });

  return createdObjects;
}

/**
 * Permanent visual infrastructure only. These particles/orbits are intentionally
 * data-agnostic: no fake visitors, fake purchases or invented city connections.
 */
function setupCinematicInfrastructure(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const makeDottedOrbit = (params: {
    radiusX: number;
    radiusZ: number;
    y?: number;
    rotationX?: number;
    rotationY?: number;
    rotationZ?: number;
    opacity: number;
    pointSize: number;
    every: number;
    color?: string;
  }) => {
    const positions: number[] = [];
    const segments = 520;
    for (let i = 0; i < segments; i += 1) {
      if (i % params.every !== 0) continue;
      const t = (i / segments) * Math.PI * 2;
      positions.push(
        Math.cos(t) * params.radiusX,
        params.y ?? 0,
        Math.sin(t) * params.radiusZ,
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(params.color ?? "#58dff3"),
      size: params.pointSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: params.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });

    const orbit = new THREE.Points(geometry, material);
    orbit.rotation.set(params.rotationX ?? 0, params.rotationY ?? 0, params.rotationZ ?? 0);
    orbit.renderOrder = 0;
    scene.add(orbit);
    createdObjects.push(orbit);
  };

  // Thin dotted orbital architecture. Depth testing lets the planet occlude the
  // rear segments naturally, eliminating the "glass ribbon through Earth" artifact.
  makeDottedOrbit({
    radiusX: globeRadius * 1.28,
    radiusZ: globeRadius * 1.28,
    rotationX: 0.72,
    rotationZ: 0.28,
    opacity: 0.12,
    pointSize: 0.62,
    every: 3,
  });
  makeDottedOrbit({
    radiusX: globeRadius * 1.34,
    radiusZ: globeRadius * 1.34,
    rotationX: -0.52,
    rotationZ: -0.42,
    opacity: 0.075,
    pointSize: 0.54,
    every: 5,
    color: "#2baed8",
  });
  makeDottedOrbit({
    radiusX: globeRadius * 1.18,
    radiusZ: globeRadius * 1.18,
    rotationX: 1.06,
    rotationZ: 0.72,
    opacity: 0.065,
    pointSize: 0.48,
    every: 6,
    color: "#6cf8e8",
  });

  // Bright but narrow lower platform/halo from the approved mockup.
  makeDottedOrbit({
    radiusX: globeRadius * 1.23,
    radiusZ: globeRadius * 0.33,
    y: -globeRadius * 0.93,
    opacity: 0.34,
    pointSize: 0.90,
    every: 2,
    color: "#72f5ff",
  });
  makeDottedOrbit({
    radiusX: globeRadius * 1.08,
    radiusZ: globeRadius * 0.26,
    y: -globeRadius * 0.88,
    opacity: 0.16,
    pointSize: 0.66,
    every: 4,
    color: "#3ac6e8",
  });

  // Deterministic star/particle shell — rich even at zero live activity.
  const starPositions: number[] = [];
  const starCount = 310;
  for (let i = 0; i < starCount; i += 1) {
    const a = ((i * 73 + 19) % 997) / 997;
    const b = ((i * 193 + 43) % 991) / 991;
    const c = ((i * 389 + 71) % 983) / 983;
    const theta = a * Math.PI * 2;
    const radius = globeRadius * (1.32 + b * 1.15);
    const y = globeRadius * (-1.12 + c * 2.24);
    starPositions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
  }

  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: new THREE.Color("#8bdff5"),
    size: 0.54,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  stars.renderOrder = -2;
  scene.add(stars);
  createdObjects.push(stars);

  return createdObjects;
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
    let cityLightsTexture: THREE.Texture | null = null;

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
          // Intentionally empty: current Live World payload has locations, not
          // route/flow semantics. We do not fabricate city-to-city connections.
          globe.arcsData([]);
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

        // Apply the dark diffuse material immediately. City lights are loaded as a
        // separate emissive map, so only urban light sources glow.
        applyEarthMaterial(globe, null);

        try {
          const loader = new THREE.TextureLoader();
          cityLightsTexture = loader.load(LOCAL_CITY_LIGHTS_IMG, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            if (!destroyed) applyEarthMaterial(globe, texture);
          });
          cityLightsTexture.colorSpace = THREE.SRGBColorSpace;
          const renderer = typeof globe.renderer === "function" ? globe.renderer() : null;
          const maxAnisotropy = renderer?.capabilities?.getMaxAnisotropy?.();
          cityLightsTexture.anisotropy = typeof maxAnisotropy === "number" ? Math.min(maxAnisotropy, 8) : 4;
        } catch (err) {
          console.warn("Failed to load V4 city-light emissive texture:", err);
        }

        if (typeof globe.onGlobeReady === "function") {
          globe.onGlobeReady(() => {
            applyEarthMaterial(globe, cityLightsTexture);
          });
        }

        // Access Three.js scene and inject the cinematic non-data infrastructure.
        if (typeof globe.scene === "function") {
          const scene: THREE.Scene | null = globe.scene();
          if (scene && scene.isScene) {
            const lights = setupSceneLighting(scene);
            const atmosphere = setupAtmosphere(scene, 100);
            const cinematicInfrastructure = setupCinematicInfrastructure(scene, 100);
            customSceneObjectsRef.current = [...lights, ...atmosphere, ...cinematicInfrastructure];
          }
        }

        // Configure controls
        const controls = globe.controls();
        if (controls) {
          controls.enableZoom = true;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.38;
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
        // V4 composition: Americas/Atlantic-first framing, close to the approved reference.
        globe.pointOfView({ lat: 14, lng: -47, altitude: 1.92 }, 0);

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
                    mat.forEach((m) => {
                      m.map?.dispose?.();
                      m.dispose?.();
                    });
                  } else {
                    mat.map?.dispose?.();
                    mat.dispose?.();
                  }
                }
              });
              customSceneObjectsRef.current = [];
            }
          }

          cityLightsTexture?.dispose?.();
          cityLightsTexture = null;

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
          color: "rgba(57, 232, 224, 0.96)",
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
          color: "rgba(72, 245, 238, 0.50)",
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
        globe.arcsData([]);
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
    <div className="w-full h-full min-h-[440px] relative select-none" ref={containerRef}>
      {/* Globe canvas attaches here */}
    </div>
  );
}
