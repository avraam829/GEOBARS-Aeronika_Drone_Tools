import { Threebox } from 'threebox-plugin';
import MapContainer from './MapContainer';

const SphereManager = {
  spheres: [], // Массив для хранения сфер

  initialize(map) {
    if (window.tb) {
        window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), { defaultLights: true });
        console.log("Three app sucscess")
      }
    if (!window.tb) {
      window.tb = new Threebox(map, map.getCanvas().getContext('webgl'), { defaultLights: true });
      console.log("Three app sucscess")
    }
    if (!map.getLayer('mapbox-dem')) {
      map.addLayer({
        id: 'mapbox-dem',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          // Инициализация на старте
        },
        render: function () {
          window.tb.update(); // Обновление 3D объектов
        },
      });
    }
  },

  async addSphere(map, coords, height, exaggeration) {
    //this.initialize(map);

    const [lon, lat] = coords;
    const terrainHeight = await map.queryTerrainElevation(coords)/exaggeration || 0;
    console.log(terrainHeight/exaggeration)
    
    // Создаем сферу с дополнительными параметрами
    const sphere = window.tb.sphere({ 
      color: 'red', 
      material: 'MeshToonMaterial', 
      radius: 0.5, 
    }).setCoords([lon, lat, height + exaggeration*terrainHeight]);
    const groundAlt = height + exaggeration*terrainHeight
    // Добавляем сферу в Threebox
    window.tb.add(sphere);
    const line_segment = tb.line({
        geometry: [
            [44.6074297789038, 39.0839108787684, 10000],
            [44.6138729820611, 39.0943404011886, 12000],
        ],
        color: '#dd0000',
        width: 4,
        opacity: 1
    });
    window.tb.add(line_segment)

    // Добавляем в массив для дальнейшего управления
    this.spheres.push(sphere);

    // Логирование для отладки
    console.log("Sphere added:", sphere);
    console.log("All spheres:", this.spheres);

    // Попробуем сохранить точку на сервер
    try {
      const response = await fetch('http://127.0.0.1:5000/api/save_point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lng: lon, lat: lat, alt: groundAlt, routeId: 1, numPoint: 1 }),
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

  reinitialize(map) {
    // Переинициализация Threebox и добавление всех сфер
    this.initialize(map);
    this.spheres.forEach(sphere => window.tb.add(sphere));
    console.log("Reinitialized all spheres:", this.spheres);
  }
};

export default SphereManager;
