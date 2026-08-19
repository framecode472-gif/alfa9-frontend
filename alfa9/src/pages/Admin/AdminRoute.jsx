import { Navigate } from 'react-router-dom';
import { isAdminDemoMode } from './demoData';

const ADMIN_TOKEN_KEY = 'alfa9_admin_token';

export default function AdminRoute({ children }) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  // Demo mode never has a real token, but is still allowed in — every
  // real API call this session makes gets intercepted by demoFetch()
  // instead (see AdminPanel.jsx), so no real data is ever touched.
  if (!token && !isAdminDemoMode()) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}