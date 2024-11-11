// src/App.jsx
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import Mapbox3D from './components/Mapbox3D';

const App = () => {
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/satellite-v9'); // Стиль по умолчанию
  const [is3D, setIs3D] = useState(false); // Переключатель для 3D карты

  const handleStyleChange = (newStyle) => {
    if (newStyle === 'mapbox://styles/mapbox/outdoors-v11') {
      setIs3D(true); // Переходим на 3D карту
    } else {
      setIs3D(false);
      setMapStyle(newStyle); // Меняем стиль карты
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar handleStyleChange={handleStyleChange} />
      {is3D ? <Mapbox3D /> : <Map mapStyle={mapStyle} />}
    </div>
  );
};

export default App;
