import { Navigate } from "react-router-dom";

// Checks for the real JWT (set by Auth.jsx on successful login/register,
// cleared on logout) before allowing access to a protected page.
// Previously this checked 'alfa9_session' — a leftover string (just the
// typed email/phone, not a real credential) that could be stale or spoofed,
// which is why routes like /home could sometimes open without a real login.
const TOKEN_KEY = "alfa9_token";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem(TOKEN_KEY);
  const isLoggedIn = !!token;

  if (!isLoggedIn) {
    // Not logged in -> redirect to the auth (login/register) page
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;