import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
)

// Registrar Service Worker para Notificações
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js?v=2')
      .then(reg => console.log('SW registrado:', reg.scope))
      .catch(err => console.log('Erro ao registrar SW:', err));
  });
}
