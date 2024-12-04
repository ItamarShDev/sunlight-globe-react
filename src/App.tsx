import { useState, useRef } from 'react'
import { Globe } from './components/Globe';
import { CountryList } from './components/CountryList';
import './App.css'

const ANIMATION_DURATION = 1000;
const DEFAULT_ALTITUDE = 2.5;

function App() {
  const [count, setCount] = useState(0)
  const globeRef = useRef<any>(null);

  const handleCountrySelect = (lat: number, lng: number) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat, lng, altitude: DEFAULT_ALTITUDE },
        ANIMATION_DURATION
      );
    }
  };

  return (
    <div className="app-container">
      <Globe ref={globeRef} />
      <CountryList onSelectCountry={handleCountrySelect} />
    </div>
  )
}

export default App
