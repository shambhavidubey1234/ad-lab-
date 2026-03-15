// src/pages/ClubAdmin.js - FINAL VERSION WITH DEBUG LOGS
import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { 
  EditEventModal, 
  RegistrationList, 
  ExportButton 
} from '../components/admin';

const ClubAdmin = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  // Check authentication and fetch events
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
      setError('Please login to access admin dashboard');
      setLoading(false);
      return;
    }
    
    if (user.role !== 'club_admin') {
      setError('Admin privileges required');
      setLoading(false);
      return;
    }
    
    fetchEvents();
  }, []);

  // ✅ AUTO-REFRESH WHEN REGISTRATION UPDATED - WITH DEBUG LOGS
  useEffect(() => {
    console.log('✅ Setting up registration-updated listener in ClubAdmin');
    
    const handleRegistrationUpdate = () => {
      console.log('🔄🔥 REFRESH EVENT RECEIVED IN CLUBADMIN! Fetching events...');
      fetchEvents();
    };
    
    window.addEventListener('registration-updated', handleRegistrationUpdate);
    console.log('✅ Listener added successfully in ClubAdmin');
    
    return () => {
      console.log('🧹 Cleaning up listener in ClubAdmin');
      window.removeEventListener('registration-updated', handleRegistrationUpdate);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      console.log('📡 Fetching events from API...');
      setLoading(true);
      setError('');
      
      const response = await adminService.getAdminEvents();
      console.log('Events API response:', response.data);
      
      // Handle response - Your API returns events array directly
      let eventsArray = [];
      
      if (Array.isArray(response.data)) {
        eventsArray = response.data;
      } else if (response.data && Array.isArray(response.data.events)) {
        eventsArray = response.data.events;
      } else if (response.data && typeof response.data === 'object') {
        // Try to find any array in the object
        for (let key in response.data) {
          if (Array.isArray(response.data[key])) {
            eventsArray = response.data[key];
            break;
          }
        }
      }
      
      // Process events to use confirmedCount from backend
      const processedEvents = eventsArray.map(event => ({
        ...event,
        // Use confirmedCount from backend
        registrationCount: event.confirmedCount || 0,
        // Keep total registrations for reference
        totalRegistrations: event.registrations?.length || 0,
        capacity: event.capacity || 50,
        status: event.status || 'draft',
        description: event.description || ''
      }));
      
      console.log('✅ Processed events with confirmedCount:', processedEvents);
      setEvents(processedEvents);
      
    } catch (err) {
      console.error('Error fetching events:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 403) {
        setError('Admin access required.');
      } else {
        setError('Failed to load events. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Button handlers
  const handleEditEvent = (event) => {
    console.log('Editing event:', event);
    
    // Format date for the modal
    const eventToEdit = { ...event };
    if (eventToEdit.date) {
      const dateObj = new Date(eventToEdit.date);
      if (!isNaN(dateObj)) {
        eventToEdit.date = dateObj.toISOString().split('T')[0];
      }
    }
    
    setSelectedEvent(eventToEdit);
    setShowEditModal(true);
  };

  const handleViewRegistrations = (eventId) => {
    console.log('Viewing registrations for event:', eventId);
    setCurrentEventId(eventId);
    setShowRegistrations(true);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
    
    try {
      await adminService.deleteEvent(eventId);
      setEvents(events.filter(event => event._id !== eventId));
      alert('Event deleted successfully');
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleCreateEvent = () => {
    console.log('Creating new event');
    setSelectedEvent(null);
    setShowEditModal(true);
  };

  const handleEventUpdated = (updatedEvent) => {
    console.log('Event updated:', updatedEvent);
    
    if (selectedEvent && selectedEvent._id) {
      // Update existing event
      setEvents(events.map(event => 
        event._id === updatedEvent._id 
          ? { 
              ...updatedEvent, 
              registrationCount: event.registrationCount 
            } 
          : event
      ));
    } else {
      // Add new event
      setEvents([{ ...updatedEvent, registrationCount: 0 }, ...events]);
    }
    setShowEditModal(false);
    setSelectedEvent(null);
  };

  // Function to close modal and refresh
  const closeModal = () => {
    console.log('Closing modal, refreshing events...');
    setShowRegistrations(false);
    setCurrentEventId(null);
    fetchEvents(); // Refresh when closing
  };

  const handleRetry = () => {
    fetchEvents();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: '4rem', 
        textAlign: 'center',
        color: '#DBA858'
      }}>
        <div style={{ marginBottom: '1rem' }}>Loading admin dashboard...</div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          margin: '0 auto',
          border: '3px solid #083248',
          borderTop: '3px solid #E89C31',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        padding: '4rem', 
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#8C0E0F' }}>Error</h2>
        <p style={{ color: '#A0AEC0', marginBottom: '2rem' }}>{error}</p>
        <button
          onClick={handleRetry}
          style={{
            padding: '0.8rem 1.5rem',
            background: '#E89C31',
            color: '#031B28',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '80vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            color: '#DBA858', 
            marginBottom: '0.5rem',
            fontSize: '2rem'
          }}>
            🛠️ Club Admin Dashboard
          </h1>
          <p style={{ color: '#A0AEC0' }}>
            Manage your events and view registrations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={fetchEvents}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'transparent',
              color: '#DBA858',
              border: '1px solid #DBA858',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Refresh
          </button>
          <button
            onClick={handleCreateEvent}
            style={{
              padding: '0.8rem 1.5rem',
              background: 'linear-gradient(135deg, #E89C31 0%, #DBA858 100%)',
              color: '#031B28',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            + Create New Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)', 
          padding: '1.5rem',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #083248'
        }}>
          <div style={{ fontSize: '2.5rem', color: '#DBA858', fontWeight: 'bold' }}>
            {events.length}
          </div>
          <div style={{ color: '#A0AEC0' }}>Total Events</div>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)', 
          padding: '1.5rem',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #083248'
        }}>
          <div style={{ fontSize: '2.5rem', color: '#DBA858', fontWeight: 'bold' }}>
            {events.reduce((total, event) => total + (event.registrationCount || 0), 0)}
          </div>
          <div style={{ color: '#A0AEC0' }}>Confirmed Registrations</div>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)', 
          padding: '1.5rem',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #083248'
        }}>
          <div style={{ fontSize: '2.5rem', color: '#DBA858', fontWeight: 'bold' }}>
            {events.filter(e => e.status === 'published').length}
          </div>
          <div style={{ color: '#A0AEC0' }}>Published</div>
        </div>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)', 
          padding: '1.5rem',
          borderRadius: '10px',
          textAlign: 'center',
          border: '1px solid #083248'
        }}>
          <div style={{ fontSize: '2.5rem', color: '#DBA858', fontWeight: 'bold' }}>
            {events.filter(e => e.status === 'draft').length}
          </div>
          <div style={{ color: '#A0AEC0' }}>Draft</div>
        </div>
      </div>

      {/* Events Table */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#DBA858' }}>📅 Your Events</h2>
          <div style={{ color: '#A0AEC0', fontSize: '0.9rem' }}>
            {events.length} event{events.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {events.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            background: 'rgba(3, 27, 40, 0.3)', 
            borderRadius: '8px',
            color: '#A0AEC0',
            border: '1px dashed #083248'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ color: '#DBA858', marginBottom: '0.5rem' }}>No Events Yet</h3>
            <p>Create your first event to get started</p>
          </div>
        ) : (
          <div style={{ 
            background: 'rgba(3, 27, 40, 0.3)', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #083248'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                minWidth: '800px'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #0B2838 0%, #083248 100%)'
                  }}>
                    <th style={{ 
                      padding: '1.2rem', 
                      textAlign: 'left', 
                      color: '#E89C31', 
                      fontWeight: '600'
                    }}>
                      Event Details
                    </th>
                    <th style={{ 
                      padding: '1.2rem', 
                      textAlign: 'left', 
                      color: '#E89C31', 
                      fontWeight: '600'
                    }}>
                      Date & Time
                    </th>
                    <th style={{ 
                      padding: '1.2rem', 
                      textAlign: 'left', 
                      color: '#E89C31', 
                      fontWeight: '600'
                    }}>
                      Confirmed / Capacity
                    </th>
                    <th style={{ 
                      padding: '1.2rem', 
                      textAlign: 'left', 
                      color: '#E89C31', 
                      fontWeight: '600'
                    }}>
                      Status
                    </th>
                    <th style={{ 
                      padding: '1.2rem', 
                      textAlign: 'left', 
                      color: '#E89C31', 
                      fontWeight: '600'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event, index) => (
                    <tr key={event._id || index} style={{ 
                      borderBottom: '1px solid #083248',
                      background: index % 2 === 0 ? 'rgba(3, 27, 40, 0.1)' : 'transparent'
                    }}>
                      <td style={{ padding: '1.2rem', maxWidth: '300px' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          color: '#DBA858', 
                          marginBottom: '0.3rem',
                          fontSize: '1.1rem'
                        }}>
                          {event.title || 'Untitled Event'}
                        </div>
                        {event.description && (
                          <div style={{ 
                            fontSize: '0.9rem', 
                            color: '#A0AEC0',
                            lineHeight: '1.4',
                            marginBottom: '0.3rem'
                          }}>
                            {event.description.length > 80 
                              ? `${event.description.substring(0, 80)}...` 
                              : event.description}
                          </div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: '#8C0E0F' }}>
                          📍 {event.venue || 'Venue not specified'}
                        </div>
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <div style={{ color: '#DBA858', marginBottom: '0.3rem' }}>
                          {formatDate(event.date)}
                        </div>
                        {event.time && (
                          <div style={{ fontSize: '0.9rem', color: '#A0AEC0' }}>
                            🕒 {event.time}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                          <div style={{ 
                            color: '#DBA858', 
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                          }}>
                            {event.registrationCount || 0} / {event.capacity || '∞'}
                          </div>
                          <div style={{
                            width: '120px',
                            height: '8px',
                            background: '#031B28',
                            borderRadius: '4px',
                            marginTop: '0.3rem',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(100, ((event.registrationCount || 0) / (event.capacity || 100)) * 100)}%`,
                              height: '100%',
                              background: ((event.registrationCount || 0) / (event.capacity || 100)) >= 0.9 
                                ? '#8C0E0F' 
                                : ((event.registrationCount || 0) / (event.capacity || 100)) >= 0.7
                                ? '#E89C31'
                                : '#28a745',
                              borderRadius: '4px'
                            }}></div>
                          </div>
                          {event.totalRegistrations > event.registrationCount && (
                            <div style={{ fontSize: '0.8rem', color: '#E89C31', marginTop: '0.3rem' }}>
                              ⏳ {event.totalRegistrations - event.registrationCount} pending
                            </div>
                          )}
                        </div>
                        <div>
                          <ExportButton 
                            eventId={event._id} 
                            eventTitle={event.title}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <span style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          background: event.status === 'published' 
                            ? 'rgba(40, 167, 69, 0.15)' 
                            : event.status === 'draft'
                            ? 'rgba(108, 117, 125, 0.15)'
                            : event.status === 'cancelled'
                            ? 'rgba(220, 53, 69, 0.15)'
                            : 'rgba(108, 117, 125, 0.15)',
                          color: event.status === 'published'
                            ? '#28a745'
                            : event.status === 'draft'
                            ? '#6c757d'
                            : event.status === 'cancelled'
                            ? '#dc3545'
                            : '#6c757d',
                          border: `1px solid ${
                            event.status === 'published' 
                            ? 'rgba(40, 167, 69, 0.3)' 
                            : event.status === 'draft'
                            ? 'rgba(108, 117, 125, 0.3)'
                            : event.status === 'cancelled'
                            ? 'rgba(220, 53, 69, 0.3)'
                            : 'rgba(108, 117, 125, 0.3)'
                          }`,
                          display: 'inline-block'
                        }}>
                          {(event.status || 'draft').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1.2rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleEditEvent(event)}
                            style={{
                              padding: '0.6rem 1rem',
                              background: 'rgba(232, 156, 49, 0.1)',
                              color: '#E89C31',
                              border: '1px solid rgba(232, 156, 49, 0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              minWidth: '70px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleViewRegistrations(event._id)}
                            style={{
                              padding: '0.6rem 1rem',
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3B82F6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              minWidth: '70px'
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            style={{
                              padding: '0.6rem 1rem',
                              background: 'rgba(140, 14, 15, 0.1)',
                              color: '#8C0E0F',
                              border: '1px solid rgba(140, 14, 15, 0.3)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              minWidth: '70px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit/Create Event Modal */}
      {showEditModal && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent}
          onSuccess={handleEventUpdated}
        />
      )}

      {/* View Registrations Modal */}
      {showRegistrations && currentEventId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: '#031B28',
            borderRadius: '12px',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: '1px solid #083248'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #083248',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#DBA858', margin: 0 }}>Event Registrations</h3>
              <button
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#A0AEC0',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <RegistrationList eventId={currentEventId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubAdmin;