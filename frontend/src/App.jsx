import { Navigate, Route, Routes } from 'react-router-dom';
import ModuleLayout from './layouts/ModuleLayout.jsx';
import BookingPage from './pages/BookingPage.jsx';
import MaintenancePage from './pages/MaintenancePage.jsx';
import AuditPage from './pages/AuditPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<ModuleLayout />}>
        <Route path="/" element={<Navigate to="/resource-booking" replace />} />
        <Route path="/resource-booking" element={<BookingPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/audit" element={<AuditPage />} />
      </Route>
    </Routes>
  );
}