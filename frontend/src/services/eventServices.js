// src/services/eventServices.js
import API from './api'; // ✅ Import your axios instance

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get all events
export const getEvents = async () => {
  try {
    console.log('📡 Fetching events from API...');
    const response = await API.get('/events'); // ✅ Use API.get() not fetch
    console.log('✅ Events fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching events:', error);
    
    // Return consistent error structure
    if (error.response) {
      return { 
        success: false, 
        message: error.response.data.message || 'Server error',
        error: error.response.data 
      };
    } else {
      return { 
        success: false, 
        message: 'Network error. Check if server is running.',
        events: [] 
      };
    }
  }
};

// Create new event
export const createEvent = async (eventData) => {
  try {
    console.log('📤 Creating event with data:', eventData);
    const response = await API.post('/events', eventData); // ✅ Use API.post() not fetch
    console.log('✅ Event creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating event:', error);
    
    // Detailed error handling
    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      console.error('Server error response:', error.response.data);
      return { 
        success: false, 
        message: error.response.data.message || 'Server error',
        error: error.response.data 
      };
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from server:', error.request);
      // ✅ FIXED: Use API_URL instead of hardcoded localhost
      return { 
        success: false, 
        message: `No response from server. Check if backend is running at ${API_URL}` 
      };
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      return { 
        success: false, 
        message: error.message || 'Failed to create event' 
      };
    }
  }
};

// Get single event by ID
export const getEventById = async (eventId) => {
  try {
    const response = await API.get(`/events/${eventId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event:', error);
    return { success: false, message: 'Event not found' };
  }
};

// Register for event
export const registerForEvent = async (eventId) => {
  try {
    const response = await API.post(`/events/${eventId}/register`);
    return response.data;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};