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
const LOCAL_GLOBE_IMG = "/admin/live-world/earth-night.jpg";
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

    // Neutral diffuse tint: do not multiply the blue NASA composite down.
    phongMat.color.set("#dceaf2");

    // Reuse the loaded surface map as a low-strength emissive map. This is the
    // key fix that keeps the supplied blue oceans and city lights visible on
    // the night side without flattening the sphere into a fully unlit texture.
    if (phongMat.map) {
      phongMat.emissiveMap = phongMat.map;
      phongMat.emissive.set("#ffffff");
      phongMat.emissiveIntensity = 0.12;
    } else {
      // Safe fallback while the async globe texture is still loading.
      phongMat.emissiveMap = null;
      phongMat.emissive.set("#061b2e");
      phongMat.emissiveIntensity = 0.18;
    }

    // Restrained ocean sheen. The authored texture remains the visual source;
    // lighting is used only to add shape, not to recolor the planet.
    phongMat.specular.set("#1e4f70");
    phongMat.shininess = 9;
    phongMat.bumpScale = 0.045;
    phongMat.needsUpdate = true;
  } catch (err) {
    console.warn("Failed to configure globe material:", err);
  }
}

/**
 * Add only the lighting needed for spherical depth. Because the surface map
 * now contributes a restrained emissive term, these lights no longer have to
 * overpower the texture just to make geography readable.
 */
function setupSceneLighting(scene: THREE.Scene): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const hemisphereLight = new THREE.HemisphereLight(0x6ebfe8, 0x010711, 0.42);
  scene.add(hemisphereLight);
  createdObjects.push(hemisphereLight);

  const keyLight = new THREE.DirectionalLight(0xc9ebff, 0.82);
  keyLight.position.set(145, 105, 175);
  scene.add(keyLight);
  createdObjects.push(keyLight);

  const fillLight = new THREE.DirectionalLight(0x1f5b82, 0.14);
  fillLight.position.set(-135, -35, 120);
  scene.add(fillLight);
  createdObjects.push(fillLight);

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
    radiusScale: 1.014,
    color: "#63e8ff",
    intensity: 0.20,
    power: 6.4,
    renderOrder: 2,
  });

  makeAtmosphereShell({
    radiusScale: 1.060,
    color: "#1a7fdb",
    intensity: 0.055,
    power: 8.2,
    renderOrder: 1,
  });

  return createdObjects;
}

/**
 * Decorative orbital guides inspired by the approved Live World reference.
 * They contain no invented customer/location data: they are purely visual
 * infrastructure around the real data-driven globe.
 */
function setupOrbitalGuides(scene: THREE.Scene, globeRadius: number = 100): THREE.Object3D[] {
  const createdObjects: THREE.Object3D[] = [];

  const makeLowerOrbit = (
    radiusX: number,
    radiusZ: number,
    y: number,
    opacity: number,
    dashEvery: number,
    pointSize: number,
  ) => {
    const positions: number[] = [];
    const segments = 420;
    for (let i = 0; i < segments; i += 1) {
      if (i % dashEvery !== 0) continue;
      const t = (i / segments) * Math.PI * 2;
      positions.push(Math.cos(t) * radiusX, y, Math.sin(t) * radiusZ);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: new THREE.Color("#63e9ff"),
      size: pointSize,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });

    const orbit = new THREE.Points(geometry, material);
    orbit.renderOrder = 0;
    scene.add(orbit);
    createdObjects.push(orbit);
  };

  // Permanent scene architecture only. Keeping both tracks below the sphere
  // prevents the visual from reading as a translucent band passing through Earth.
  makeLowerOrbit(globeRadius * 1.28, globeRadius * 0.32, -globeRadius * 0.91, 0.34, 2, 0.72);
  makeLowerOrbit(globeRadius * 1.08, globeRadius * 0.24, -globeRadius * 0.84, 0.16, 4, 0.58);

  // Sparse deterministic particles add depth while remaining clearly decorative.
  const particlePositions: number[] = [];
  const particleCount = 180;
  for (let i = 0; i < particleCount; i += 1) {
    const seedA = ((i * 73) % 997) / 997;
    const seedB = ((i * 193) % 991) / 991;
    const seedC = ((i * 389) % 983) / 983;
    const theta = seedA * Math.PI * 2;
    const radius = globeRadius * (1.18 + seedB * 0.74);
    const y = globeRadius * (-0.88 + seedC * 1.76);
    particlePositions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: new THREE.Color("#6edff5"),
    size: 0.52,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  particles.renderOrder = -1;
  scene.add(particles);
  createdObjects.push(particles);

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
            const atmosphere = setupAtmosphere(scene, 100);
            const orbitalGuides = setupOrbitalGuides(scene, 100);
            customSceneObjectsRef.current = [...lights, ...atmosphere, ...orbitalGuides];
          }
        }

        // Configure controls
        const controls = globe.controls();
        if (controls) {
          controls.enableZoom = true;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
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
        // V3.1 composition: slightly wider framing leaves room for the permanent scene architecture
        globe.pointOfView({ lat: 18, lng: -38, altitude: 2.20 }, 0);

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
          color: "rgba(15, 143, 138, 0.92)",
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
          color: "rgba(67, 240, 239, 0.42)",
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
