import { Threebox } from 'threebox-plugin';
import MapContainer from './MapContainer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import PlaneManager from './PlaneManager';
import TowerManager from './TowerManager';


const exaggerationn = 3;
const SphereManager = {
  spheres: [], // Массив для хранения сфер
  line: null, // Переменная для хранения линии

  
  initialize(map) {
    if (window.tb) {
        window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), { defaultLights: true });
        
        console.log("Three app success")
    }
    if (!window.tb) {
      window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), { defaultLights: true });
      console.log("Three app success")
    }
    if (!map.getLayer('mapbox-dem')) {
      
      map.addLayer({
        id: 'mapbox-dem',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {},
        render: function () {
          window.tb.update(); // Обновление 3D объектов
        },
      });
    }
  },

  async addSphere(map, coords, height, exaggeration) {
    const [lon, lat] = coords;
    const terrainHeight = await map.queryTerrainElevation(coords) / exaggeration || 0;
    const groundAlt = height + exaggeration * terrainHeight;
    const sphereRadius = 0.5;
    // Создаем сферу
    const sphere = window.tb.sphere({
      color: 'red',
      material: 'MeshToonMaterial',
      radius: sphereRadius,
    }).setCoords([lon, lat, groundAlt]);
    sphere.translateZ(-sphereRadius);
    sphere.translateY(+sphereRadius);
    sphere.translateX(+sphereRadius);
    /*
    const scale = 30;
    const options = {
        obj: '/Radio_tower.glb',  
        type: 'gltf',
        scale: { x: scale, y: scale, z: scale },
        units: 'meters',
        rotation: { x: 90, y: -90, z: 0 },
        anchor: 'center'
    };
    window.tb.loadObj(options, (model) => {
      const modelInstance = model.setCoords([lon, lat, groundAlt]);
      modelInstance.setRotation({ x: 0, y: 0, z: 241 });
      window.tb.add(modelInstance);
      console.log("Model added successfully");
    });
    const options2 = {
        obj: '/drone_samolet.glb',  
        type: 'gltf',
        scale: { x: scale, y: scale, z: scale },
        units: 'meters',
        rotation: { x: 90, y: -90, z: 0 },
        anchor: 'center'
    };
    window.tb.loadObj(options2, (model) => {
      const modelInstance = model.setCoords([lon, lat, groundAlt+1000]);
      modelInstance.setRotation({ x: 0, y: 0, z: 241 });
      window.tb.add(modelInstance);
      console.log("Model added successfully");
    });
    */


    window.tb.add(sphere);
    this.spheres.push(sphere);

    // Обновляем линию, соединяющую сферы
    this.updateLine();

    console.log("Sphere added:", sphere);
    console.log("All spheres:", this.spheres);

    // Сохранение точки на сервер
    try {
      const response = await fetch('http://127.0.0.1:5000/api/save_point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lng: lon, lat: lat, alt: groundAlt/exaggerationn, routeId: 1, numPoint: 1 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        return;
      }

      const result = await response.json();
      if (result.status === 'success') {
        console.log("Point saved successfully:", { lon, lat, height });
      } else {
        console.error("Error saving point:", result.message);
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    }
  },

  updateLine() {
    // Удаляем старую линию, если она существует
    if (this.line) {
      window.tb.remove(this.line);
    }

    // Если в массиве сфер меньше двух точек, линию строить не нужно
    if (this.spheres.length < 2) return;

    // Создаем массив координат из всех сфер
    const lineCoordinates = this.spheres.map(sphere => sphere.coordinates);

    // Создаем новую линию, соединяющую все сферы
    this.line = window.tb.line({
      geometry: lineCoordinates,
      color: '#dd0000',
      width: 2,
      opacity: 0.5,
    });

    // Добавляем линию на карту
    window.tb.add(this.line);

    let length = 0;
    for (let i = 1; i < lineCoordinates.length; i++) {
        const [x1, y1, z1] = lineCoordinates[i - 1];
        const [x2, y2, z2] = lineCoordinates[i];
        const segmentLength = Math.sqrt(
            Math.pow(x2 - x1, 2) +
            Math.pow(y2 - y1, 2) +
            Math.pow(z2 - z1, 2)
        );
        length += segmentLength;
      }

      // Вывод длины линии в консоль
      console.log(`Line length: ${length.toFixed(2)} units`);
  },

  reinitialize(map) {
    this.initialize(map);
    this.spheres.forEach(sphere => window.tb.add(sphere));
    this.updateLine();
    console.log("Reinitialized all spheres:", this.spheres);
    TowerManager.towers.forEach(towers => window.tb.add(towers));
    TowerManager.trid.forEach(trid => window.tb.add(trid));
  },
  
  deleteRoute() {
    // Очищаем массивы
    this.spheres = [];
    TowerManager.towers = [];
    TowerManager.trid = [];
  
    // Удаляем объекты с карты
    if (this.line) {
      window.tb.remove(this.line);
      this.line = null;
    }
    
    console.log("Маршрут и объекты удалены");
  
    // Вызываем reinitialize для обновления карты
    this.reinitialize(window.tb.map);
  }
};

export default SphereManager;
