import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SphereManager from './SphereManager';
import TowerManager from './TowerManager';
import HeightInput from './HeightInput';
import HeightInputTower from './HeightInputTower';
import Highbar from './Highbar'; // Импортируем Highbar
import Rangetotower from './Rangetotower';


const MapContainer = ({ mapStyle }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [showHeightInput, setShowHeightInput] = useState(false);
  const [showHeightInputTower, setShowHeightInputTower] = useState(false);
  const [sphereCoords, setSphereCoords] = useState(null);
  const [towerCoords, setTowerCoords] = useState(null);
  const [sphereHeight, setSphereHeight] = useState(200);
  const [towerHeight, setTowerHeight] = useState(50);
  const exaggeration = 3;
  const [routeCoordinates, setRouteCoordinates] = useState([]); // для высотного отображения
  const [isAddingSpheres, setIsAddingSpheres] = useState(false);
  const [isAddingTowers, setIsAddingTowers] = useState(false);
  const [bestTowerData, setBestTowerData] = useState(null)
  const [map, setMap] = useState(null);


  const isAddingSpheresRef = useRef(isAddingSpheres);
  const isAddingTowersRef = useRef(isAddingTowers); // Ref to track the current state of isAddingSpheres
  useEffect(() => {
    isAddingSpheresRef.current = isAddingSpheres;
    isAddingTowersRef.current = isAddingTowers;
  }, [isAddingSpheres],[isAddingTowers]);
   // Ref to track the current state of isAddingSpheres
  const toggleAddSpheres = () => {
    if (isAddingTowers) {
      setIsAddingTowers(false);  // Отключаем режим башен
    }
    setIsAddingSpheres(prev => !prev);  // Переключаем режим точек
  };

  const toggleAddTowers = () => {
    if (isAddingSpheres) {
      setIsAddingSpheres(false);  // Отключаем режим точек
    }
    setIsAddingTowers(prev => !prev);  // Переключаем режим башен
  };
  const cameraState = useRef({
    center: [92.84690, 55.93961],
    zoom: 10,
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
      //TowerManager.reinitialize(mapRef.current);
      SphereManager.reinitialize(mapRef.current);
      //Reinitialize.initialize(mapRef.current);
      
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    
    const onClick = (e) => {
      const actions = {
        addSphere: () => {
          setSphereCoords([e.lngLat.lng, e.lngLat.lat]);
          setShowHeightInput(true);
        },
        addTower: () => {
          console.log("Вышки");
          setTowerCoords([e.lngLat.lng, e.lngLat.lat]);
          setShowHeightInputTower(true);
        },
      };
    
      // Определяем, какой action выполнить
      const currentAction = isAddingSpheresRef.current ? 'addSphere' :
                            isAddingTowersRef.current ? 'addTower' :
                            null;
    
      // Выполняем action, если он определен
      if (currentAction && actions[currentAction]) {
        actions[currentAction]();
      }
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

    // Обновляем размеры карты при изменении размеров контейнера
    let resizeTimeout;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    
      // Откладываем вызов resize на 300 мс (время анимации панели)
      resizeTimeout = setTimeout(() => {
        mapRef.current.resize();
      }, 300);
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      mapRef.current.off('click', onClick);
      mapRef.current.off('mousemove');
      resizeObserver.disconnect(); // Останавливаем наблюдатель за изменениями
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
  const addTower = async () => {
    if (towerCoords) {
      await TowerManager.addTower(mapRef.current, towerCoords, towerHeight, exaggeration);

      // Добавляем координаты новой сферы в маршрут
      //setRouteCoordinates(prev => [...prev, [...towerCoords, towerHeight]]);
      
      setShowHeightInputTower(false);
      setTowerCoords(null);
      setTowerHeight(50);
    }
  };
  useEffect(() => {
    // Обработчик обновления данных о лучшей вышке
    Rangetotower.onBestTowerUpdate = (data) => {
      if (data) {
        setBestTowerData(data); // Обновляем данные о лучшей вышке
      } else {
        setBestTowerData(null); // Сбрасываем данные, если сигнал пропал
      }
    };
  
    return () => {
      Rangetotower.onBestTowerUpdate = null; // Удаляем callback при размонтировании
    };
  }, []);

  return (
    
    <div ref={mapContainerRef} style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Информация о лучшей вышке */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '200px',
          width: '200px',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: bestTowerData ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          fontSize: '14px',
          zIndex: 1000,
        }}
      >
        {bestTowerData ? (
          <>
            <p><strong>Вышка №:</strong> {bestTowerData.towerId}</p>
            <p><strong>Сигнал:</strong> {bestTowerData.signal}</p>
            <p><strong>Шум:</strong> {bestTowerData.noise}</p>
          </>
        ) : (
          <p>Нет сигнала</p>
        )}
      </div>
      {showHeightInput && (
        <HeightInput 
          height={sphereHeight} 
          setHeight={setSphereHeight} 
          onAdd={addSphere} 
        />
      )}
      {showHeightInputTower && (
        <HeightInputTower 
          signalPower={towerHeight} 
          setHeightTower={setTowerHeight} 
          onAdd={addTower} 
        />
      )}
      <button 
  onClick={() => toggleAddSpheres(prev => !prev)}
  style={{
    position: 'absolute',
    top: '200px',
    left: '10px',
    zIndex: 1000,
    padding: '10px 20px',
    backgroundColor: isAddingSpheres ? 'red' : 'green',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }}
>
  {isAddingSpheres ? 'Режим добавления точек вкл' : 'Режим добавления точек выкл'}
</button>
<button 
  onClick={() => toggleAddTowers(prev => !prev)}
  style={{
    position: 'absolute',
    top: '240px',
    left: '10px',
    zIndex: 1000,
    padding: '10px 20px',
    backgroundColor: isAddingTowers ? 'red' : 'green',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  }}
>
  {isAddingTowers ? 'Режим добавления вышек вкл' : 'Режим добавления вышек выкл'}
</button>
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
      <Highbar map={mapRef.current} routeCoordinates={routeCoordinates} />
    </div>
    
  );
};

export default MapContainer;
