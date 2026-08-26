/** Bootstrap React: proveedores globales (media del sitio, toasts) y `App`. */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SiteMediaProvider } from './context/SiteMediaContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { MemberAuthProvider } from './context/MemberAuthContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SiteMediaProvider>
      <FeedbackProvider>
        <MemberAuthProvider>
          <App />
        </MemberAuthProvider>
      </FeedbackProvider>
    </SiteMediaProvider>
  </React.StrictMode>,
);
