import { Navigate, Route, Routes } from 'react-router-dom';
import ModuleLayout from './layouts/ModuleLayout.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import AuditPage from './pages/AuditPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import ActivityLogsPage from './pages/ActivityLogsPage.jsx';

// Allocation & Transfer Module Pages
import DashboardPage from './pages/DashboardPage.jsx';
import AssetAllocationPage from './pages/AssetAllocationPage.jsx';
import TransferPage from './pages/TransferPage.jsx';
import AssetDetailsPage from './pages/AssetDetailsPage.jsx';
import EmployeeAssetsPage from './pages/EmployeeAssetsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<ModuleLayout />}>
        <Route path="/"                 element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"        element={<DashboardPage />} />
        <Route path="/allocations"      element={<AssetAllocationPage />} />
        <Route path="/transfers"        element={<TransferPage />} />
        <Route path="/assets/:id"       element={<AssetDetailsPage />} />
        <Route path="/employee-assets"  element={<EmployeeAssetsPage />} />
        
        <Route path="/resource-booking" element={<BookingPage />} />
        <Route path="/maintenance"      element={<MaintenancePage />} />
        <Route path="/audit"            element={<AuditPage />} />
        <Route path="/reports"          element={<ReportsPage />} />
        <Route path="/notifications"    element={<NotificationsPage />} />
        <Route path="/activity-logs"    element={<ActivityLogsPage />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Login /></div>} />
      <Route path="/signup" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Signup /></div>} />
      <Route path="/forgot-password" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><ForgotPassword /></div>} />
    </Routes>
  );
}