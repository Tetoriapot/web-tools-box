import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { offlineSupport } from './lib/offline';
import './styles/tokens.css';
import './styles/global.css';
import './styles/workspace.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Keep development/HMR free of caches; registration failures never block the tools.
void offlineSupport.start();
