// src/components/Map.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Threebox } from 'threebox-plugin';

const Map = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [showHeightInput, setShowHeightInput] = useState(false);
  const [sphereCoords, setSphereCoords] = useState(null);
  const [sphereHeight, setSphereHeight] = useState(100);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazhrOTlqMGJkNTJqcjF0MWZ2NWl0byJ9.TEG7Jvuty9-clulfpnEQUw';

    if (mapRef.current) {
      mapRef.current.setStyle(mapStyle);
    } else {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current, 
        style: mapStyle,
        center: [44.621762, 39.091278],
        zoom: 20,
        antialias: true,
        pitch: 60,
        bearing: 41,
      });

      mapRef.current.on('style.load', () => {
        mapRef.current.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14,
        });
        mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 5 });

        // Initialize Threebox
        window.tb = new Threebox(
          mapRef.current,
          mapRef.current.getCanvas().getContext('webgl'),
          { defaultLights: true }
        );

        // Add custom 3D layer for Threebox
        if (!mapRef.current.getLayer('custom_layer')) {
          mapRef.current.addLayer({
            id: 'custom_layer',
            type: 'custom',
            renderingMode: '3d',
            onAdd: function () {
              // Initial spheres can be added here if needed
            },
            render: function () {
              window.tb.update();
            }
          });
        }

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      });
    }

    const onLeftClick = (e) => {
      const { lng, lat } = e.lngLat;
      setSphereCoords([lng, lat]);
      setShowHeightInput(true);
    };

    mapRef.current.on('click', onLeftClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off('click', onLeftClick);
      }
    };
  }, [mapStyle]);

  const createSphere = useCallback((lon, lat, height) => {
    let origin = [lon, lat, height];
    console.log("Creating sphere at coordinates:", origin);
    return window.tb.sphere({ color: 'red', material: 'MeshToonMaterial', radius: 3 }) // Радиус увеличен для видимости
      .setCoords(origin);
  }, []);

  const addSphere = () => {
    if (sphereCoords && window.tb) {
      const [lon, lat] = sphereCoords;
      const sphere = createSphere(lon, lat, sphereHeight);
      if (sphere) {
        window.tb.add(sphere);
        console.log("Sphere added successfully at", { lon, lat, height: sphereHeight });
      } else {
        console.error("Failed to create sphere");
      }
      setShowHeightInput(false);
      setSphereCoords(null);
      setSphereHeight(100);
    } else {
      console.error("Sphere coordinates or Threebox instance not available");
    }
  };

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} onContextMenu={(e) => e.preventDefault()}>
      {showHeightInput && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', zIndex: 1000,
          borderRadius: '5px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <label>
            Высота:
            <input 
              type="number" 
              value={sphereHeight} 
              onChange={(e) => setSphereHeight(parseFloat(e.target.value))} 
              style={{ marginLeft: '5px', width: '60px' }} 
            />
          </label>
          <button onClick={addSphere} style={{ marginLeft: '10px' }}>Добавить сферу</button>
        </div>
      )}
    </div>
  );
};

export default Map;
