import React, { useEffect, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf'; // Для работы с геометрией
import SphereManager from './SphereManager';

const PolygonManager = ({ map, onClose }) => {
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [draw, setDraw] = useState(null);
  const [routes, setRoutes] = useState([]);

  const exaggeration = 3; // Используемое преувеличение

  useEffect(() => {
    if (!map) {
      console.error('Карта не передана в PolygonManager');
      return;
    }

    // Инициализация MapboxDraw
    const drawInstance = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
      defaultMode: 'draw_polygon',
    });

    setDraw(drawInstance);
    map.addControl(drawInstance);

    const handleMapClick = (e) => {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      const newCoords = [...polygonCoords, coords];
      setPolygonCoords(newCoords);

      const polygonFeature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [newCoords.length > 2 ? [...newCoords, newCoords[0]] : []], // Замыкаем полигон
        },
        properties: {},
      };

      const data = drawInstance.getAll();
      if (data.features.length > 0) {
        drawInstance.deleteAll(); // Удаляем старые временные полигоны
      }

      drawInstance.add(polygonFeature); // Добавляем новый временный полигон
    };

    const generateFlightRoutes = (polygonCoords, numRoutes) => {
      const polygon = turf.polygon([polygonCoords]);
      const bbox = turf.bbox(polygon); // Получение границ полигона

      const routes = [];
      const [minX, minY, maxX, maxY] = bbox;
      const step = (maxX - minX) / (numRoutes + 1); // Расстояние между линиями маршрутов

      for (let i = 1; i <= numRoutes; i++) {
        const x = minX + step * i;

        const routeLine = turf.lineString([
          [x, minY],
          [x, maxY],
        ]);

        const clippedRoute = turf.lineIntersect(routeLine, polygon);
        if (clippedRoute.features.length >= 2) {
          routes.push(clippedRoute.features.map(f => f.geometry.coordinates));
        }
      }

      return routes; // Возвращаем массив маршрутов
    };

    const handleRightClick = async (e) => {
      e.preventDefault(); // Предотвращаем контекстное меню

      if (polygonCoords.length > 2) {
        const finalPolygon = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[...polygonCoords, polygonCoords[0]]], // Замыкаем полигон
          },
        };

        drawInstance.add(finalPolygon); // Завершаем полигон

        const generatedRoutes = generateFlightRoutes([...polygonCoords, polygonCoords[0]], 10); // 10 маршрутов
        setRoutes(generatedRoutes);

        // Вызов addSphere для каждой точки в маршрутах
        for (const route of generatedRoutes) {
          for (const [lon, lat] of route) {
            const height = 100; // Установите высоту
            await SphereManager.addSphere(map, [lon, lat], height, exaggeration);
          }
        }

        console.log('Маршруты с добавлением сфер:', generatedRoutes);
      } else {
        console.warn('Недостаточно точек для полигона');
      }

      drawInstance.deleteAll();
      setPolygonCoords([]);
      onClose();
    };

    map.on('click', handleMapClick);
    map.on('contextmenu', handleRightClick); // Слушаем правый клик мыши

    return () => {
      map.off('click', handleMapClick);
      map.off('contextmenu', handleRightClick);
      map.removeControl(drawInstance);
    };
  }, [map, polygonCoords, onClose]);

  return (
    <div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
        }}
      >
        <p style={{ margin: 0 }}>Левый клик — добавление точки, правый клик — завершение ввода.</p>
        {polygonCoords.length > 0 && (
          <p style={{ margin: 0 }}>
            Точек в полигоне: <strong>{polygonCoords.length}</strong>
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '160px',
          right: '1190px',
          padding: '10px 20px',
          backgroundColor: 'red',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          zIndex: 1000,
        }}
      >
        Закрыть
      </button>
    </div>
  );
};

export default PolygonManager;
