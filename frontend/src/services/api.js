const API_BASE_URL = 'http://localhost:3001';

export const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'token': token || '',
    },
  };
  
  const response = await fetch(`${API_BASE_URL}${url}`, config);
  const data = await response.json();
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  }
  
  return data;
};

export const loginAPI = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        data: {
          token: data.data.token,
          user: data.data.user || data.data
        }
      };
    }
    return { success: false, error: data.errorMessage || 'Login failed' };
  } catch (error) {
    return { success: false, error: 'Connection error' };
  }
};

export const registerAPI = async (formData) => {
  try {
    const dataToSubmit = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        dataToSubmit.append(key, formData[key]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      body: dataToSubmit,
    });

    const data = await response.json();
    if (data.success) {
      return { success: true };
    }
    
    let errorMessage = 'Registration failed';
    if (data.fields && data.fields.length > 0) {
      errorMessage = data.fields[0].errorMessage;
    } else if (data.errorMessage) {
      errorMessage = data.errorMessage;
    }
    return { success: false, error: errorMessage };
  } catch (error) {
    return { success: false, error: 'Connection error' };
  }
};

export { API_BASE_URL };