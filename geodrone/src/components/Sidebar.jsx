// src/components/Sidebar.jsx
import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ handleStyleChange, onStartFlight }) => {
  const mapStyles = [
    { label: 'Спутник', value: 'mapbox://styles/mapbox/satellite-streets-v12' },
    { label: 'Схема', value: 'mapbox://styles/mapbox/streets-v12' },
    { label: '3D рельеф', value: 'mapbox://styles/mapbox/outdoors-v12' }
  ];

  const handleSelectChange = (event) => {
    handleStyleChange(event.target.value);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <select onChange={handleSelectChange} className="map-style-select">
          {mapStyles.map((style) => (
            <option key={style.value} value={style.value}>
              {style.label}
            </option>
          ))}
        </select>
        <button onClick={onStartFlight} className="start-flight-button">
          Начать полет
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
