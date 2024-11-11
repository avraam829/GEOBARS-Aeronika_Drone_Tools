import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Mapbox3D = () => {
  const sceneRef = useRef();
  const mountRef = useRef();

  useEffect(() => {
    // Создание сцены, камеры и рендерера
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement); // Привязываем рендерер к div

    // Создание сферической геометрии с проволочной сеткой
    const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    camera.position.z = 5;

    // Контроллеры для вращения с помощью мыши
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Для более плавного движения
    controls.dampingFactor = 0.05;

    // Анимация сферы
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update(); // Обновляем контроллеры для вращения камеры
      renderer.render(scene, camera);
    };

    animate();

    // Очистка при размонтировании компонента
    return () => {
      renderer.domElement.remove();
      controls.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default Mapbox3D;
