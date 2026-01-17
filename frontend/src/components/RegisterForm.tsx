import React, { useState } from 'react';
import { register } from '../services/auth';

function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [isSuccessful, setIsSuccessful] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const newErrors = { username: '', email: '', password: '', fullName: '' };
    setErrors(newErrors);
    setIsSuccessful(false);

    let hasError = false;
    
    if (!fullName) { newErrors.fullName = 'Full Name is required'; hasError = true; }
    if (!username) { newErrors.username = 'Username is required'; hasError = true; }
    if (!email) { newErrors.email = 'Email is required'; hasError = true; }
    if (!password) { newErrors.password = 'Password is required'; hasError = true; }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailPattern.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(username, email, password, fullName);
      setIsSuccessful(true);
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      if (err.message.includes("already exists")) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
      } else if (err.message.includes("email")) {
        setErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      } else {
        setErrors(prev => ({ ...prev, password: 'Registration failed. Please try again.' }));
      }
    }
  };

  const getBorderStyle = (fieldName: keyof typeof errors) => ({
    ...inputStyle,
    borderColor: errors[fieldName] ? '#dc3545' : '#ccc'
  });

  return (
    <div style={containerStyle}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', color: '#333' }}>
          Join calendarAI
        </h2>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Full Name</label>
          <input 
            placeholder="Enter your full name" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            style={getBorderStyle('fullName')}
          />
          {errors.fullName && <span style={errorTextStyle}>{errors.fullName}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Username</label>
          <input 
            placeholder="Choose a username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={getBorderStyle('username')}
          />
          {errors.username && <span style={errorTextStyle}>{errors.username}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Email</label>
          <input 
            placeholder="Enter your email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={getBorderStyle('email')}
          />
          {errors.email && <span style={errorTextStyle}>{errors.email}</span>}
        </div>

        <div style={inputGroupStyle}>
          <label style={labelStyle}>Password</label>
          <input 
            placeholder="Create a password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={getBorderStyle('password')}
          />
          {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
          
          {isSuccessful && (
            <span style={successTextStyle}>Registration Successful! You can now log in.</span>
          )}
        </div>

        <button 
          type="submit" 
          style={buttonStyle}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
        >
          Create Account
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666' }}>
          Already have an account? <a href="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Log In</a>
        </p>
      </form>
    </div>
  );
}

const errorTextStyle = {
  color: '#dc3545',
  fontSize: '0.75rem',
  fontWeight: 'bold' as const,
  marginTop: '2px'
};

const successTextStyle = {
  color: 'green',
  fontSize: '0.75rem',
  fontWeight: 'bold' as const,
  marginTop: '2px'
};

const inputGroupStyle = { 
  display: 'flex', 
  flexDirection: 'column' as const, 
  gap: '5px' 
};

const labelStyle = { 
  fontSize: '0.9rem', 
  fontWeight: 'bold' as const 
};

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

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '1rem',
  outline: 'none'
};

const buttonStyle = {
  marginTop: '10px',
  padding: '12px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 'bold' as const,
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export default RegisterForm;