import { useCallback, useEffect, useState } from 'react';
import type { Country } from '../types';

export const useCountries = () => {
    const [countries, setCountries] = useState<Country[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
   
    const fetchCountries = useCallback(async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Use the Vite proxy to avoid CORS issues
				const response = await fetch('/api/all?fields=name,latlng,timezones', {
					method: 'GET',
					headers: {
						Accept: 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (!Array.isArray(data) || data.length === 0) {
					throw new Error('No country data received');
				}

				const validCountries = data.filter(
					(country: any) =>
						country.name?.common &&
						country.latlng?.length === 2 &&
						country.timezones,
				);

				if (validCountries.length === 0) {
					throw new Error("No valid countries found");
				}

				setCountries(validCountries);
			} catch (error) {
				setError(
					`Failed to load countries: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			} finally {
				setIsLoading(false);
			}
		}, []);

    useEffect(() => {
        fetchCountries();
    }, [fetchCountries]);

    return {
        countries,
        searchTerm,
        selectedCountry,
        isLoading,
        error,
        fetchCountries,
        setSearchTerm,
        setSelectedCountry,
    };
};
