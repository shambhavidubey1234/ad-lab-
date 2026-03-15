import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { verifyOTP } from '../services/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes
  const [showResend, setShowResend] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.value !== '' && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && index > 0 && otp[index] === '') {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await verifyOTP({ email, otp: otpString });
      const data = response.data;
      
      login(data.token, data.user);
      
      if (data.user.role === 'club_admin') {
        navigate('/club-admin');
      } else if (data.user.role === 'super_admin') {
        navigate('/super-admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');
      
      // You'll need to add resendOTP to your API service
      // For now, let's use fetch with the env variable
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCountdown(600);
        setShowResend(false);
        setOtp(['', '', '', '', '', '']);
        alert('✅ New OTP sent to your email!');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '2rem auto',
      padding: '2rem',
      background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      border: '1px solid #8C0E0F'
    }}>
      <h2 style={{ 
        color: '#DBA858', 
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        📧 Email Verification
      </h2>
      
      <p style={{ 
        color: '#A0AEC0',
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        Enter the 6-digit OTP sent to<br />
        <strong style={{ color: '#E89C31' }}>{email}</strong>
      </p>
      
      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '1rem',
          background: 'rgba(220, 53, 69, 0.2)',
          color: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e.target, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              style={{
                width: '50px',
                height: '60px',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                background: '#031B28',
                color: '#DBA858',
                border: `2px solid ${digit ? '#E89C31' : '#083248'}`,
                borderRadius: '8px',
                outline: 'none'
              }}
              disabled={loading}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          color: '#A0AEC0'
        }}>
          <span>
            ⏱️ OTP expires in: <strong style={{ color: '#E89C31' }}>{formatTime(countdown)}</strong>
          </span>
          
          {showResend && (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: 'rgba(140, 14, 15, 0.2)',
                color: '#DBA858',
                border: '1px solid #8C0E0F',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Resend OTP
            </button>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || otp.some(d => d === '')}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            background: 'linear-gradient(135deg, #E89C31 0%, #DBA858 100%)',
            color: '#031B28',
            border: 'none',
            cursor: loading || otp.some(d => d === '') ? 'not-allowed' : 'pointer',
            width: '100%',
            fontWeight: 'bold',
            borderRadius: '4px',
            opacity: loading || otp.some(d => d === '') ? 0.5 : 1
          }}
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
      </form>
      
      {/* Debug footer */}
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        background: '#0B2838', 
        borderRadius: '4px',
        fontSize: '12px',
        color: '#A0AEC0',
        textAlign: 'center'
      }}>
        API: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify-otp
      </div>
    </div>
  );
};

export default VerifyOTP;