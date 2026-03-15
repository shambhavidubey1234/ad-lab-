import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent, registerForEvent } from '../services/api';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await getEvent(id);
      setEvent(response.data.event || response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching event:', error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await registerForEvent(id);
      setSuccess(response.data.message || 'Registration successful!');
      fetchEvent(); // Refresh event data
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', color: '#DBA858' }}>Loading event details...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: '#8C0E0F' }}>Event not found</h3>
        <button 
          onClick={() => navigate('/events')}
          style={{ 
            padding: '10px 20px', 
            background: '#E89C31', 
            color: '#031B28',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <button 
        onClick={() => navigate('/events')}
        style={{ 
          padding: '8px 15px', 
          background: '#6c757d', 
          color: 'white', 
          border: 'none',
          marginBottom: '20px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Events
      </button>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '15px',
          background: 'rgba(220, 53, 69, 0.2)',
          color: '#f8d7da',
          border: '1px solid #dc3545',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          marginBottom: '15px',
          background: 'rgba(40, 167, 69, 0.2)',
          color: '#d4edda',
          border: '1px solid #28a745',
          borderRadius: '4px'
        }}>
          {success}
        </div>
      )}

      <div style={{ 
        background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)',
        padding: '30px', 
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '1px solid #8C0E0F'
      }}>
        <h1 style={{ marginTop: 0, color: '#DBA858' }}>{event.title}</h1>
        
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          margin: '20px 0',
          flexWrap: 'wrap'
        }}>
          <div style={{ 
            background: '#031B28', 
            padding: '10px 15px', 
            borderRadius: '6px',
            minWidth: '150px',
            border: '1px solid #083248'
          }}>
            <div style={{ color: '#E89C31', fontWeight: 'bold' }}>📅 Date</div>
            <div style={{ color: '#A0AEC0' }}>
              {new Date(event.date).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          <div style={{ 
            background: '#031B28', 
            padding: '10px 15px', 
            borderRadius: '6px',
            minWidth: '150px',
            border: '1px solid #083248'
          }}>
            <div style={{ color: '#E89C31', fontWeight: 'bold' }}>📍 Location</div>
            <div style={{ color: '#A0AEC0' }}>{event.venue || event.location || 'To be announced'}</div>
          </div>

          <div style={{ 
            background: '#031B28', 
            padding: '10px 15px', 
            borderRadius: '6px',
            minWidth: '150px',
            border: '1px solid #083248'
          }}>
            <div style={{ color: '#E89C31', fontWeight: 'bold' }}>🏷️ Category</div>
            <div style={{ color: '#A0AEC0' }}>{event.category || 'General'}</div>
          </div>
        </div>

        <div style={{ 
          background: '#031B28', 
          padding: '20px', 
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #083248'
        }}>
          <h3 style={{ color: '#DBA858', marginTop: 0 }}>Description</h3>
          <p style={{ lineHeight: '1.6', fontSize: '16px', color: '#A0AEC0' }}>
            {event.description || 'No description available.'}
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '30px',
          paddingTop: '20px',
          borderTop: '1px solid #083248'
        }}>
          <div>
            <button 
              onClick={handleRegister}
              disabled={registering}
              style={{ 
                padding: '12px 25px', 
                background: 'linear-gradient(135deg, #E89C31 0%, #DBA858 100%)',
                color: '#031B28',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: registering ? 'not-allowed' : 'pointer',
                opacity: registering ? 0.5 : 1
              }}
            >
              {registering ? 'Registering...' : '📝 Register for Event'}
            </button>
          </div>

          <div style={{ color: '#A0AEC0', fontSize: '14px' }}>
            <p>Event ID: <code style={{ color: '#E89C31' }}>{event._id || event.id}</code></p>
            <p>Capacity: {event.capacity || 'Unlimited'} | Registered: {event.registrationCount || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;