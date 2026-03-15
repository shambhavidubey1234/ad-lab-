import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    collegeId: '',
    phone: '',
    department: '',
    year: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    clubName: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        collegeId: formData.collegeId,
        phone: formData.phone,
        department: formData.department,
        year: formData.year,
        password: formData.password,
        role: formData.role,
        clubName: formData.role === 'club_admin' ? formData.clubName : undefined
      };

      const response = await registerUser(userData);
      const data = response.data;
      
      if (response.status === 201 || response.status === 200) {
        setSuccess(`✅ ${data.message}`);
        
        // Redirect to OTP verification page
        navigate('/verify-otp', { 
          state: { 
            email: data.email,
            userId: data.userId 
          } 
        });
        
      } else {
        setError(`❌ ${data.error || 'Registration failed'}`);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || '❌ Cannot connect to server');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ color: '#DBA858', textAlign: 'center' }}>Register</h2>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe6e6', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ color: 'green', padding: '10px', background: '#e6ffe6', marginBottom: '15px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>College ID</label>
          <input
            type="text"
            name="collegeId"
            value={formData.collegeId}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Year</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Role *</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          >
            <option value="student">Student</option>
            <option value="club_admin">Club Admin</option>
          </select>
        </div>
        
        {formData.role === 'club_admin' && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Club Name *</label>
            <input
              type="text"
              name="clubName"
              value={formData.clubName}
              onChange={handleChange}
              required={formData.role === 'club_admin'}
              style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
            />
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#DBA858' }}>Confirm Password *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px', background: '#031B28', color: '#DBA858', border: '1px solid #083248' }}
          />
        </div>
        
        <button 
          type="submit"
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px',
            background: 'linear-gradient(135deg, #E89C31 0%, #DBA858 100%)',
            color: '#031B28',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            fontWeight: 'bold',
            borderRadius: '4px'
          }}
        >
          Register
        </button>
      </form>
      
      <p style={{ marginTop: '20px', color: '#A0AEC0', textAlign: 'center' }}>
        Already have an account? <a href="/login" style={{ color: '#E89C31' }}>Login here</a>
      </p>
      
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
        API: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/register
      </div>
    </div>
  );
}
  
export default Register;