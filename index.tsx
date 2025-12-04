import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

console.log("Found root element, attempting to mount React app...");

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React app mounted successfully");
} catch (error) {
  console.error("Error mounting React app:", error);
  document.body.innerHTML = `<div style="color: red; padding: 20px;"><h1>Application Error</h1><pre>${error}</pre></div>`;
}