import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Подключаем компонент карты

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Отображаем компонент карты */}
  </React.StrictMode>
);
