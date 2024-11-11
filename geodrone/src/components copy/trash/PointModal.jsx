// src/components/PointModal.jsx
import React, { useState } from 'react';

const PointModal = ({ point, onSave, onClose, position }) => {
  const [altitude, setAltitude] = useState(0);

  const handleSave = () => {
    onSave({ ...point, altitude: parseFloat(altitude) });
    onClose();
  };

  return (
    <div
      className="modal"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <h3>Добавить точку</h3>
      <p>Координаты: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}</p>
      <label>
        Высота (м):
        <input
          type="number"
          value={altitude}
          onChange={(e) => setAltitude(e.target.value)}
        />
      </label>
      <button onClick={handleSave}>Сохранить</button>
      <button onClick={onClose}>Отмена</button>
    </div>
  );
};

export default PointModal;
