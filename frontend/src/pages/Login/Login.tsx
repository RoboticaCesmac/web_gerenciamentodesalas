import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCesmac from "../../assets/logo-CESMAC.svg";
import logoCesmacRedux from "../../assets/logo-CESMAC-redux.svg"
import iconePerfil from "../../assets/Icones-Perfil.svg";
import iconeCadeado from "../../assets/ICONE CADEADO.svg";
import campus1 from "../../assets/Campus1.svg";
import "./Login.css";
import { dummyUsers } from '../../services/dummyData';

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    // DUMMY LOGIN - Simplificado e síncrono
    const user = dummyUsers.find(u => u.username === username.trim());
    
    if (user && user.password === password) {
      // Store user data
      localStorage.setItem('userProfile', JSON.stringify({
        id: dummyUsers.indexOf(user) + 1,
        email: `${user.username}@cesmac.edu.br`,
        username: user.username,
        first_name: user.username.split('.')[0],
        last_name: user.username.split('.')[1] || ''
      }));
      
      // Add a dummy token
      localStorage.setItem('token', 'dummy-token-123');
      
      // Navigate to agendamento
      navigate('/agendamento');
    } else {
      setError("Usuário ou senha incorretos");
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="rectangle-base">
        {/* Logo only shows here in desktop mode */}
        <img className="logo-CESMAC-desktop" alt="Logo CESMAC" src={logoCesmacRedux} />
      </div>
      <div className="content-container">
        {/* Logo shows here only in mobile mode */}
        <img className="logo-CESMAC-mobile" alt="Logo CESMAC" src={logoCesmac} />
        <div className="portal-title">Portal de Agendamentos</div>
        <div className="welcome-text">Boas-Vindas!</div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-container">
            <img src={iconePerfil} alt="" className="input-icon" />
            <input
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Insira seu usuário"
              disabled={loading}
            />
          </div>
          
          <div className="input-container">
            <img src={iconeCadeado} alt="" className="input-icon" />
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Insira sua senha"
              disabled={loading}
            />
          </div>

          <div className={`error-message ${error ? 'visible' : ''}`}>
            {error}
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
      <img className="image" alt="Campus CESMAC" src={campus1} />
    </div>
  );
};