/**
 * Requests List Page
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, teamsAPI } from '../api/services';
import {
    Plus,
    Search,
    ClipboardList,
    Filter,
    X,
    AlertTriangle,
    Wrench,
    Calendar,
} from 'lucide-react';

export default function Requests() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [requests, setRequests] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        type: searchParams.get('type') || '',
        stage: searchParams.get('stage') || '',
        teamId: searchParams.get('teamId') || '',
        equipmentId: searchParams.get('equipmentId') || '',
    });

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [requestsRes, teamsRes] = await Promise.all([
                requestsAPI.getAll(filters),
                teamsAPI.getAll(),
            ]);

            setRequests(requestsRes.data.requests);
            setTeams(teamsRes.data.teams);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            stage: '',
            teamId: '',
            equipmentId: '',
        });
        setSearchParams({});
    };

    const activeFiltersCount = Object.values(filters).filter((v) => v).length;

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

    const getPriorityIcon = (priority) => {
        const colors = {
            1: 'text-gray-400',
            2: 'text-blue-500',
            3: 'text-amber-500',
            4: 'text-red-500',
        };
        return colors[priority] || 'text-gray-400';
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Critical',
        };
        return labels[priority] || 'Low';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Maintenance Requests
                    </h1>
                    <p className="text-gray-500 mt-1">Track and manage all requests</p>
                </div>
                <Link to="/requests/new" className="btn btn-primary">
                    <Plus className="w-5 h-5" />
                    New Request
                </Link>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} relative`}
                    >
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilters({ ...filters, stage: '' })}
                            className={`btn btn-sm ${!filters.stage ? 'btn-primary' : 'btn-secondary'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, stage: 'NEW' })}
                            className={`btn btn-sm ${filters.stage === 'NEW' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            New
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, stage: 'IN_PROGRESS' })}
                            className={`btn btn-sm ${filters.stage === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            In Progress
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, stage: 'REPAIRED' })}
                            className={`btn btn-sm ${filters.stage === 'REPAIRED' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            Repaired
                        </button>
                        <button
                            onClick={() => setFilters({ ...filters, stage: 'SCRAP' })}
                            className={`btn btn-sm ${filters.stage === 'SCRAP' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            Scrap
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) =>
                                    setFilters({ ...filters, type: e.target.value })
                                }
                                className="select"
                            >
                                <option value="">All Types</option>
                                <option value="CORRECTIVE">Corrective (Breakdown)</option>
                                <option value="PREVENTIVE">Preventive (Scheduled)</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Team</label>
                            <select
                                value={filters.teamId}
                                onChange={(e) =>
                                    setFilters({ ...filters, teamId: e.target.value })
                                }
                                className="select"
                            >
                                <option value="">All Teams</option>
                                {teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {activeFiltersCount > 0 && (
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Requests list */}
            {loading ? (
                <div className="card">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className="skeleton h-10 w-10 rounded-lg" />
                                <div className="flex-1">
                                    <div className="skeleton h-5 w-1/3 mb-2" />
                                    <div className="skeleton h-4 w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="card p-12 text-center">
                    <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No requests found
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {activeFiltersCount > 0
                            ? 'Try adjusting your filters'
                            : 'Create your first maintenance request'}
                    </p>
                    {activeFiltersCount === 0 && (
                        <Link to="/requests/new" className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            New Request
                        </Link>
                    )}
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Request</th>
                                    <th>Equipment</th>
                                    <th>Type</th>
                                    <th>Priority</th>
                                    <th>Stage</th>
                                    <th>Assigned To</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <Link
                                                to={`/requests/${request.id}`}
                                                className="flex items-center gap-3"
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
                                                <div>
                                                    <p className="font-medium text-gray-900 hover:text-brand-600">
                                                        {request.subject}
                                                    </p>
                                                    {request.isOverdue && (
                                                        <p className="text-xs text-red-500">Overdue</p>
                                                    )}
                                                </div>
                                            </Link>
                                        </td>
                                        <td>
                                            <Link
                                                to={`/equipment/${request.equipment?.id}`}
                                                className="text-gray-600 hover:text-brand-600"
                                            >
                                                {request.equipment?.name}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`badge ${getTypeBadge(request.type)}`}>
                                                {request.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-2 h-2 rounded-full ${request.priority === 4
                                                            ? 'bg-red-500'
                                                            : request.priority === 3
                                                                ? 'bg-amber-500'
                                                                : request.priority === 2
                                                                    ? 'bg-blue-500'
                                                                    : 'bg-gray-400'
                                                        }`}
                                                />
                                                {getPriorityLabel(request.priority)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${getStageBadge(request.stage)}`}>
                                                {request.stage.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            {request.technician ? (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={request.technician.avatar}
                                                        alt={request.technician.name}
                                                        className="w-6 h-6 rounded-full"
                                                    />
                                                    <span className="text-sm text-gray-600">
                                                        {request.technician.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="text-gray-500">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
