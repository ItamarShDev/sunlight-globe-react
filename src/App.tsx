import { useRef } from "react";
import "./App.css";
import { CountryList } from "./components/CountryList";
import { Globe } from "./components/Globe";

function App() {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const globeRef = useRef<any>(null);

	const handleCountrySelect = (lat: number, lng: number) => {
		if (globeRef.current) {
			globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
			globeRef.current.addPinMarker(lat, lng);
		}
	};

	return (
		<div className="app">
			<Globe ref={globeRef} />
			<CountryList onCountrySelect={handleCountrySelect} />
		</div>
	);
}

export default App;
