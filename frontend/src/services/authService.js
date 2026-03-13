// frontend/src/services/authService.js

const API_URL = 'http://10.30.245.243:5000/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

const authService = {
  // Login
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      console.log('📥 Login response:', data);
      
      if (data.success && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user, token: data.token };
      }
      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message };
    }
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

  // Logout
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    console.log('👋 Logged out');
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  // Check if user is employee
  isEmployee: () => {
    const user = authService.getCurrentUser();
    return user && ['employee', 'admin', 'super_admin'].includes(user.role);
  }
};

export default authService;