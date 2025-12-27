/**
 * Team Detail Page
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamsAPI, usersAPI } from '../api/services';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Users,
    Cog,
    ClipboardList,
    Plus,
    X,
    UserMinus,
} from 'lucide-react';

export default function TeamDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [technicians, setTechnicians] = useState([]);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTeam();
        fetchTechnicians();
    }, [id]);

    const fetchTeam = async () => {
        try {
            const response = await teamsAPI.getById(id);
            setTeam(response.data.team);
            setEditName(response.data.team.name);
        } catch (error) {
            console.error('Failed to fetch team:', error);
            toast.error('Team not found');
            navigate('/teams');
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async () => {
        try {
            const response = await usersAPI.getAll({ role: 'TECHNICIAN' });
            setTechnicians(response.data.users);
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return;

        setSaving(true);
        try {
            await teamsAPI.update(id, { name: editName.trim() });
            toast.success('Team updated');
            setShowEditModal(false);
            fetchTeam();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!confirm('Are you sure you want to delete this team?')) return;

        try {
            await teamsAPI.delete(id);
            toast.success('Team deleted');
            navigate('/teams');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedTechnician) return;

        setSaving(true);
        try {
            await teamsAPI.addMember(id, selectedTechnician);
            toast.success('Member added');
            setShowAddMemberModal(false);
            setSelectedTechnician('');
            fetchTeam();
            fetchTechnicians();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add member');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (userId, userName) => {
        if (!confirm(`Remove ${userName} from this team?`)) return;

        try {
            await teamsAPI.removeMember(id, userId);
            toast.success('Member removed');
            fetchTeam();
            fetchTechnicians();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove member');
        }
    };

    const getStageBadge = (stage) => {
        const styles = {
            NEW: 'stage-new',
            IN_PROGRESS: 'stage-in-progress',
            REPAIRED: 'stage-repaired',
            SCRAP: 'stage-scrap',
        };
        return styles[stage] || 'badge-gray';
    };

    // Get technicians not in this team
    const availableTechnicians = technicians.filter(
        (t) => !t.teamId || t.teamId !== id
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    <div className="skeleton h-6 w-1/3 mb-4" />
                    <div className="skeleton h-4 w-1/2" />
                </div>
            </div>
        );
    }

    if (!team) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/teams')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                    <p className="text-gray-500">Maintenance Team</p>
                </div>
                {isManager() && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowEditModal(true)}
                            className="btn btn-secondary"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </button>
                        <button onClick={handleDeleteTeam} className="btn btn-danger">
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Team Members */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Team Members
                            </h2>
                            {isManager() && (
                                <button
                                    onClick={() => setShowAddMemberModal(true)}
                                    className="btn btn-sm btn-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Member
                                </button>
                            )}
                        </div>
                        {team.members?.length === 0 ? (
                            <div className="p-8 text-center">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No team members yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {team.members?.map((member) => (
                                    <div
                                        key={member.id}
                                        className="px-6 py-4 flex items-center gap-4"
                                    >
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                            <p className="text-sm text-gray-500">{member.email}</p>
                                        </div>
                                        <span className="badge badge-blue">{member.role}</span>
                                        {isManager() && (
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove from team"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Open Requests */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Open Requests
                            </h2>
                        </div>
                        {team.requests?.length === 0 ? (
                            <div className="p-8 text-center">
                                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No open requests</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {team.requests?.map((request) => (
                                    <Link
                                        key={request.id}
                                        to={`/requests/${request.id}`}
                                        className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {request.subject}
                                            </p>
                                            <p className="text-sm text-gray-500">{request.type}</p>
                                        </div>
                                        <span className={`badge ${getStageBadge(request.stage)}`}>
                                            {request.stage.replace('_', ' ')}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Overview</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Users className="w-4 h-4" />
                                    Members
                                </div>
                                <span className="font-semibold text-gray-900">
                                    {team.members?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Cog className="w-4 h-4" />
                                    Equipment
                                </div>
                                <span className="font-semibold text-gray-900">
                                    {team.equipment?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <ClipboardList className="w-4 h-4" />
                                    Open Requests
                                </div>
                                <span className="font-semibold text-gray-900">
                                    {team.requests?.length || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Equipment List */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                            Assigned Equipment
                        </h3>
                        {team.equipment?.length === 0 ? (
                            <p className="text-sm text-gray-500">No assigned equipment</p>
                        ) : (
                            <div className="space-y-3">
                                {team.equipment?.slice(0, 5).map((eq) => (
                                    <Link
                                        key={eq.id}
                                        to={`/equipment/${eq.id}`}
                                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                            <Cog className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {eq.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {eq.serialNumber}
                                            </p>
                                        </div>
                                        {eq.isScrapped && (
                                            <span className="badge badge-red text-xs">Scrapped</span>
                                        )}
                                    </Link>
                                ))}
                                {team.equipment?.length > 5 && (
                                    <Link
                                        to={`/equipment?teamId=${id}`}
                                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                                    >
                                        View all {team.equipment.length} equipment
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Edit Team</h2>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTeam} className="p-6">
                            <div className="mb-6">
                                <label htmlFor="editTeamName" className="label">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    id="editTeamName"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowAddMemberModal(false)}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Add Team Member
                            </h2>
                            <button
                                onClick={() => setShowAddMemberModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6">
                            <div className="mb-6">
                                <label htmlFor="technician" className="label">
                                    Select Technician
                                </label>
                                {availableTechnicians.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No available technicians. All technicians are already
                                        assigned to teams.
                                    </p>
                                ) : (
                                    <select
                                        id="technician"
                                        value={selectedTechnician}
                                        onChange={(e) => setSelectedTechnician(e.target.value)}
                                        className="select"
                                        required
                                    >
                                        <option value="">Choose a technician</option>
                                        {availableTechnicians.map((tech) => (
                                            <option key={tech.id} value={tech.id}>
                                                {tech.name} ({tech.email})
                                                {tech.team && ` - Currently in ${tech.team.name}`}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddMemberModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || availableTechnicians.length === 0}
                                    className="btn btn-primary"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Add Member'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
