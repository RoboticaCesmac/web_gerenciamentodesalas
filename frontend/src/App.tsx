import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Login } from './pages/Login/Login';
import { Agendamento } from './pages/Agendamento/Agendamento';
import './pages/StyleGeral.css';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  return token ? <>{children}</> : null;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/agendamento" 
          element={
            <PrivateRoute>
              <Agendamento />
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/agendamento" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
