import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.token, data.user);
        
        setMessage('✅ Login successful! Redirecting...');
        
        setTimeout(() => {
          if (data.user.role === 'club_admin') {
            navigate('/club-admin');
          } else if (data.user.role === 'super_admin') {
            navigate('/super-admin');
          } else {
            navigate('/');
          }
        }, 1500);
      } else {
        // Check if email needs verification
        if (data.needsVerification) {
          setMessage('❌ Please verify your email first');
          setTimeout(() => {
            navigate('/verify-otp', { state: { email: data.email } });
          }, 2000);
        } else {
          setMessage(`❌ ${data.error || 'Login failed'}`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('❌ Cannot connect to server. Make sure backend is running.');
    }
  };

  const handleQuickTest = () => {
    setEmail('test@example.com');
    setPassword('password123');
    setMessage('Using test credentials. Click Login to test.');
  };

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '0 auto',
      padding: '2rem',
      background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '1px solid #8C0E0F',
      marginTop: '2rem'
    }}>
      <h2 style={{ 
        color: '#DBA858', 
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        🔐 Login to EventHub
      </h2>
      
      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '15px',
          background: message.includes('✅') ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)',
          color: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#28a745' : '#dc3545'}`,
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '1.2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px',
            color: '#DBA858',
            fontWeight: '500'
          }}>
            📧 Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px',
              background: '#031B28',
              color: '#DBA858',
              border: '1px solid #083248',
              borderRadius: '4px',
              outline: 'none'
            }}
            placeholder="Enter your email"
          />
        </div>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px',
            color: '#DBA858',
            fontWeight: '500'
          }}>
            🔒 Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px',
              background: '#031B28',
              color: '#DBA858',
              border: '1px solid #083248',
              borderRadius: '4px',
              outline: 'none'
            }}
            placeholder="Enter your password"
          />
        </div>
        
        <button 
          type="submit"
          style={{ 
            padding: '12px 20px', 
            fontSize: '16px',
            background: 'linear-gradient(135deg, #E89C31 0%, #DBA858 100%)',
            color: '#031B28',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold',
            borderRadius: '4px',
            transition: 'all 0.3s',
            marginBottom: '1rem'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          Login
        </button>
      </form>
      
      <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <button 
          onClick={handleQuickTest}
          style={{
            padding: '10px 20px',
            background: 'rgba(140, 14, 15, 0.2)',
            color: '#DBA858',
            border: '1px solid #8C0E0F',
            cursor: 'pointer',
            width: '100%',
            borderRadius: '4px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(140, 14, 15, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(140, 14, 15, 0.2)';
          }}
        >
          Use Test Credentials
        </button>
      </div>
      
      <div style={{ 
        borderTop: '1px solid #083248', 
        paddingTop: '1rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#A0AEC0', marginBottom: '0.5rem' }}>
          Don't have an account?
        </p>
        <a 
          href="/register" 
          style={{ 
            color: '#E89C31', 
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(232, 156, 49, 0.1)',
            borderRadius: '4px',
            border: '1px solid #E89C31'
          }}
        >
          📝 Register here
        </a>
      </div>
      
      <div style={{ 
        marginTop: '1.5rem',
        padding: '0.8rem',
        background: 'rgba(11, 40, 56, 0.5)',
        borderRadius: '4px',
        fontSize: '0.8rem',
        color: '#A0AEC0',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0 }}>
          🌐 Backend: http://localhost:5000
        </p>
        <p style={{ margin: '0.3rem 0 0 0' }}>
          🔗 API Endpoint: /api/auth/login
        </p>
      </div>
    </div>
  );
}

export default Login;