import React from 'react';

const HeightInput = ({ height, setHeight, onAdd }) => (
  <div style={{
    position: 'absolute', top: '10px', left: '10px', background: 'white', padding: '10px', zIndex: 1000,
    borderRadius: '5px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
  }}>
    <label>
      Высота:
      <input 
        type="number" 
        value={height} 
        onChange={(e) => setHeight(parseFloat(e.target.value))} 
        style={{ marginLeft: '5px', width: '60px' }} 
      />
    </label>
    <button onClick={onAdd} style={{ marginLeft: '10px' }}>Добавить сферу</button>
  </div>
);

export default HeightInput;
