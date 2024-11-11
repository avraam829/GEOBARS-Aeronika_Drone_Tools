import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Компонент для модального окна
const PointModal = ({ point, onSave, onClose }) => {
  const [altitude, setAltitude] = useState(0);

  const handleSave = () => {
    onSave({ ...point, altitude: parseFloat(altitude) });
    onClose();
  };

  return (
    <div className="modal">
      <h3>Добавить точку</h3>
      <p>Координаты: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
      <label>
        Высота (м):
        <input 
          type="number" 
          value={altitude} 
          onChange={(e) => setAltitude(e.target.value)} 
        />
      </label>
      <button onClick={handleSave}>Сохранить</button>
      <button onClick={onClose}>Отмена</button>
    </div>
  );
};

const Mapbox3D = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [points, setPoints] = useState([]); // Массив для хранения точек маршрута

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazU5cWM0MGFleDJrcXpoZDB3OXc3diJ9.o2RK-jj9fmTkY52r2sbdXg';

    if (mapRef.current) return; // Если карта уже создана

    // Инициализация карты
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      zoom: 14,
      center: [39.091278, 44.621762], // Центр карты
      pitch: 60, // Наклон камеры
      bearing: 41, // Угол поворота
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Стиль карты
    });

    mapRef.current.on('style.load', () => {
      // Добавляем модель рельефа (DEM) для 3D
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    });

    // Обработчик кликов на карте
    mapRef.current.on('click', (event) => {
      const { lng, lat } = event.lngLat;
      setClickedPoint({ lng, lat });
      setIsModalOpen(true); // Открываем модальное окно при клике на карту
    });

  }, []);

  // Сохранение точки с высотой
  const handleSavePoint = (point) => {
    // Добавляем точку в массив
    const newPoints = [...points, point];
    setPoints(newPoints);

    // Отрисовка линии маршрута на карте
    const geoJsonLine = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: newPoints.map(p => [p.lng, p.lat]), // Только координаты для линии
          },
        },
      ],
    };

    const geoJsonPoints = {
      type: 'FeatureCollection',
      features: newPoints.map((point) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat, point.altitude], // Координаты с высотой
        },
        properties: { altitude: point.altitude },
      })),
    };

    // Обновляем источник и слой линии маршрута
    if (mapRef.current.getSource('route')) {
      mapRef.current.getSource('route').setData(geoJsonLine);
    } else {
      mapRef.current.addSource('route', {
        type: 'geojson',
        data: geoJsonLine,
      });

      mapRef.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff0000',
          'line-width': 2,
        },
      });
    }

    // Обновляем источник и слой для точек
    if (mapRef.current.getSource('points')) {
      mapRef.current.getSource('points').setData(geoJsonPoints);
    } else {
      mapRef.current.addSource('points', {
        type: 'geojson',
        data: geoJsonPoints,
      });

      mapRef.current.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-color': '#007cbf',
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
    }
  };

  // Экспорт данных в формате GeoJSON
  const exportGeoJson = () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: points.map((point) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat, point.altitude], // Координаты с высотой
        },
        properties: { altitude: point.altitude },
      })),
    };

    const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'route.geojson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} />
      {isModalOpen && (
        <PointModal
          point={clickedPoint}
          onSave={handleSavePoint}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {points.length > 0 && (
        <button onClick={exportGeoJson} style={{ position: 'absolute', top: 10, right: 10 }}>
          Экспорт в GeoJSON
        </button>
      )}
    </>
  );
};

export default Mapbox3D;
