import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './pages/Layout';
import Dataroom from './pages/Dataroom';

import Matches from './pages/Matches';
import Settings from './pages/Settings';

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route 
          path="/login" 
          element={token ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/dashboard" 
          element={token ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="dataroom" element={<Dataroom />} />
          <Route path="matches" element={<Matches />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;