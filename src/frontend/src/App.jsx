import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import ResidentsPage from './pages/ResidentsPage';
import ResidentProfile from './pages/ResidentProfile';
import DynamicListsPage from './pages/DynamicListsPage';
import HospitalizedResidents from './pages/HospitalizedResidents';
import InactiveResidents from './pages/InactiveResidents';
import DeceasedResidents from './pages/DeceasedResidents';
import ResidentEdit from './pages/ResidentEdit';
import ResidentNew from './pages/ResidentNew';
import QuickRecordPage from './pages/QuickRecordPage';

import Records from './pages/Records';
import Alerts from './pages/Alerts';

import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard HOME */}
            {/* Dashboard HOME */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* Global Lists */}
            <Route
              path="/lists"
              element={
                <ProtectedRoute>
                  <DynamicListsPage />
                </ProtectedRoute>
              }
            />

            {/* Residents Section */}
            <Route
              path="/residents"
              element={
                <ProtectedRoute>
                  <ResidentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hospitalized"
              element={
                <ProtectedRoute>
                  <HospitalizedResidents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inactive"
              element={
                <ProtectedRoute>
                  <InactiveResidents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deceased"
              element={
                <ProtectedRoute>
                  <DeceasedResidents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/new"
              element={
                <ProtectedRoute>
                  <ResidentNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/:id"
              element={
                <ProtectedRoute>
                  <ResidentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/:id/quick-record"
              element={
                <ProtectedRoute>
                  <QuickRecordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/residents/:id/edit"
              element={
                <ProtectedRoute>
                  <ResidentEdit />
                </ProtectedRoute>
              }
            />



            {/* Records */}
            <Route
              path="/records"
              element={
                <ProtectedRoute>
                  <Records />
                </ProtectedRoute>
              }
            />


            {/* Alerts */}
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
