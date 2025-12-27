/**
 * Equipment List Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { equipmentAPI, teamsAPI } from '../api/services';
import {
    Plus,
    Search,
    Cog,
    MapPin,
    Calendar,
    Users,
    AlertTriangle,
    Filter,
    X,
} from 'lucide-react';

export default function Equipment() {
    const { isManager } = useAuth();
    const [equipment, setEquipment] = useState([]);
    const [teams, setTeams] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        department: '',
        teamId: '',
        isScrapped: 'false',
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [equipmentRes, teamsRes, deptRes] = await Promise.all([
                equipmentAPI.getAll({ ...filters, search: search || undefined }),
                teamsAPI.getAll(),
                equipmentAPI.getDepartments(),
            ]);

            setEquipment(equipmentRes.data.equipment);
            setTeams(teamsRes.data.teams);
            setDepartments(deptRes.data.departments);
        } catch (error) {
            console.error('Failed to fetch equipment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchData();
    };

    const clearFilters = () => {
        setFilters({
            department: '',
            teamId: '',
            isScrapped: 'false',
        });
        setSearch('');
    };

    const activeFiltersCount = Object.values(filters).filter(
        (v) => v && v !== 'false'
    ).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Equipment</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your equipment and assets
                    </p>
                </div>
                {isManager() && (
                    <Link to="/equipment/new" className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Add Equipment
                    </Link>
                )}
            </div>

            {/* Search and filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, serial number, or employee..."
                                className="input pl-10"
                            />
                        </div>
                    </form>
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
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Department</label>
                            <select
                                value={filters.department}
                                onChange={(e) =>
                                    setFilters({ ...filters, department: e.target.value })
                                }
                                className="select"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="label">Maintenance Team</label>
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
                        <div>
                            <label className="label">Status</label>
                            <select
                                value={filters.isScrapped}
                                onChange={(e) =>
                                    setFilters({ ...filters, isScrapped: e.target.value })
                                }
                                className="select"
                            >
                                <option value="false">Active</option>
                                <option value="true">Scrapped</option>
                                <option value="">All</option>
                            </select>
                        </div>
                        {activeFiltersCount > 0 && (
                            <div className="sm:col-span-3">
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

            {/* Equipment list */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-3/4 mb-2" />
                            <div className="skeleton h-4 w-1/2 mb-4" />
                            <div className="skeleton h-4 w-full mb-2" />
                            <div className="skeleton h-4 w-2/3" />
                        </div>
                    ))}
                </div>
            ) : equipment.length === 0 ? (
                <div className="card p-12 text-center">
                    <Cog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No equipment found
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {search || activeFiltersCount > 0
                            ? 'Try adjusting your search or filters'
                            : 'Get started by adding your first equipment'}
                    </p>
                    {isManager() && !search && activeFiltersCount === 0 && (
                        <Link to="/equipment/new" className="btn btn-primary">
                            <Plus className="w-5 h-5" />
                            Add Equipment
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {equipment.map((eq) => (
                        <Link
                            key={eq.id}
                            to={`/equipment/${eq.id}`}
                            className="card-hover p-6 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${eq.isScrapped
                                            ? 'bg-red-100'
                                            : eq.openRequestsCount > 0
                                                ? 'bg-amber-100'
                                                : 'bg-brand-100'
                                        }`}
                                >
                                    <Cog
                                        className={`w-6 h-6 ${eq.isScrapped
                                                ? 'text-red-500'
                                                : eq.openRequestsCount > 0
                                                    ? 'text-amber-500'
                                                    : 'text-brand-600'
                                            }`}
                                    />
                                </div>
                                {eq.isScrapped ? (
                                    <span className="badge badge-red">Scrapped</span>
                                ) : eq.openRequestsCount > 0 ? (
                                    <span className="badge badge-yellow">
                                        {eq.openRequestsCount} open
                                    </span>
                                ) : null}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                                {eq.name}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{eq.serialNumber}</p>

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    {eq.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    {eq.team?.name}
                                </div>
                                {eq.warrantyEndDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        Warranty: {new Date(eq.warrantyEndDate).toLocaleDateString()}
                                        {new Date(eq.warrantyEndDate) < new Date() && (
                                            <AlertTriangle className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="badge badge-gray">{eq.department}</span>
                                {eq.assignedEmployee && (
                                    <span className="text-xs text-gray-500">
                                        {eq.assignedEmployee}
                                    </span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
