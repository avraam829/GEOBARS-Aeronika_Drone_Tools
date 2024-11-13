import React, { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import SphereManager from './SphereManager';

const ParrotModel = ({ map }) => {
  const parrotCoords = [44.621762, 39.091278];
  const parrotHeight = 3000; // Высота над уровнем моря

  useEffect(() => {
    if (!map || !window.tb) return;

    // Инициализируем Threebox, если не было сделано ранее
    if (!window.tb) {
      SphereManager.initialize(map);
    }

    // Загружаем модель попугая
    const loader = new GLTFLoader();
    loader.load(
      '../src/assets/Parrot.glb',
      (gltf) => {
        const parrot = gltf.scene;

        // Устанавливаем позицию и масштаб модели
        parrot.scale.set(5, 5000000, 500); // Настройте масштаб, если это необходимо
        parrot.position.set(...parrotCoords, parrotHeight);

        // Добавляем модель попугая на карту через Threebox
        const threeboxParrot = window.tb.Object3D({ obj: parrot }).setCoords([...parrotCoords, parrotHeight]);
        window.tb.add(threeboxParrot);

        console.log("Parrot model added to the map at coordinates:", parrotCoords, "with height:", parrotHeight);
      },
      undefined,
      (error) => {
        console.error("Error loading Parrot model:", error);
      }
    );
  }, [map]);

  return null; // Компонент не рендерит ничего в DOM, так как используется только для добавления модели на карту
};

export default ParrotModel;
