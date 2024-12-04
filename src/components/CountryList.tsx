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
                
                // Try multiple endpoints
                const endpoints = [
                    'https://restcountries.com/v3.1/all',
                    'https://restcountries.com/v2/all',
                    'https://countries-api.com/countries'
                ];

                let data = null;
                for (const endpoint of endpoints) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        if (!response.ok) {
                            continue;
                        }

                        data = await response.json();
                        break;
                    } catch (fetchError) {
                    }
                }

                if (!data) {
                    throw new Error('Failed to fetch countries from all endpoints');
                }

                const validCountries = data.filter((country: any) => 
                    country.name?.common && 
                    country.latlng?.length === 2 &&
                    country.timezones
                );

                if (validCountries.length === 0) {
                    throw new Error('No valid countries found');
                }

                setCountries(validCountries);
            } catch (error) {
                setError(`Failed to load countries: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCountries();
    }, []);

    const UTC_TO_TIMEZONE: { [key: string]: string } = {
        'UTC+00:00': 'UTC',
        'UTC+01:00': 'Europe/London',
        'UTC+02:00': 'Europe/Athens',
        'UTC+03:00': 'Europe/Moscow',
        'UTC+04:00': 'Asia/Dubai',
        'UTC+05:00': 'Asia/Tashkent',
        'UTC+06:00': 'Asia/Dhaka',
        'UTC+07:00': 'Asia/Bangkok',
        'UTC+08:00': 'Asia/Singapore',
        'UTC+09:00': 'Asia/Tokyo',
        'UTC+10:00': 'Australia/Sydney',
        'UTC+11:00': 'Pacific/Noumea',
        'UTC+12:00': 'Pacific/Auckland',
        'UTC-01:00': 'Atlantic/Azores',
        'UTC-02:00': 'America/Noronha',
        'UTC-03:00': 'America/Sao_Paulo',
        'UTC-04:00': 'America/New_York',
        'UTC-05:00': 'America/Chicago',
        'UTC-06:00': 'America/Mexico_City',
        'UTC-07:00': 'America/Denver',
        'UTC-08:00': 'America/Los_Angeles',
        'UTC-09:00': 'America/Anchorage',
        'UTC-10:00': 'Pacific/Honolulu',
        'UTC-11:00': 'Pacific/Midway',
        'UTC-12:00': 'Etc/GMT+12'
    };

    const COUNTRY_TIMEZONE_FALLBACK: { [key: string]: string } = {
        'United States': 'America/New_York',
        'Russia': 'Europe/Moscow',
        'Canada': 'America/Toronto',
        'Australia': 'Australia/Sydney',
        'Brazil': 'America/Sao_Paulo',
        'China': 'Asia/Shanghai',
        'India': 'Asia/Kolkata',
        'United Kingdom': 'Europe/London'
    };

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
                        const timezone = country.timezones?.[0] || 'UTC+00:00';
                        let calculatedTime = 'N/A';
                        
                        try {
                            // Determine the most appropriate timezone
                            let timezoneName = UTC_TO_TIMEZONE[timezone];
                            
                            // Fallback for countries with multiple timezones or not in our mapping
                            if (!timezoneName) {
                                // Try to find a fallback based on country name
                                const fallbackCountry = Object.keys(COUNTRY_TIMEZONE_FALLBACK).find(key => 
                                    country.name.common.includes(key)
                                );
                                
                                timezoneName = fallbackCountry 
                                    ? COUNTRY_TIMEZONE_FALLBACK[fallbackCountry] 
                                    : 'UTC';
                            }

                            // Create a formatter with the specific timezone
                            const formatter = new Intl.DateTimeFormat('en-US', {
                                timeZone: timezoneName,
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            });

                            // Get the local time in the specified timezone
                            calculatedTime = formatter.format(new Date());
                        } catch (error) {
                            // Silently handle any time calculation errors
                            calculatedTime = 'N/A';
                        }
                        
                        return (
                            <div
                                key={country.name.common}
                                className={`country-item ${selectedCountry === country.name.common ? 'selected' : ''}`}
                                onClick={() => handleCountryClick(country)}
                            >
                                <div className="country-info">
                                    <span className="country-name">{country.name.common}</span>
                                    <span className="country-offset">{timezone.replace('UTC', 'GMT')}</span>
                                </div>
                                <span className="country-time">{calculatedTime}</span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
