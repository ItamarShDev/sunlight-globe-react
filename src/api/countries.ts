import type { Country } from "../types";

/**
 * Fetches the list of countries from the API
 * This function is used by both the route loader and the refresh functionality
 */
export async function fetchCountries(): Promise<Country[]> {
  try {
    const response = await fetch('/api/all?fields=name,latlng,timezones', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No country data received from the server');
    }

    return data.map((country: any) => ({
      ...country,
      name: {
        common: country.name.common,
        official: country.name.official || country.name.common,
      },
      latlng: country.latlng,
      timezones: country.timezones || ['UTC'],
    }));
  } catch (error) {
    console.error('Error in fetchCountries:', error);
    throw error;
  }
}

// Cache for storing the countries data
let countriesCache: Country[] | null = null;

/**
 * Gets the countries data, using cache if available
 * This is used by the route loader
 */
export async function getCountries(forceRefresh = false): Promise<Country[]> {
  if (countriesCache && !forceRefresh) {
    return countriesCache;
  }

  const countries = await fetchCountries();
  countriesCache = countries;
  return countries;
}
