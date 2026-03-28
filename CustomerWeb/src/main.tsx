import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
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
