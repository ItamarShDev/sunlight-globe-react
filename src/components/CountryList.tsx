import { useMemo, useCallback, useState, useEffect } from "react";
import { useCountries } from '../hooks/useCountries';
import type { Country } from "../types";
import { getTimeInTimezone, getIANATimezone } from "../utils/timeUtils";
import "./CountryList.css";

interface CountryListProps {
  onSelectCountry: (lat: number, lng: number, name: string) => void;
  initialCountries?: Country[];
}

// Helper function to format timezone offset
const formatTimezoneOffset = (timezone: string): string => {
  if (!timezone) return '';
  
  // Handle common timezone formats
  const match = timezone.match(/^UTC([+-]?\d{1,2})(:?\d{2})?/);
  if (!match) return timezone;
  
  const sign = match[1].startsWith('-') ? '-' : '+';
  const hours = match[1].replace(/[+-]/, '').padStart(2, '0');
  const minutes = match[2] ? match[2].replace(':', '') : '00';
  
  return `UTC${sign}${hours}:${minutes}`;
};

export const CountryList = ({ onSelectCountry, initialCountries }: CountryListProps) => {
  const { 
    countries, 
    searchTerm, 
    setSearchTerm, 
    setSelectedCountry,
    isLoading, 
    error
  } = useCountries({ initialData: initialCountries });

  const filteredCountries = useMemo(() => {
    if (!countries || !Array.isArray(countries)) return [];
    if (!searchTerm) {
      return [...countries].sort((a, b) => 
        a.name.common.localeCompare(b.name.common)
      );
    }

    const searchLower = searchTerm.toLowerCase();
    return countries
      .filter(country => 
        country.name.common.toLowerCase().includes(searchLower) ||
        (country.name.official && country.name.official.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => a.name.common.localeCompare(b.name.common));
  }, [countries, searchTerm]);

  const handleCountrySelect = useCallback((country: Country) => {
    const [lat, lng] = country.latlng;
    setSelectedCountry(country.name.common);
    onSelectCountry(lat, lng, country.name.common);
  }, [onSelectCountry, setSelectedCountry]);

  // Only show the list when there's a search term
  const showResults = searchTerm.trim().length > 0;
  
  // Force re-render every minute to update times
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="country-list-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
          disabled={isLoading}
        />
      </div>

      {error ? (
        <div className="error-message">
          <p>{error}</p>
        </div>
      ) : showResults && isLoading ? (
        <div className="loading">Loading countries...</div>
      ) : showResults && filteredCountries.length === 0 ? (
        <div className="no-results">No countries found matching "{searchTerm}"</div>
      ) : showResults ? (
        <ul className="country-list">
          {filteredCountries.map((country) => {
            // Get the first timezone or default to UTC
            const timezone = country.timezones?.[0] || 'UTC';
            const formattedTz = formatTimezoneOffset(timezone);
            
            return (
              <li
                key={country.name.common}
                onClick={() => handleCountrySelect(country)}
                className="country-item"
              >
                <div className="country-info">
                  <span className="country-name">{country.name.common}</span>
                  {formattedTz && (
                    <span className="timezone-badge">{formattedTz}</span>
                  )}
                </div>
                <div className="country-time">
                  {getTimeInTimezone(getIANATimezone(timezone))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
