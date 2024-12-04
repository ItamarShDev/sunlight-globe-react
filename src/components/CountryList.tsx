import { useState, useEffect } from 'react';
import { Country } from '../types';
import { getGMTOffset, getLocalTime } from '../utils/sunPosition';
import './CountryList.css';

interface CountryListProps {
    onSelectCountry: (lat: number, lng: number) => void;
}

export const CountryList = ({ onSelectCountry }: CountryListProps) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('https://restcountries.com/v3.1/all');
                if (!response.ok) {
                    throw new Error('Failed to fetch countries');
                }
                const data = await response.json();
                const validCountries = data.filter((country: any) => 
                    country.name?.common && 
                    country.latlng?.length === 2
                );
                console.log('Sample country data:', validCountries.slice(0, 5));
                setCountries(validCountries);
            } catch (error) {
                console.error('Failed to fetch countries:', error);
                setError('Failed to load countries. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const filteredCountries = countries
        .filter(country => 
            country.name.common.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Get UTC offsets
            const getOffset = (timezone: string = 'UTC') => {
                if (!timezone.startsWith('UTC')) return 0;
                const offset = timezone.replace('UTC', '');
                if (offset === '') return 0;
                
                // Handle half-hour offsets
                if (offset.includes(':')) {
                    const [hours, minutes] = offset.split(':').map(Number);
                    return hours + (minutes / 60) * (hours >= 0 ? 1 : -1);
                }
                
                return parseFloat(offset) || 0;
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

    const handleCountryClick = (country: Country) => {
        if (!country.latlng || country.latlng.length < 2) return;
        
        setSelectedCountry(country.name.common);
        onSelectCountry(country.latlng[0], country.latlng[1]);
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
                {isLoading ? (
                    <div className="country-item">Loading countries...</div>
                ) : error ? (
                    <div className="country-item error">{error}</div>
                ) : filteredCountries.length === 0 ? (
                    <div className="country-item">No countries found</div>
                ) : (
                    filteredCountries.map((country) => {
                        const timezone = country.timezones?.[0] || 'UTC';
                        let localTime = 'N/A';
                        
                        if (timezone) {
                            try {
                                // Convert timezone format if it's in UTC+X/-X format
                                let formattedTimezone = timezone;
                                if (timezone.startsWith('UTC')) {
                                    const offset = timezone.replace('UTC', '');
                                    if (offset === '') {
                                        formattedTimezone = 'UTC';
                                    } else {
                                        // Convert UTC+X/-X to a valid IANA timezone
                                        const hours = parseInt(offset);
                                        if (!isNaN(hours)) {
                                            // Use a reference timezone based on the offset
                                            const offsetHours = Math.abs(hours);
                                            if (hours >= 0) {
                                                formattedTimezone = offsetHours === 8 ? 'Asia/Singapore' :
                                                    offsetHours === 9 ? 'Asia/Tokyo' :
                                                    offsetHours === 5.5 ? 'Asia/Kolkata' :
                                                    offsetHours === 1 ? 'Europe/London' :
                                                    offsetHours === 2 ? 'Europe/Berlin' :
                                                    offsetHours === 3 ? 'Europe/Moscow' :
                                                    offsetHours === 4 ? 'Asia/Dubai' :
                                                    offsetHours === 5 ? 'Asia/Karachi' :
                                                    offsetHours === 6 ? 'Asia/Dhaka' :
                                                    offsetHours === 7 ? 'Asia/Bangkok' :
                                                    offsetHours === 10 ? 'Asia/Tokyo' :
                                                    offsetHours === 11 ? 'Asia/Tokyo' :
                                                    offsetHours === 12 ? 'Pacific/Auckland' : 'UTC';
                                            } else {
                                                formattedTimezone = offsetHours === 5 ? 'America/New_York' :
                                                    offsetHours === 6 ? 'America/Chicago' :
                                                    offsetHours === 7 ? 'America/Denver' :
                                                    offsetHours === 8 ? 'America/Los_Angeles' :
                                                    offsetHours === 3 ? 'America/Sao_Paulo' :
                                                    offsetHours === 4 ? 'America/Halifax' : 'UTC';
                                            }
                                        }
                                    }
                                }

                                // Use the formatted timezone
                                const formatter = new Intl.DateTimeFormat('en-US', {
                                    timeZone: formattedTimezone,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                });
                                localTime = formatter.format(new Date());
                            } catch (error) {
                                console.warn(`Could not get time for ${country.name.common} with timezone ${timezone}:`, error);
                            }
                        }
                        
                        return (
                            <div
                                key={country.name.common}
                                className={`country-item ${selectedCountry === country.name.common ? 'selected' : ''}`}
                                onClick={() => handleCountryClick(country)}
                            >
                                <span className="country-name">{country.name.common}</span>
                                <span className="country-time">{localTime}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
