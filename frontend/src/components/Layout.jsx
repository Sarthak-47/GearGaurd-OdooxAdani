/**
 * Main Layout Component
 * Includes sidebar navigation and header
 */

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Wrench,
    Cog,
    Users,
    ClipboardList,
    Kanban,
    Calendar,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Equipment', href: '/equipment', icon: Cog },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Requests', href: '/requests', icon: ClipboardList },
    { name: 'Kanban Board', href: '/kanban', icon: Kanban },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'MANAGER':
                return 'bg-purple-100 text-purple-800';
            case 'TECHNICIAN':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">GearGuard</h1>
                            <p className="text-xs text-gray-500 -mt-0.5">Maintenance Manager</p>
                        </div>
                    </div>
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 px-2 py-2">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-10 h-10 rounded-full bg-gray-200"
                            />
                        ) : (
                            <div className="avatar avatar-lg">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
                    <button
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Right side */}
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Role badge */}
                        <span className={`badge ${getRoleBadgeColor(user?.role)}`}>
                            {user?.role}
                        </span>

                        {/* User dropdown */}
                        <div className="relative">
                            <button
                                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                            >
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-8 h-8 rounded-full bg-gray-200"
                                    />
                                ) : (
                                    <div className="avatar">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setUserMenuOpen(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-dropdown border border-gray-100 py-1 z-20 animate-fade-in">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">
                                                {user?.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
