import { useRef } from "react";
import "./App.css";
import { CountryList } from "./components/CountryList";
import { Globe, type GlobeMethods } from "./components/Globe";

function App() {
	const globeRef = useRef<GlobeMethods>(null);

	const handleCountrySelect = (lat: number, lng: number, name: string) => {
		if (globeRef.current) {
			globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
			globeRef.current.addPinMarker(lat, lng, name);
		}
	};

	return (
		<div className="app">
			<Globe ref={globeRef} />
			<CountryList onSelectCountry={handleCountrySelect} />
		</div>
	);
}

export default App;
