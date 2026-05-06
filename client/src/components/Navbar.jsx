import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <Link to="/dashboard" className="text-xl font-bold tracking-wide">
        🎓 AttendAI
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm bg-indigo-500 px-3 py-1 rounded-full capitalize">{user?.role}</span>
        <span className="text-sm hidden sm:block">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="bg-white text-indigo-700 text-sm font-semibold px-3 py-1 rounded hover:bg-indigo-100 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
