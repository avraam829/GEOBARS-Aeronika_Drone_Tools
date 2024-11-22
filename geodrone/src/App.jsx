// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapContainer from './components/MapContainer';
import Highbar from './components/Highbar'; // Импортируем Highbar
import PlaneManager from './components/PlaneManager';

const App = () => {
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/outdoors-v12');

  const handleStyleChange = (newStyle) => {
    setMapStyle(newStyle);
  };
  const handleStartFlight = () => {
    PlaneManager.addPlaneToFirstSphere();
    
    setTimeout(() => {
      PlaneManager.animatePlane();
  }, 2000);
};
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar handleStyleChange={handleStyleChange} onStartFlight={handleStartFlight} />
      {/* Передаем Highbar внутрь MapContainer */}
      <MapContainer mapStyle={mapStyle}>
        <Highbar /> {/* Highbar будет отображаться внизу карты */}
      </MapContainer>
    </div>
  );
};

export default App;
