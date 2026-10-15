import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">ClothingSwap 👕</Link>
      <nav>
        <NavLink to="/" end>Browse</NavLink>
        {user && <NavLink to="/sell">List an item</NavLink>}
        {user && <NavLink to="/dashboard">Dashboard</NavLink>}
        {user && user.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user ? (
          <button type="button" className="link-btn" onClick={handleLogout}>
            Logout ({user.name.split(' ')[0]})
          </button>
        ) : (
          <NavLink to="/login">Login</NavLink>
        )}
      </nav>
    </header>
  );
}
