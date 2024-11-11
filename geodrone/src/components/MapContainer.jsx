import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SphereManager from './SphereManager';
import HeightInput from './HeightInput';
import Highbar from './Highbar'; // Импортируем Highbar

const MapContainer = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [showHeightInput, setShowHeightInput] = useState(false);
  const [sphereCoords, setSphereCoords] = useState(null);
  const [sphereHeight, setSphereHeight] = useState(100);
  const exaggeration = 3;
  const [routeCoordinates, setRouteCoordinates] = useState([]); // для высотного отображения

  const cameraState = useRef({
    center: [44.621762, 39.091278],
    zoom: 20,
    pitch: 60,
    bearing: 41,
  });

  const [coordinates, setCoordinates] = useState({ lng: 0, lat: 0, height: 0 });

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.remove();
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazhrOTlqMGJkNTJqcjF0MWZ2NWl0byJ9.TEG7Jvuty9-clulfpnEQUw';
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: cameraState.current.center,
      zoom: cameraState.current.zoom,
      pitch: cameraState.current.pitch,
      bearing: cameraState.current.bearing,
      antialias: true,
    });

    mapRef.current.on('style.load', () => {
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      mapRef.current.setTerrain({
        source: 'mapbox-dem',
        exaggeration: exaggeration,
      });

      SphereManager.reinitialize(mapRef.current);
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const onClick = (e) => {
      setSphereCoords([e.lngLat.lng, e.lngLat.lat]);
      setShowHeightInput(true);
    };

    mapRef.current.on('click', onClick);

    mapRef.current.on('mousemove', async (e) => {
      const lngLat = e.lngLat;
      const height = await mapRef.current.queryTerrainElevation([lngLat.lng, lngLat.lat]) / exaggeration;
      setCoordinates({
        lng: lngLat.lng.toFixed(5),
        lat: lngLat.lat.toFixed(5),
        height: height.toFixed(2),
      });
    });

    mapRef.current.on('moveend', () => {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      const pitch = mapRef.current.getPitch();
      const bearing = mapRef.current.getBearing();

      cameraState.current = {
        center: [center.lng, center.lat],
        zoom,
        pitch,
        bearing,
      };
    });

    return () => {
      mapRef.current.off('click', onClick);
      mapRef.current.off('mousemove');
    };
  }, [mapStyle]);

  const addSphere = async () => {
    if (sphereCoords) {
      await SphereManager.addSphere(mapRef.current, sphereCoords, sphereHeight, exaggeration);

      // Добавляем координаты новой сферы в маршрут
      setRouteCoordinates(prev => [...prev, [...sphereCoords, sphereHeight]]);
      
      setShowHeightInput(false);
      setSphereCoords(null);
      setSphereHeight(100);
    }
  };

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {showHeightInput && (
        <HeightInput 
          height={sphereHeight} 
          setHeight={setSphereHeight} 
          onAdd={addSphere} 
        />
      )}

      {/* Блок для отображения координат и высоты */}
      <div style={{
        position: 'absolute', 
        top: '10px', 
        right: '50px', 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        padding: '5px', 
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 100
      }}>
        <div>Longitude: {coordinates.lng}</div>
        <div>Latitude: {coordinates.lat}</div>
        <div>Elevation: {coordinates.height} m</div>
      </div>

      {/* Highbar внизу карты */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '25%',  // Задаем высоту Highbar
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        zIndex: 100,
      }}>
        <Highbar map={mapRef.current} routeCoordinates={routeCoordinates} />
      </div>
    </div>
  );
};

export default MapContainer;
