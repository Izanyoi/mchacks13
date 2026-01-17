import React, { useState } from 'react';
import { login } from '../services/auth';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [errors, setErrors] = useState({
    username: '',
    password: '',
    general: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { username: '', password: '', general: '' };
    setErrors(newErrors);

    let hasEmpty = false;
    if (!username) { newErrors.username = 'Username is required'; hasEmpty = true; }
    if (!password) { newErrors.password = 'Password is required'; hasEmpty = true; }

    if (hasEmpty) {
      setErrors(newErrors);
      return;
    }

    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.access_token);
      window.location.href = "/profile"; 
    } catch (err) {
      setErrors(prev => ({ 
        ...prev, 
        general: "Login failed. Please check your credentials." 
      }));
    }
  };

  const getBorderStyle = (fieldName: keyof typeof errors) => ({
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid',
    borderColor: errors[fieldName as keyof typeof errors] ? '#dc3545' : '#ccc',
    fontSize: '1rem',
    outline: 'none'
  });

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#333' }}>
          Login to calendarAI
        </h2>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Username</label>
          <input 
            placeholder="Enter your username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={getBorderStyle('username')}
          />
          {errors.username && <span style={errorTextStyle}>{errors.username}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password</label>
          <input 
            placeholder="Enter your password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={getBorderStyle('password')}
          />
          {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          
          {errors.general && (
            <span style={{ ...errorTextStyle, textAlign: 'center' }}>{errors.general}</span>
          )}
        </div>

        <button 
          type="submit" 
          style={buttonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
        >
          Sign In
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
          Don't have an account? <a href="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Register</a>
        </p>
      </form>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '80vh',
  backgroundColor: '#f9f9f9'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '15px',
  width: '100%',
  maxWidth: '350px',
  padding: '30px',
  backgroundColor: '#fff',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: '1px solid #eee'
};

const inputGroupStyle = { display: 'flex', flexDirection: 'column' as const, gap: '5px' };
const labelStyle = { fontSize: '0.9rem', fontWeight: 'bold' as const };
const errorTextStyle = { color: '#dc3545', fontSize: '0.75rem', fontWeight: 'bold' as const, marginTop: '2px' };

const buttonStyle = {
  marginTop: '10px',
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 'bold' as const,
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export default LoginForm;