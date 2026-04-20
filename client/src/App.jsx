import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import { motion, AnimatePresence } from 'framer-motion';
import './index.css';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-mesh">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
      <span className="text-slate-500 font-bold tracking-widest text-xs uppercase">Initializing Radar</span>
    </motion.div>
  </div>
);

import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" />;
  
  return <Layout>{children}</Layout>;
};

function App() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen relative">
      <div className="bg-mesh" />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/onboarding" 
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

export default AppWrapper;
