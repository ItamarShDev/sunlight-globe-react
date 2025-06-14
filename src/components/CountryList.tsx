import { useMemo } from "react";
import { useCountries } from '../hooks/useCountries';
import type { Country } from "../types";
import { CountryItems } from './CountryItems';
import "./CountryList.css";

interface CountryListProps {
	onSelectCountry: (lat: number, lng: number, name: string) => void;
}

export const CountryList = ({ onSelectCountry }: CountryListProps) => {
	const { countries, searchTerm, setSearchTerm, setSelectedCountry, isLoading, error, selectedCountry } = useCountries();

	const filteredCountries = useMemo(() => {
		if (!countries) return [];
		if (!searchTerm) return [];
		return countries
			.filter((country) =>
				country.name.common.toLowerCase().includes(searchTerm.toLowerCase()),
			)
			.sort((a, b) => {
				// Get UTC offsets
				const getOffset = (timezone = "UTC") => {
					if (!timezone.startsWith("UTC")) return 0;
					const offset = timezone.replace("UTC", "");
					if (offset === "") return 0;

					// Handle half-hour offsets
					if (offset.includes(":")) {
						const [hours, minutes] = offset.split(":").map(Number);
						return hours + (minutes / 60) * (hours >= 0 ? 1 : -1);
					}

					return Number.parseFloat(offset) || 0;
				};

				const offsetA = getOffset(a.timezones?.[0]);
				const offsetB = getOffset(b.timezones?.[0]);

				// Sort by UTC offset first
				if (offsetA !== offsetB) {
					return offsetA - offsetB;
				}

				// If same timezone, sort alphabetically
				return a.name.common.localeCompare(b.name.common);
			});
	}, [countries, searchTerm]);

	const handleCountryClick = (country: Country) => {
		if (!country.latlng || country.latlng.length < 2) return;

		setSelectedCountry(country.name.common);
		onSelectCountry(country.latlng[0], country.latlng[1], country.name.common);
	};

	return (
		<div className="country-list-container">
			<input
				type="text"
				placeholder="Search countries..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="country-search"
			/>
			<div className="country-list">
				{isLoading && <div className="country-item">Loading countries...</div>}
				{error && <div className="country-item error">{error}</div>}
				{searchTerm && filteredCountries?.length === 0 && <div className="country-item">No countries found</div>}
				{filteredCountries?.length > 0 && <CountryItems
					selectedCountry={selectedCountry}
					filteredCountries={filteredCountries}
					handleCountryClick={handleCountryClick}
				/>}
			</div>
		</div>
	);
};
