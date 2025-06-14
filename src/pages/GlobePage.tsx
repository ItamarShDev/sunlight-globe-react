import { useCallback, useRef } from "react";
import { useLoaderData } from "react-router-dom";
import { CountryList } from "../components/CountryList";
import { Globe } from "../components/Globe";
import type { Country } from "../types";

// Define the shape of the data loaded by the route loader
interface LoaderData {
  countries: Country[];
}

// Simple page component that contains both the Globe and CountryList
// This will be rendered when the user navigates to the root path ("/")
export const GlobePage = () => {
  const { countries: initialCountries } = useLoaderData() as LoaderData;
  const globeRef = useRef<any>(null);

  const handleCountrySelect = useCallback((lat: number, lng: number, name: string) => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat, lng, altitude: 1.5 }, 1000);
      globeRef.current.addPinMarker(lat, lng, name);
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <div className="w-1/2 h-full">
        <Globe ref={globeRef} />
      </div>
      <div className="w-1/2 h-full overflow-hidden">
        <CountryList
          initialCountries={initialCountries}
          onSelectCountry={handleCountrySelect}
        />
      </div>
    </div>
  );
};
