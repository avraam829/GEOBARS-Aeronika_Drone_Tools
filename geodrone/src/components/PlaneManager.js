// PlaneManager.js
import SphereManager from './SphereManager';

const PlaneManager = {
  planeModel: null,

  async addPlaneToFirstSphere() {
    if (SphereManager.spheres.length === 0) {
      console.error("No spheres available to add the plane model.");
      return;
    }

    const firstSphere = SphereManager.spheres[0];
    const [lon, lat, alt] = firstSphere.coordinates;
    const scale = 50;

    const options = {
      obj: '/drone_samolet.glb',
      type: 'gltf',
      scale: { x: scale, y: scale, z: scale },
      units: 'meters',
      rotation: { x: 90, y: 0, z: 0 },
      anchor: 'center'
    };

    window.tb.loadObj(options, (model) => {
      this.planeModel = model.setCoords([lon, lat, alt]);
      window.tb.add(this.planeModel);
      console.log("Plane model added successfully at the first sphere's position.");
    });
  },

  animatePlane() {
    if (!this.planeModel || SphereManager.spheres.length < 2) return;

    let currentIndex = 0;

    const moveToNextPoint = () => {
      if (currentIndex >= SphereManager.spheres.length - 1) {
        this.removePlane(); // Remove the plane model after reaching the last point
        return;
      }

      const startCoords = SphereManager.spheres[currentIndex].coordinates;
      const endCoords = SphereManager.spheres[currentIndex + 1].coordinates;
      const duration = 2000; // milliseconds
      let startTime = null;

      const animateStep = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        const lon = startCoords[0] + (endCoords[0] - startCoords[0]) * progress;
        const lat = startCoords[1] + (endCoords[1] - startCoords[1]) * progress;
        const alt = startCoords[2] + (endCoords[2] - startCoords[2]) * progress; // Above ground

        this.planeModel.setCoords([lon, lat, alt]);

        // Calculate the angle for the plane to face the target
        const deltaLon = endCoords[0] - startCoords[0];
        const deltaLat = endCoords[1] - startCoords[1];
        const angle = Math.atan2(deltaLat, deltaLon);
        this.planeModel.setRotation({ x: 0, y: 0, z: (angle * 180) / Math.PI });

        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          currentIndex++;
          moveToNextPoint();
        }
      };

      requestAnimationFrame(animateStep);
    };

    moveToNextPoint();
  },

  removePlane() {
    if (this.planeModel) {
      window.tb.remove(this.planeModel);
      this.planeModel = null;
      console.log("Plane model removed after completing the flight.");
    }
  }
};

export default PlaneManager;
