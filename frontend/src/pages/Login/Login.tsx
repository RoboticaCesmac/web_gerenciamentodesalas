import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/api";
import logoCesmac from "../../assets/logo-CESMAC.svg";
import logoCesmacRedux from "../../assets/logo-CESMAC-redux.svg";
import iconePerfil from "../../assets/Icones-Perfil.svg";
import iconeCadeado from "../../assets/ICONE CADEADO.svg";
import campus1 from "../../assets/Campus1.svg";
import "./Login.css";

export const Login: React.FC = () => {
  const [username, setUsername] = useState(""); // Changed from email
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

    try {
      console.log('Attempting login with:', { username }); // Debug log
      const response = await login(username, password);
      console.log('Login response:', response); // Debug log
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userProfile', JSON.stringify(response.user));
        navigate('/agendamento');
      } else {
        throw new Error('Token não recebido');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
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
            <img src={iconePerfil} alt="Ícone de perfil" className="input-icon" />
            <input
              type="text" // Changed from email to text
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário" // Changed placeholder
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