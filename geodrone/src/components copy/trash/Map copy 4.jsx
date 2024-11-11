// src/components/Map.jsx
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Threebox } from 'threebox-plugin';

const Map = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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
        
        // Инициализация Threebox после создания карты
        window.tb = new Threebox(
          mapRef.current,
          mapRef.current.getCanvas().getContext('webgl'),
          { defaultLights: true }
        );

        // Проверка наличия слоя перед его добавлением
        if (!mapRef.current.getLayer('custom_layer')) {
          mapRef.current.addLayer({
            id: 'custom_layer',
            type: 'custom',
            renderingMode: '3d',

            onAdd: function (map, mbxContext) {
              // Добавление сфер на карту
              window.tb.add(sphere(44.621762, 39.091278));
              window.tb.add(sphere(10.219287, 56.1675));
            },
            render: function (gl, matrix) {
              window.tb.update(); // Обновление Threebox
            }
          });
        }

        // Добавляем контролы карты
        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      });
    }

    // Функция для создания сферы
    const sphere = (lon, lat) => {
      let origin = [lon, lat, 20000];
      return window.tb.sphere({ color: 'red', material: 'MeshToonMaterial', radius: 10 }).setCoords(origin);
    };

    // Обработчик нажатия правой кнопки мыши
    const onMouseDown = (e) => {
      if (e.button === 2) { // правая кнопка мыши
        e.preventDefault();
        setIsDragging(true);
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    };

    // Обработчик движения мыши
    const onMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - startPos.x;
        const deltaY = e.clientY - startPos.y;

        const newBearing = mapRef.current.getBearing() + deltaX * 0.1; // изменяем bearing
        const newPitch = Math.max(Math.min(mapRef.current.getPitch() - deltaY * 0.1, 85), 0); // изменяем pitch

        mapRef.current.setBearing(newBearing);
        mapRef.current.setPitch(newPitch);
        setStartPos({ x: e.clientX, y: e.clientY });
      }
    };

    // Обработчик отпускания кнопки мыши
    const onMouseUp = () => {
      setIsDragging(false);
    };

    // Добавляем обработчики событий на карту
    mapRef.current.on('mousedown', onMouseDown);
    mapRef.current.on('mousemove', onMouseMove);
    mapRef.current.on('mouseup', onMouseUp);

    // Очистка обработчиков при размонтировании компонента
    return () => {
      if (mapRef.current) {
        mapRef.current.off('mousedown', onMouseDown);
        mapRef.current.off('mousemove', onMouseMove);
        mapRef.current.off('mouseup', onMouseUp);
      }
    };
  }, [mapStyle]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100vh' }} onContextMenu={(e) => e.preventDefault()} />;
};

export default Map;
