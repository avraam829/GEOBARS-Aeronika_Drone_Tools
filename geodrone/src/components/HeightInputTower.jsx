import React from 'react';

const HeightInputTower = ({ signalPower, setHeightTower, onAdd }) => (
  <div style={{
    position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', zIndex: 1000,
    borderRadius: '5px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
  }}>
    <label>
      Радиус сигнала:
      <input 
        type="number" 
        value={signalPower} 
        onChange={(e) => setHeightTower(parseFloat(e.target.value))} 
        style={{ marginLeft: '5px', width: '60px' }} 
      />
    </label>
    <button onClick={onAdd} style={{ marginLeft: '10px' }}>Добавить Вышку</button>
  </div>
);

export default HeightInputTower;
