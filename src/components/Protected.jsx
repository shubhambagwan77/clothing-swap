import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

// Only lets logged in users (or admins, with the admin prop) see a page
export default function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
