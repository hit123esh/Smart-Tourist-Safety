/// <reference types="@types/google.maps" />
import { useState, useEffect } from 'react';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
}

// Global state to track script loading
let isScriptLoading = false;
let isScriptLoaded = false;
let loadError: string | null = null;
const callbacks: (() => void)[] = [];

const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (isScriptLoaded && window.google?.maps) {
      resolve();
      return;
    }

    // Add to callbacks if currently loading
    if (isScriptLoading) {
      callbacks.push(() => {
        if (loadError) {
          reject(new Error(loadError));
        } else {
          resolve();
        }
      });
      return;
    }

    isScriptLoading = true;

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=visualization`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
      resolve();
    };

    script.onerror = () => {
      loadError = 'Failed to load Google Maps script';
      isScriptLoading = false;
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
      reject(new Error(loadError));
    };

    document.head.appendChild(script);
  });
};

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [error, setError] = useState<string | null>(loadError);

  useEffect(() => {
    if (isLoaded) return;

    loadGoogleMapsScript()
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err.message));
  }, [isLoaded]);

  return { isLoaded, loadError: error };
};
