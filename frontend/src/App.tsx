import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, useNavigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Profile from './components/Profile'
import { getMe } from './services/auth';
import logo from './assets/logo.png';
import './App.css';

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getMe(token);
          setUser(userData);
        } catch (err) {
          console.error("Session expired");
          localStorage.removeItem('token');
        }
      }
    };
    initAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate("/");
  };

    return (
      <div style={{ 
        backgroundColor: '#f4f7f6', 
        minHeight: '100vh', 
        width: '100%',
        margin: 0,
        padding: 0
      }}>
      <nav style={{ 
        padding: '10px 20px', 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/">
          <img src={logo} alt="logo" style={{ width: '150px', cursor: 'pointer' }}/>
        </Link>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link to="/profile" style={{ 
                textDecoration: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'background-color 0.2s',
                display: 'inline-block'
              }}>
                Profile
              </Link>

              <button onClick={handleLogout} style={{ 
                cursor: 'pointer',
                backgroundColor: 'transparent',
                border: '1px solid #dc3545',
                color: '#dc3545',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link nav-login">Login</NavLink>
              <NavLink to="/register" className="nav-link nav-register">Register</NavLink>
            </>
          )}
        </div>
      </nav>

      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/profile" element={<Profile user={user} setUser={setUser}/>} />
          <Route path="/" element={<h2>An AI powered calendar!</h2>} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;