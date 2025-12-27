/**
 * Dashboard Page
 * Overview with stats and recent activity
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, equipmentAPI, teamsAPI } from '../api/services';
import {
    Cog,
    Users,
    ClipboardList,
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    ArrowRight,
    Wrench,
} from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, equipmentRes, requestsRes] = await Promise.all([
                requestsAPI.getStats(),
                equipmentAPI.getAll({ isScrapped: 'false' }),
                requestsAPI.getAll({}),
            ]);

            setStats(statsRes.data.stats);
            setEquipment(equipmentRes.data.equipment.slice(0, 5));
            setRequests(requestsRes.data.requests.slice(0, 5));
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Equipment',
            value: equipment.length,
            icon: Cog,
            color: 'bg-blue-500',
            href: '/equipment',
        },
        {
            title: 'Open Requests',
            value: (stats?.byStage?.NEW || 0) + (stats?.byStage?.IN_PROGRESS || 0),
            icon: ClipboardList,
            color: 'bg-amber-500',
            href: '/requests',
        },
        {
            title: 'Completed',
            value: stats?.byStage?.REPAIRED || 0,
            icon: CheckCircle,
            color: 'bg-green-500',
            href: '/requests?stage=REPAIRED',
        },
        {
            title: 'Overdue',
            value: stats?.overdue || 0,
            icon: AlertTriangle,
            color: 'bg-red-500',
            href: '/kanban',
        },
    ];

    const getStageBadge = (stage) => {
        const styles = {
            NEW: 'stage-new',
            IN_PROGRESS: 'stage-in-progress',
            REPAIRED: 'stage-repaired',
            SCRAP: 'stage-scrap',
        };
        return styles[stage] || 'badge-gray';
    };

    const getTypeBadge = (type) => {
        return type === 'CORRECTIVE' ? 'badge-red' : 'badge-purple';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-12 w-12 rounded-lg mb-4" />
                            <div className="skeleton h-4 w-24 mb-2" />
                            <div className="skeleton h-8 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-500 mt-1">
                    Here's what's happening with your maintenance operations today.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => (
                    <Link
                        key={stat.title}
                        to={stat.href}
                        className="card-hover p-6 group"
                    >
                        <div className="flex items-start justify-between">
                            <div
                                className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}
                            >
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-gray-500 text-sm mt-4">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </Link>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request by Type */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Requests by Type
                    </h3>
                    <div className="flex items-center gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-4 h-4 rounded bg-red-500" />
                                <span className="text-sm text-gray-600">Corrective (Breakdown)</span>
                                <span className="ml-auto font-semibold">
                                    {stats?.byType?.CORRECTIVE || 0}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded bg-purple-500" />
                                <span className="text-sm text-gray-600">Preventive (Scheduled)</span>
                                <span className="ml-auto font-semibold">
                                    {stats?.byType?.PREVENTIVE || 0}
                                </span>
                            </div>
                        </div>
                        <div className="w-32 h-32 relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#f3f4f6"
                                    strokeWidth="20"
                                />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    fill="none"
                                    stroke="#ef4444"
                                    strokeWidth="20"
                                    strokeDasharray={`${((stats?.byType?.CORRECTIVE || 0) / ((stats?.byType?.CORRECTIVE || 0) + (stats?.byType?.PREVENTIVE || 1))) * 251.2} 251.2`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">
                                    {(stats?.byType?.CORRECTIVE || 0) + (stats?.byType?.PREVENTIVE || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Requests by Team */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Requests by Team
                    </h3>
                    <div className="space-y-3">
                        {stats?.byTeam?.map((team, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-brand-600" />
                                </div>
                                <span className="text-sm text-gray-600 flex-1">{team.team}</span>
                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-500 rounded-full"
                                        style={{
                                            width: `${(team.count / Math.max(...stats.byTeam.map((t) => t.count), 1)) * 100}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                                    {team.count}
                                </span>
                            </div>
                        ))}
                        {(!stats?.byTeam || stats.byTeam.length === 0) && (
                            <p className="text-sm text-gray-500">No team data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Requests */}
                <div className="card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Recent Requests</h3>
                        <Link
                            to="/requests"
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No requests yet</p>
                            </div>
                        ) : (
                            requests.map((request) => (
                                <Link
                                    key={request.id}
                                    to={`/requests/${request.id}`}
                                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.isOverdue ? 'bg-red-100' : 'bg-gray-100'
                                            }`}
                                    >
                                        {request.isOverdue ? (
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        ) : (
                                            <Wrench className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {request.subject}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {request.equipment?.name}
                                        </p>
                                    </div>
                                    <span className={`badge ${getStageBadge(request.stage)}`}>
                                        {request.stage.replace('_', ' ')}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Equipment with Issues */}
                <div className="card">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Equipment Overview</h3>
                        <Link
                            to="/equipment"
                            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                        >
                            View all <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {equipment.length === 0 ? (
                            <div className="px-6 py-8 text-center">
                                <Cog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No equipment yet</p>
                            </div>
                        ) : (
                            equipment.map((eq) => (
                                <Link
                                    key={eq.id}
                                    to={`/equipment/${eq.id}`}
                                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Cog className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {eq.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {eq.department} • {eq.location}
                                        </p>
                                    </div>
                                    {eq.openRequestsCount > 0 && (
                                        <span className="badge badge-red">
                                            {eq.openRequestsCount} open
                                        </span>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
