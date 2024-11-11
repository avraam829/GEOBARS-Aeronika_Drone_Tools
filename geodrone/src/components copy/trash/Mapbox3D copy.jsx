import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Компонент для модального окна
const PointModal = ({ point, onSave, onClose, position }) => {
  const [altitude, setAltitude] = useState(0);

  const handleSave = () => {
    onSave({ ...point, altitude: parseFloat(altitude) });
    onClose();
  };

  return (
    <div className="modal" style={{ position: 'absolute', left: position.x, top: position.y, backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '5px' }}>
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
  const [points, setPoints] = useState([]);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazhrOTlqMGJkNTJqcjF0MWZ2NWl0byJ9.TEG7Jvuty9-clulfpnEQUw';

    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      zoom: 14,
      center: [39.091278, 44.621762],
      pitch: 60,
      bearing: 41,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
    });

    mapRef.current.on('style.load', () => {
      mapRef.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      mapRef.current.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

      // Layer for 3D rectangle (example)
      mapRef.current.addSource('3d-floating-rectangle', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [39.091278, 44.621762],
                [39.092278, 44.621762],
                [39.092278, 44.622762],
                [39.091278, 44.622762],
                [39.091278, 44.621762],
              ]],
            },
          }],
        },
      });

      mapRef.current.addLayer({
        id: '3d-floating-rectangle-layer',
        type: 'fill-extrusion',
        source: '3d-floating-rectangle',
        paint: {
          'fill-extrusion-color': '#ff0000',
          'fill-extrusion-height': 1500,
          'fill-extrusion-base': 1000,
          'fill-extrusion-opacity': 0.8,
        },
      });
    });

    mapRef.current.on('click', (event) => {
      const { lng, lat } = event.lngLat;
      setClickedPoint({ lng, lat });
      setModalPosition({ x: event.originalEvent.clientX, y: event.originalEvent.clientY });
      setIsModalOpen(true);
    });

  }, []);

  const handleSavePoint = (point) => {
    const newPoints = [...points, point];
    setPoints(newPoints);

    const geoJsonLine = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: newPoints.map(p => [p.lng, p.lat, p.altitude]), // Use altitude
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
          coordinates: [point.lng, point.lat, point.altitude], // Use altitude
        },
        properties: { altitude: point.altitude },
      })),
    };

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
          'line-opacity': 0.7,
        },
      });
    }

    // Add points to the map in 3D
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

      // Add 3D representation of the points
      newPoints.forEach(point => {
        mapRef.current.addSource(`point-${point.lng}-${point.lat}`, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [point.lng, point.lat, point.altitude],
              },
              properties: { altitude: point.altitude },
            }],
          },
        });

        mapRef.current.addLayer({
          id: `point-${point.lng}-${point.lat}-layer`,
          type: 'fill-extrusion',
          source: `point-${point.lng}-${point.lat}`,
          paint: {
            'fill-extrusion-color': '#007cbf',
            'fill-extrusion-height': point.altitude,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.8,
          },
        });
      });
    }
  };

  const exportGeoJson = () => {
    const geoJsonData = {
      type: 'FeatureCollection',
      features: points.map((point) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat, point.altitude],
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
          position={modalPosition}
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
