import { Threebox } from 'threebox-plugin';
import MapContainer from './MapContainer';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import PlaneManager from './PlaneManager';

const exaggerationn = 3;
const TowerManager = {
  towers: [],
  trid: [], // Массив для хранения сфер

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

  async addTower(map, coords, signalPower, exaggeration) {
    const [lon, lat] = coords;
    const terrainHeight = await map.queryTerrainElevation(coords) / exaggeration || 0;
    const groundAlt = exaggeration * terrainHeight;
    const sphereRadius = signalPower;
    const sizer = 4 // чтоб не париться
    // Создаем сферу
    const sphere = window.tb.sphere({
        color: 'blue', // Синий цвет
        material: 'MeshBasicMaterial',
        radius: sphereRadius,
        wireframe: true,
        transparent: true,
        opacity: 0.3, // Включение отображения только сетки
      }).setCoords([lon, lat, groundAlt + 90 * sizer]);
      
      // Дополнительные трансформации (если нужны)
      sphere.translateZ(-sphereRadius);
      sphere.translateY(+sphereRadius);
      sphere.translateX(+sphereRadius);
      
      // Добавляем сферу в Threebox
      window.tb.add(sphere);
    const scale = 3;
    const options = {
        obj: '/Radio_tower.glb',  
        type: 'gltf',
        scale: { x: scale*sizer, y: scale*sizer, z: scale*sizer },
        units: 'meters',
        rotation: { x: 90, y: -90, z: 0 },
        anchor: 'center'
    };
    window.tb.loadObj(options, (model) => {
      const modelInstance = model.setCoords([lon, lat, groundAlt]);
      modelInstance.setRotation({ x: 0, y: 0, z: 241 });
      window.tb.add(modelInstance);
      this.trid.push(modelInstance);
      
      console.log("Model added successfully");
      
    });
    //this.createWaveAnimation(map, coords, groundAlt, signalPower, scale,sizer);
    

    window.tb.add(sphere);
    this.towers.push(sphere);
    

    // Обновляем линию, соединяющую сферы
    const radio_power = signalPower
    
    




    console.log("Sphere added:", sphere);
    console.log("All towers:", this.towers);

    // Сохранение точки на сервер
    try {
      const response = await fetch('http://127.0.0.1:5000/api/save_tower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lng: lon, lat: lat, power: radio_power, TowerId: 1, numTower: 1 }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        return;
      }

      const result = await response.json();
      if (result.status === 'success') {
        console.log("НАКОНЕЦТОГОСПАДИДАСЭЙВЕДСАКСЕСФУЛИ saved successfully:", { lon, lat, signalPower });
      } else {
        console.error("БЛБЛБЛБЛБЛБЛБЛБЛЬБЛБЛБЛБError saving point:", result.message);
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
    }
  },

  reinitialize(map) {
    this.initialize(map);
    this.towers.forEach(towers => window.tb.add(towers));
    this.trid.forEach(trid => window.tb.add(trid));
    console.log("Reinitialized all powers:", this.towers);
    console.log("Reinitialized all towers:", this.trid);
  }
};

export default TowerManager;
