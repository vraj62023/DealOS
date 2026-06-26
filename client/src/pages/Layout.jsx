import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../app/features/authSlice';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bot,
  TrendingUp // Added the icon for your Matches page
} from 'lucide-react';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // FINALIZED NAVIGATION ITEMS (Including Lender Matches)
  const navItems = [
    { name: 'PROBE Agent', path: '/dashboard', icon: <Bot size={20} /> },
    { name: 'Data Room', path: '/dashboard/dataroom', icon: <FolderOpen size={20} /> },
    { name: 'Lender Matches', path: '/dashboard/matches', icon: <TrendingUp size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:relative'}
      `}>
        {/* Logo Area */}
        <div className="flex items-center justify-between h-16 px-6 bg-gray-950 border-b border-gray-800">
          <span className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded-md shadow-lg shadow-blue-500/20">
              <LayoutDashboard size={20} />
            </span>
            DealOS
          </span>
          <button className="md:hidden text-gray-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto hide-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)} // Auto-close sidebar on mobile after clicking
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold' 
                  : 'hover:bg-gray-800 hover:text-white font-medium'
                }
              `}
              end={item.path === '/dashboard'}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout Bottom Section */}
        <div className="p-4 bg-gray-950 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.companyName || 'Corporate Profile'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Secure Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm z-10">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors">
            <Menu size={24} />
          </button>
          <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded flex items-center justify-center h-6 w-6">
              <LayoutDashboard size={14} />
            </span>
            DealOS
          </span>
          <div className="w-8" /> {/* Spacer for centering */}
        </header>

        {/* Dynamic Page Content injected here */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 relative">
          <Outlet /> 
        </main>

      </div>
    </div>
  );
}