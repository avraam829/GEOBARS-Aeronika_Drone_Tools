import PlaneManager from './PlaneManager';

let count = 0; // Для отслеживания количества вышек
let distanceInterval = null; // Интервал для периодического вычисления расстояний
let planeAlt = 0; // Текущая высота самолета
let planeLon = 0;
let planeLat = 0;

const Rangetotower = {
  DataTowers: [],
  onBestTowerUpdate: null, // Callback для передачи данных о лучшей вышке

  radiocheck(lon, lat, signalPower, fortowersf) {
    count += 1;
    this.DataTowers.push({ lon, lat, signalPower, count, fortowersf });
    console.log("Тест передачи: ", this.DataTowers);
  },

  updatePlaneAlt(alt, lon, lat) {
    planeAlt = alt;
    planeLon = lon;
    planeLat = lat; // Обновляем высоту самолета
  },

  startTracking() {
    if (!PlaneManager.planeModel) {
      console.error("Plane model not initialized. Cannot start tracking distances.");
      return;
    }
  
    const towersInRange = new Map(); // Хранение вышек с их текущим сигналом
    let lastBestTower = null; // Для отслеживания последней лучшей вышки
  
    distanceInterval = setInterval(() => {
      if (!PlaneManager.planeModel) {
        console.warn("Plane model removed, stopping distance tracking.");
        this.stopTracking();
        return;
      }
  
      let bestTower = null;
  
      this.DataTowers.forEach((tower) => {
        const { lon, lat, signalPower, count } = tower;
  
        // Вычисление расстояния между БПЛА и вышкой
        const distance = Math.sqrt(
          Math.pow(lon - planeLon, 2) +
          Math.pow(lat - planeLat, 2)
        ) * 4166;
  
        if (distance <= signalPower) {
          // Расчет сигнала
          const signal = ((distance / signalPower) * -120);
  
          towersInRange.set(count, { ...tower, signal, distance });
  
          if (!bestTower || signal > bestTower.signal) {
            bestTower = { ...tower, signal, noise: (signal * -1).toFixed(2), distance };
          }
        } else {
          if (towersInRange.has(count)) {
            towersInRange.delete(count); // Убираем вышку из диапазона
          }
        }
      });
  
      if (bestTower) {
        // Всегда обновляем, даже если ID вышки не изменился
        if (
          !lastBestTower ||
          lastBestTower.towerId !== bestTower.count ||
          lastBestTower.signal !== bestTower.signal
        ) {
          lastBestTower = { towerId: bestTower.count, signal: bestTower.signal.toFixed(2), noise: bestTower.noise };
          if (this.onBestTowerUpdate) this.onBestTowerUpdate(lastBestTower);
        }
      } else {
        // Если вышек в зоне сигнала нет, сбрасываем данные
        if (lastBestTower) {
          lastBestTower = null;
          if (this.onBestTowerUpdate) this.onBestTowerUpdate(null);
        }
      }
    }, 300); // Обновление раз в 1 секунду
  },
  

  stopTracking() {
    if (distanceInterval) {
      clearInterval(distanceInterval);
      distanceInterval = null;
      console.log("Distance tracking stopped.");
    }
  },
};

export default Rangetotower;
