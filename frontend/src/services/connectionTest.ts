import axios from 'axios';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/test/`,
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('Backend connection test:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error: any) {
    console.error('Backend connection error:', error);
    return {
      success: false,
      error: error.message,
      details: error.response?.data || error.response?.status
    };
  }
};
