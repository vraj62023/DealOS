import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../app/features/authSlice';
import api from '../configs/api';
import toast from 'react-hot-toast';

export default function Login() {
  const dispatch = useDispatch();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
      
      // Hit our backend API
      const { data } = await api.post(endpoint, formData);

      // Save token and user to Redux (which also saves to localStorage)
      dispatch(login({
        token: data.token,
        user: {
          _id: data._id,
          name: data.name,
          email: data.email,
          companyId: data.companyId
        }
      }));

      toast.success(isLoginMode ? 'Welcome back!' : 'Account created successfully!');
      
      // React Router's <Navigate /> in App.jsx will automatically redirect us to /dashboard now
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLoginMode ? 'Sign in to DealOS' : 'Create your account'}
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            
            {!isLoginMode && (
              <>
                <input
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <input
                  name="companyName"
                  type="text"
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Company Name (Optional)"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </>
            )}

            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
            
            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Register')}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none"
          >
            {isLoginMode 
              ? "Don't have an account? Register here." 
              : "Already have an account? Sign in."}
          </button>
        </div>
      </div>
    </div>
  );
}