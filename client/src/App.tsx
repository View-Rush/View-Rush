import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/layout/Navbar'
import './App.css'

// Layout wrapper for protected pages
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

// Component to handle authenticated routes
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      {/* <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              
            </ProtectedLayout>
          </ProtectedRoute>
        } 
      /> */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <ProfilePage />
            </ProtectedLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/analytics" 
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics</h1>
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Analytics page coming soon...</p>
                  </div>
                </div>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/predictions" 
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">Predictions</h1>
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600">Predictions page coming soon...</p>
                  </div>
                </div>
              </div>
            </ProtectedLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  )
}

export default App
