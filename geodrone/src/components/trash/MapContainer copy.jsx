import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SphereManager from './SphereManager';
import HeightInput from './HeightInput';

const MapContainer = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [showHeightInput, setShowHeightInput] = useState(false);
  const [sphereCoords, setSphereCoords] = useState(null);
  const [sphereHeight, setSphereHeight] = useState(100);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazhrOTlqMGJkNTJqcjF0MWZ2NWl0byJ9.TEG7Jvuty9-clulfpnEQUw';

    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [44.621762, 39.091278],
        zoom: 20,
        pitch: 60,
        bearing: 41,
        antialias: true,
      
      });

      mapRef.current.on('style.load', () => {
        mapRef.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14,
          });
          mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 5 });
        // Перезагружаем сферы при изменении стиля
        SphereManager.reinitialize(mapRef.current);
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    } else {
      mapRef.current.setStyle(mapStyle);
    }

    const onClick = (e) => {
      setSphereCoords([e.lngLat.lng, e.lngLat.lat]);
      setShowHeightInput(true);
    };

    mapRef.current.on('click', onClick);
    return () => mapRef.current.off('click', onClick);
  }, [mapStyle]);

  const addSphere = async () => {
    if (sphereCoords) {
      await SphereManager.addSphere(mapRef.current, sphereCoords, sphereHeight);
      setShowHeightInput(false);
      setSphereCoords(null);
      setSphereHeight(100);
    }
  };

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }}>
      {showHeightInput && (
        <HeightInput 
          height={sphereHeight} 
          setHeight={setSphereHeight} 
          onAdd={addSphere} 
        />
      )}
    </div>
  );
};

export default MapContainer;