import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import routes, { renderRoutes } from './routes';

const AppWithAuthSync = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const syncAuth = (event) => {
      if (event.key === 'token') {
        if (event.newValue) {
          // Logged in from another tab
          navigate('/dashboard');
        } else {
          // Logged out from another tab
          navigate('/auth/signin');
          document.title = 'Bienvenue | CSO Plateforme';
        }
      }
    };

    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, [navigate]);

  return renderRoutes(routes);
};

const App = () => {
  return (
    <BrowserRouter basename={import.meta.env.VITE_APP_BASE_NAME}>
      <AppWithAuthSync />
    </BrowserRouter>
  );
};

export default App;
