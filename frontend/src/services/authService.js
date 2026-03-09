import api from './api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const authService = {
  // Login
  login: async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    
    // Check if response already has success property
    if (response.success && response.token) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response;
    } 
    // If response is the data directly (no success wrapper)
    else if (response.token && response.user) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return { success: true, user: response.user, token: response.token };
    }
    
    return { success: false, error: 'Invalid response format' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
},

  // Register
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token
  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Check if user has role
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user && user.role === role;
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && ['admin', 'super_admin'].includes(user.role);
  },

  // Check if user is employee
  isEmployee: () => {
    const user = authService.getCurrentUser();
    return user && ['employee', 'admin', 'super_admin'].includes(user.role);
  },

  // Check if user is VIP
  isVIP: () => {
    const user = authService.getCurrentUser();
    return user && (user.role === 'vip_client' || user.is_vip === true);
  }
};

export default authService;