import { useCallback, useEffect, useState } from 'react';
import type { Country } from '../types';
import { getCountries } from '../api/countries';

interface UseCountriesOptions {
  initialData?: Country[];
}

export const useCountries = ({ initialData }: UseCountriesOptions = {}) => {
  const [countries, setCountries] = useState<Country[]>(initialData || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // If we have initial data, we don't need to load it again
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setIsLoading(false);
    }
  }, [initialData]);

  const refreshCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const freshCountries = await getCountries(true); // Force refresh
      setCountries(freshCountries);
      setError(null);
      return freshCountries;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unknown error occurred while refreshing countries';
      
      console.error('Error refreshing countries:', err);
      setError(errorMessage);
      
      // Re-throw the error so components can handle it if needed
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // If no initial data was provided, load it on mount
  useEffect(() => {
    if (!initialData) {
      refreshCountries().catch(() => {
        // Error is already handled in refreshCountries
      });
    }
  }, [initialData, refreshCountries]);

  return {
    countries,
    searchTerm,
    selectedCountry,
    isLoading,
    error,
    refreshCountries,
    setSearchTerm,
    setSelectedCountry,
  };
};
