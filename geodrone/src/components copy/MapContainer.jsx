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
  const exaggeration = 3;

  // Состояния для камеры
  const cameraState = useRef({
    center: [44.621762, 39.091278], // Начальное местоположение
    zoom: 20, // Начальный zoom
    pitch: 60, // Начальный pitch
    bearing: 41, // Начальный bearing
  });

  // Состояния для отображения координат и высоты
  const [coordinates, setCoordinates] = useState({ lng: 0, lat: 0, height: 0 });

  useEffect(() => {
    // Инициализация карты
    if (mapRef.current) {
      mapRef.current.remove();  // Удаляем старую карту перед созданием новой
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
      // Добавляем источник рельефа
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });

      // Настроим рельеф карты
      mapRef.current.setTerrain({
        source: 'mapbox-dem',
        exaggeration: exaggeration,  // Сильный рельеф
      });

      // Передаем карту с рельефом в SphereManager
      SphereManager.reinitialize(mapRef.current);
    });

    // Добавление управления картой
    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const onClick = (e) => {
      setSphereCoords([e.lngLat.lng, e.lngLat.lat]);
      setShowHeightInput(true);
    };

    mapRef.current.on('click', onClick);

    // Отслеживание перемещения мыши для отображения координат и высоты
    mapRef.current.on('mousemove', async (e) => {
      const lngLat = e.lngLat;
      const height = await mapRef.current.queryTerrainElevation([lngLat.lng, lngLat.lat]) / exaggeration;
      setCoordinates({
        lng: lngLat.lng.toFixed(5),
        lat: lngLat.lat.toFixed(5),
        height: height.toFixed(2),
      });
    });

    // Сохранение состояния камеры при каждом изменении
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

      {/* Добавляем блок для отображения координат и высоты */}
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
    </div>
  );
};

export default MapContainer;
