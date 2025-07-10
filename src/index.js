import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// The 'import ./index.css' line has been removed to fix the build error.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
