// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapContainer from './components/MapContainer';
import Highbar from './components/Highbar'; // Импортируем Highbar

const App = () => {
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9');

  const handleStyleChange = (newStyle) => {
    setMapStyle(newStyle);
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar handleStyleChange={handleStyleChange} />
      
      {/* Передаем Highbar внутрь MapContainer */}
      <MapContainer mapStyle={mapStyle}>
        <Highbar /> {/* Highbar будет отображаться внизу карты */}
      </MapContainer>
    </div>
  );
};

export default App;
