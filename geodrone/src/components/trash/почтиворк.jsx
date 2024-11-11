import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as THREE from 'three';
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
  const threeSceneRef = useRef();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedPoint, setClickedPoint] = useState(null);
  const [points, setPoints] = useState([]);
  const sphereRef = useRef();
  const rendererRef = useRef();
  const mousePosition = useRef({ x: 0, y: 0 });
  const isMouseDown = useRef(false); // Состояние нажатия мыши
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
  // Mapbox инициализация
  mapboxgl.accessToken = 'pk.eyJ1IjoiYXJ0ZW1hdnIiLCJhIjoiY20yazU5cWM0MGFleDJrcXpoZDB3OXc3diJ9.o2RK-jj9fmTkY52r2sbdXg';
  
  if (mapRef.current) return;

  mapRef.current = new mapboxgl.Map({
    container: mapContainerRef.current,
    zoom: 2,
    center: [0, 0],
    pitch: 60,
    bearing: 0,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
  });

  const initThreeJS = () => {
    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 19, 300); // Изначальная позиция камеры
    const geometry = new THREE.SphereGeometry(30, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x800080,
      wireframe: true,
    });

    const sphere = new THREE.Mesh(geometry, material);
    sphereRef.current = sphere;
    scene.add(sphere);

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none';
    mapContainerRef.current.appendChild(renderer.domElement);

    rendererRef.current = renderer;

    // Привязка вращения сферы к карте
    const syncSphereWithMap = () => {
      const mapBearing = mapRef.current.getBearing(); // Берем вращение карты (bearing)
      const mapPitch = mapRef.current.getPitch(); // Берем угол карты (pitch)

      // Связываем долготу с осью Y (bearing - вращение карты)
      sphere.rotation.y = THREE.MathUtils.degToRad(-mapBearing);

      // Связываем широту с осью X (pitch - наклон карты)
      sphere.rotation.x = THREE.MathUtils.degToRad(mapPitch - 90); // 90 для привязки к экватору
    };

    mapRef.current.on('rotate', syncSphereWithMap); // Вращение карты
    mapRef.current.on('pitch', syncSphereWithMap);  // Изменение угла наклона карты

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };

    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    animate();
  };

  initThreeJS();

  // Событие клика по карте для добавления точки
  mapRef.current.on('click', (event) => {
    const { lng, lat } = event.lngLat;
    setClickedPoint({ lng, lat });
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
            coordinates: newPoints.map(p => [p.lng, p.lat]),
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
          coordinates: [point.lng, point.lat, point.altitude],
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
        },
      });
    }

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
