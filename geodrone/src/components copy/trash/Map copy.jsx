// src/components/Map.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazhrOTlqMGJkNTJqcjF0MWZ2NWl0byJ9.TEG7Jvuty9-clulfpnEQUw';

    if (mapRef.current) {
      mapRef.current.setStyle(mapStyle); // Меняем стиль карты, если карта уже существует
    } else {
      // Инициализируем карту
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [44.621762, 39.091278],
        zoom: 10,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right'); // Контролы
    }
  }, [mapStyle]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Map;