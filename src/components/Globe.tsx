import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useGlobe } from "../hooks/useGlobe";
import { getSunPosition } from "../utils/sunPosition";

const TIME_UPDATE_INTERVAL = 60000; // 1 minute
const DEFAULT_ALTITUDE = 2.5;

interface GlobeMethods {
  pointOfView: (coords: { lat: number; lng: number; altitude?: number }, duration: number) => void;
  addPinMarker: (lat: number, lng: number, name: string) => void;
  clearMarkers: () => void;
}

export const Globe = forwardRef<GlobeMethods>((_, ref) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const { globe, updateSunPosition, pointOfView, addPinMarker, clearMarkers } = useGlobe(
		containerRef as React.RefObject<HTMLDivElement>
	);

	useImperativeHandle(ref, () => ({
		pointOfView: (coords: { lat: number; lng: number; altitude?: number }, duration: number) => {
			if (!globe) return;
			const { lat, lng, altitude = DEFAULT_ALTITUDE } = coords;
			pointOfView(lat, lng, altitude, duration);
		},
		addPinMarker: (lat: number, lng: number, name: string) => globe && addPinMarker(lat, lng, name),
		clearMarkers: () => globe && clearMarkers(),
	}));

	useEffect(() => {
		if (!globe) return;

		const updateInterval = setInterval(() => {
			const sunPos = getSunPosition();
			updateSunPosition(sunPos);
		}, TIME_UPDATE_INTERVAL);

		const sunPos = getSunPosition();
		updateSunPosition(sunPos);
		pointOfView(sunPos.lat, sunPos.lng, DEFAULT_ALTITUDE, 0);

		globe.controls().addEventListener("change", () => {
			updateSunPosition(getSunPosition());
		});

		return () => clearInterval(updateInterval);
	}, [globe, updateSunPosition, pointOfView]);

	return (
		<div
			ref={containerRef}
			style={{
				width: "100%",
				height: "100vh",
				background: "#000",
			}}
		/>
	);
});
