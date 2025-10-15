import React from 'react';
import SushiSwapReact from './SushiSwapReact';
import AlexAdmin from './components/AlexAdmin';
import './SushiSwapReact.css';

function App() {
  // Перевіряємо чи поточний шлях /alex
  const isAlexRoute = window.location.pathname === '/alex';
  
  return (
    <div className="App">
      {isAlexRoute ? <AlexAdmin /> : <SushiSwapReact />}
    </div>
  );
}

export default App;
