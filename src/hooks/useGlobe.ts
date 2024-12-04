import Globe from "globe.gl";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SunPosition } from "../types";

const EARTH_RADIUS = 100;
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

export const useGlobe = (containerRef: React.RefObject<HTMLDivElement>) => {
	const globeRef = useRef<any>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		if (!containerRef.current || isInitialized) return;

		// Load textures
		const textureLoader = new THREE.TextureLoader();
		const dayTexture = textureLoader.load(GLOBE_IMAGE_URL);
		const nightTexture = textureLoader.load(NIGHT_IMAGE_URL);
		const bumpTexture = textureLoader.load(BUMP_IMAGE_URL);

		// Create custom material
		const customMaterial = new THREE.ShaderMaterial({
			uniforms: {
				dayTexture: { value: dayTexture },
				nightTexture: { value: nightTexture },
				sunAngle: { value: 0.0 },
				sunLatitude: { value: 0.0 },
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			bumpMap: bumpTexture,
			bumpScale: 10,
		});

		// Initialize globe with custom material
		const globe = Globe()(containerRef.current)
			.width(containerRef.current.clientWidth)
			.height(containerRef.current.clientHeight);

		globe.globeMaterial(customMaterial);

		// Add ambient light for better visibility
		const ambientLight = new THREE.AmbientLight(0x333333);
		globe.scene().add(ambientLight);

		globeRef.current = globe;
		setIsInitialized(true);

		// Handle window resize
		const handleResize = () => {
			const { clientWidth, clientHeight } = containerRef.current!;
			globe.width(clientWidth).height(clientHeight);
		};
		window.addEventListener("resize", handleResize);

		// Add rotation listener to update sun angle when globe rotates
		globe.controls().addEventListener("change", () => {
			const lastSunPos = (globe.globeMaterial() as THREE.ShaderMaterial)
				.uniforms.sunAngle.value;
			updateSunPosition({
				lng: THREE.MathUtils.radToDeg(lastSunPos),
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
	}, [containerRef, isInitialized]);

	const updateSunPosition = (sunPos: SunPosition) => {
		if (!globeRef.current) return;

		// Get the current globe rotation
		const rotation = globeRef.current.controls().getAzimuthalAngle();

		// Convert sun position to radians
		const sunLng = THREE.MathUtils.degToRad(sunPos.lng);
		const sunLat = THREE.MathUtils.degToRad(sunPos.lat);

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

	return { globe: globeRef.current, updateSunPosition, pointOfView };
};
