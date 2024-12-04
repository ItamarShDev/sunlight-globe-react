import { useRef, useState } from "react";
import "./App.css";
import { CountryList } from "./components/CountryList";
import { Globe } from "./components/Globe";

const ANIMATION_DURATION = 1000;
const DEFAULT_ALTITUDE = 1.5; // Reduced from 2.5 to create a more pronounced zoom

function App() {
	const [count, setCount] = useState(0);
	const globeRef = useRef<any>(null);

	const handleCountrySelect = (lat: number, lng: number) => {
		if (globeRef.current) {
			// Add pin marker for the selected country
			globeRef.current.addPinMarker(lat, lng);

			// Zoom to the selected country
			globeRef.current.pointOfView(
				{ lat, lng, altitude: DEFAULT_ALTITUDE },
				ANIMATION_DURATION,
			);
		}
	};

	return (
		<div className="app-container">
			<Globe ref={globeRef} />
			<CountryList onSelectCountry={handleCountrySelect} />
		</div>
	);
}

export default App;
