const API_BASE_URL = 'http://localhost:3001'; // Backend URL'inizi buraya yazın

// Helper function for API calls with token
const fetchWithToken = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };
  
  const response = await fetch(`${API_BASE_URL}${url}`, config);
  const data = await response.json();
  
  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  }
  
  return data;
};

// Login API
export const loginAPI = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    } else {
      return {
        success: false,
        error: data.errorMessage || 'Giriş başarısız!'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Bağlantı hatası!'
    };
  }
};

// Register API
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
    } else {
      let errorMessage = 'Kayıt başarısız!';
      if (data.fields && data.fields.length > 0) {
        errorMessage = data.fields[0].errorMessage;
      } else if (data.errorMessage) {
        errorMessage = data.errorMessage;
      }
      return { success: false, error: errorMessage };
    }
  } catch (error) {
    return { success: false, error: 'Bağlantı hatası!' };
  }
};

// Get Chats API
export const getChatsAPI = async () => {
  return fetchWithToken('/chats');
};

// Create Group API
export const createGroupAPI = async (name) => {
  return fetchWithToken('/chats/create-group', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
};

// Join Group API
export const joinGroupAPI = async (groupId) => {
  return fetchWithToken(`/chats/join/${groupId}`, {
    method: 'POST',
  });
};