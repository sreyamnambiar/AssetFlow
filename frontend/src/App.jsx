import { Navigate, Route, Routes } from 'react-router-dom';
import ModuleLayout from './layouts/ModuleLayout.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<ModuleLayout />}>
        <Route path="/" element={<Navigate to="/resource-booking" replace />} />
        <Route path="/resource-booking" element={<BookingPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
      </Route>
      
      {/* Auth Routes */}
      <Route path="/login" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Login /></div>} />
      <Route path="/signup" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><Signup /></div>} />
      <Route path="/forgot-password" element={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><ForgotPassword /></div>} />
    </Routes>
  );
}