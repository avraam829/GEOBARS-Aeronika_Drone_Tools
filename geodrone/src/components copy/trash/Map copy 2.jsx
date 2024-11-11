// src/components/Map.jsx
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const Map = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tbRef = useRef(null); // Ref to hold the Threebox instance

  useEffect(() => {
    const accessToken = 'pk.eyJ1IjoiYW5kZXJzLWhvZWRob2x0IiwiYSI6ImNqNDlyMDFwZzBvMHgyeHBnazQwY2pieGsifQ.FCtWmm4xtFPeKQB33CeMeQ';
    mapboxgl.accessToken = accessToken;

    // Initialize the map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      zoom: 14.5,
      center: [10.224666, 56.1654],
      pitch: 60,
      bearing: 270,
      antialias: true,
    });

    // Load Threebox and add layers when the style is loaded
    mapRef.current.on('style.load', () => {
      // Initialize Threebox
      if (!window.Threebox) {
        console.error('Threebox is not loaded!');
        return;
      }

      tbRef.current = new window.Threebox(
        mapRef.current,
        mapRef.current.getCanvas().getContext('webgl'),
        { defaultLights: true }
      );

      // Add a custom layer if it doesn't already exist
      if (!mapRef.current.getLayer('custom_layer')) {
        mapRef.current.addLayer({
          id: 'custom_layer',
          type: 'custom',
          renderingMode: '3d',
          onAdd: (map, mbxContext) => {
            // Add spheres using tbRef
            tbRef.current.add(createSphere(10.225531, 56.165746));
            tbRef.current.add(createSphere(10.219287, 56.1675));
          },
          render: (gl, matrix) => {
            tbRef.current.update();
          },
        });
      }
    });

    return () => {
      // Cleanup on component unmount
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Function to create a sphere
  const createSphere = (lon, lat) => {
    const origin = [lon, lat, 0];
    return tbRef.current
      .sphere({ color: 'red', material: 'MeshToonMaterial' })
      .setCoords(origin);
  };

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Map;
