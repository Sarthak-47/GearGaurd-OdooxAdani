/**
 * Main App Component
 * Sets up routing and layout structure
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentDetail from './pages/EquipmentDetail';
import EquipmentForm from './pages/EquipmentForm';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import RequestForm from './pages/RequestForm';
import KanbanBoard from './pages/KanbanBoard';
import Calendar from './pages/Calendar';

// Loading spinner
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <p className="text-gray-600 font-medium">Loading GearGuard...</p>
            </div>
        </div>
    );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                }
            />
            <Route
                path="/register"
                element={
                    <PublicRoute>
                        <Register />
                    </PublicRoute>
                }
            />

            {/* Protected routes with layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Dashboard />} />

                {/* Equipment routes */}
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/equipment/new" element={<EquipmentForm />} />
                <Route path="/equipment/:id" element={<EquipmentDetail />} />
                <Route path="/equipment/:id/edit" element={<EquipmentForm />} />

                {/* Team routes */}
                <Route path="/teams" element={<Teams />} />
                <Route path="/teams/:id" element={<TeamDetail />} />

                {/* Request routes */}
                <Route path="/requests" element={<Requests />} />
                <Route path="/requests/new" element={<RequestForm />} />
                <Route path="/requests/:id" element={<RequestDetail />} />

                {/* Special views */}
                <Route path="/kanban" element={<KanbanBoard />} />
                <Route path="/calendar" element={<Calendar />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
