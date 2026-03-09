// frontend/src/services/api.js


// IMPORTANT: Use your actual IP address
const API_URL = 'http://10.24.11.243:5000/api';

const api = {
  // GET request
  get: async (endpoint) => {
    try {
      console.log(`🌐 GET ${API_URL}${endpoint}`);
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API GET ${endpoint} error:`, error);
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data = {}) => {
    try {
      console.log(`🌐 POST ${API_URL}${endpoint}`, data);
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // POST with auth token
  postAuth: async (endpoint, data = {}, token) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API POST ${endpoint} error:`, error);
      throw error;
    }
  },

  // GET with auth token
  getAuth: async (endpoint, token) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API GET ${endpoint} error:`, error);
      throw error;
    }
  },

  // PUT with auth token
  putAuth: async (endpoint, data = {}, token) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API PUT ${endpoint} error:`, error);
      throw error;
    }
  },

  // DELETE with auth token
  deleteAuth: async (endpoint, token) => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};

export default api;