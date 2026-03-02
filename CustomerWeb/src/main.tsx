import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Remove initial loader and show app once rendered
window.addEventListener('load', () => {
  const root = document.getElementById('root');
  const loader = document.getElementById('initial-loader');
  if (root) root.classList.add('ready');
  if (loader) loader.classList.add('hide-loader');
});

// Immediate fallback in case load event already fired
setTimeout(() => {
  const root = document.getElementById('root');
  const loader = document.getElementById('initial-loader');
  if (root && !root.classList.contains('ready')) root.classList.add('ready');
  if (loader && !loader.classList.contains('hide-loader')) loader.classList.add('hide-loader');
}, 1000);
