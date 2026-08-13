import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const initialLocale = typeof window !== 'undefined' ? (localStorage.getItem("exechat_user_language") || "en") : "en";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider 
      clientId="1066126862559-n81d6h5ai7d9bfgji0842tfatml2p8q5.apps.googleusercontent.com"
      locale={initialLocale}
    >
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
