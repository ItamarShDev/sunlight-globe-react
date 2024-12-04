import Globe from "globe.gl";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SunPosition } from "../types";

const GLOBE_IMAGE_URL =
	"//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const NIGHT_IMAGE_URL = "//unpkg.com/three-globe/example/img/earth-night.jpg";
const BUMP_IMAGE_URL = "//unpkg.com/three-globe/example/img/earth-topology.png";

// Custom shader for day/night cycle
const fragmentShader = `
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform float sunAngle;
uniform float sunLatitude;
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    // Calculate sun direction in world space
    float lat = radians(sunLatitude);
    vec3 sunDirection = normalize(vec3(
        cos(lat) * cos(sunAngle),
        sin(lat),
        cos(lat) * sin(sunAngle)
    ));
    
    // Calculate light intensity
    float intensity = dot(vNormal, sunDirection);
    
    // Smoother transition between day and night
    // Use wider transition zone and cubic smoothstep for more natural look
    float dayness = smoothstep(-0.2, 0.2, intensity);
    
    // Sample textures
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    
    // Mix colors with smooth transition
    gl_FragColor = mix(nightColor, dayColor, dayness);
}`;

const vertexShader = `
varying vec2 vUv;
varying vec3 vNormal;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Texture cache to prevent redundant loading
const textureCache = new Map<string, THREE.Texture>();

// Preload textures function
const preloadTextures = async () => {
	const textureLoader = new THREE.TextureLoader();
	const urls = [GLOBE_IMAGE_URL, NIGHT_IMAGE_URL, BUMP_IMAGE_URL];

	const loadTexture = (url: string) => {
		if (textureCache.has(url)) {
			return Promise.resolve(textureCache.get(url));
		}
		return new Promise<THREE.Texture>((resolve, reject) => {
			textureLoader.load(
				url,
				(texture) => {
					textureCache.set(url, texture);
					resolve(texture);
				},
				undefined,
				reject,
			);
		});
	};

	try {
		await Promise.all(urls.map(loadTexture));
	} catch (error) {
		console.error("Failed to preload textures:", error);
	}
};

export const useGlobe = (containerRef: React.RefObject<HTMLDivElement>) => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const globeRef = useRef<any>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		// Preload textures before initializing
		const initializeGlobe = async () => {
			if (!containerRef.current || isInitialized) return;

			// Preload textures first
			await preloadTextures();

			// Get preloaded textures from cache
			const dayTexture = textureCache.get(GLOBE_IMAGE_URL);
			const nightTexture = textureCache.get(NIGHT_IMAGE_URL);
			const bumpTexture = textureCache.get(BUMP_IMAGE_URL);

			// Create custom material with cached textures
			const customMaterial = new THREE.ShaderMaterial({
				uniforms: {
					dayTexture: { value: dayTexture },
					nightTexture: { value: nightTexture },
					sunAngle: { value: 0.0 },
					sunLatitude: { value: 0.0 },
				},
				vertexShader: vertexShader,
				fragmentShader: fragmentShader,
				// @ts-ignore
				bumpMap: bumpTexture,
				bumpScale: 10,
			});

			// Initialize globe with custom material
			const globe = new Globe(containerRef.current)
				.width(containerRef.current.clientWidth)
				.height(containerRef.current.clientHeight);
			// @ts-ignore
			globe.globeMaterial(customMaterial);

			// Add ambient light for better visibility
			const ambientLight = new THREE.AmbientLight(0x333333);
			globe.scene().add(ambientLight);

			globeRef.current = globe;
			setIsInitialized(true);

			// Handle window resize
			const handleResize = () => {
				// @ts-ignore
				const { clientWidth, clientHeight } = containerRef.current;
				globe.width(clientWidth).height(clientHeight);
			};
			window.addEventListener("resize", handleResize);

			// Add rotation listener to update sun angle when globe rotates
			globe.controls().addEventListener("change", () => {
				// @ts-ignore
				const lastSunPos = (globe.globeMaterial() as THREE.ShaderMaterial)
					.uniforms.sunAngle.value;
				updateSunPosition({
					lng: THREE.MathUtils.radToDeg(lastSunPos),
					// @ts-ignore
					lat: (globe.globeMaterial() as THREE.ShaderMaterial).uniforms
						.sunLatitude.value,
				});
			});

			return () => {
				window.removeEventListener("resize", handleResize);
				// Clean up rotation listener
				if (globeRef.current) {
					globeRef.current.controls().removeEventListener("change");
				}
			};
		};

		// Call the async initialization function
		initializeGlobe();
	}, [containerRef, isInitialized]);

	const updateSunPosition = (sunPos: SunPosition) => {
		if (!globeRef.current) return;

		// Get the current globe rotation
		const rotation = globeRef.current.controls().getAzimuthalAngle();

		// Convert sun position to radians
		const sunLng = THREE.MathUtils.degToRad(sunPos.lng);

		// Calculate the effective sun angle by considering globe rotation
		const adjustedSunAngle = sunLng + rotation;

		// Update shader uniforms
		const material = globeRef.current.globeMaterial() as THREE.ShaderMaterial;
		material.uniforms.sunAngle.value = adjustedSunAngle;
		material.uniforms.sunLatitude.value = sunPos.lat;
	};

	const pointOfView = (
		lat: number,
		lng: number,
		altitude: number,
		duration: number,
	) => {
		if (!globeRef.current) return;
		globeRef.current.pointOfView({ lat, lng, altitude }, duration);
	};

	const addPinMarker = (lat: number, lng: number, name?: string) => {
		if (!globeRef.current) return;

		// Remove any existing markers first
		globeRef.current.pointsData([]);

		// Add a new marker for the selected location
		globeRef.current.pointsData([
			{
				lat,
				lng,
				name: name || "Location",
				color: "red",
				radius: 0.5,
			},
		]);
	};

	const clearMarkers = () => {
		if (!globeRef.current) return;
		globeRef.current.pointsData([]);
	};

	return {
		globe: globeRef.current,
		updateSunPosition,
		pointOfView,
		addPinMarker,
		clearMarkers,
	};
};
