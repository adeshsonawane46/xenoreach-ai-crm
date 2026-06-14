import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';

import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="330941327355-8kqq3eaj0pe9ggbpkvhe5n288fm7dco7.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);