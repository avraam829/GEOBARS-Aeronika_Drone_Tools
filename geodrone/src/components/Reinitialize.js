import MapContainer from './MapContainer';
import TowerManager from './TowerManager';
import SphereManager from './SphereManager';

const Reinitialize = {
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

        TowerManager.towers.forEach(towers => window.tb.add(towers));
        TowerManager.trid.forEach(trid => window.tb.add(trid));
        SphereManager.spheres.forEach(sphere => window.tb.add(sphere));
        SphereManager.updateLine();
      },




};

export default Reinitialize;