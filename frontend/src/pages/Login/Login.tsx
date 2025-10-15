import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoCesmac from "../../assets/logo-CESMAC.svg";
import logoCesmacRedux from "../../assets/logo-CESMAC-redux.svg"
import iconePerfil from "../../assets/Icones-Perfil.svg";
import iconeCadeado from "../../assets/ICONE CADEADO.svg";
import campus1 from "../../assets/Campus1.svg";
import "./Login.css";
import { login } from '../../services/api';

export const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");
    const fullEmail = `${username}@cesmac.edu.br`;

    try {
      const result = await login({ email: fullEmail, password });
      
      if (result.ok) {
        // Navegar para página de agendamento
        navigate('/agendamento');
      } else {
        setError(result.error || "Usuário ou senha incorretos");
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
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