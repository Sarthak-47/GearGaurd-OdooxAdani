/**
 * Teams List Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../api/services';
import toast from 'react-hot-toast';
import {
    Plus,
    Users,
    Cog,
    ClipboardList,
    X,
} from 'lucide-react';

export default function Teams() {
    const { isManager } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await teamsAPI.getAll();
            setTeams(response.data.teams);
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        if (!newTeamName.trim()) return;

        setSaving(true);
        try {
            await teamsAPI.create({ name: newTeamName.trim() });
            toast.success('Team created');
            setShowModal(false);
            setNewTeamName('');
            fetchTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create team');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <div className="skeleton h-8 w-48" />
                    <div className="skeleton h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="card p-6">
                            <div className="skeleton h-6 w-1/2 mb-4" />
                            <div className="skeleton h-4 w-3/4 mb-2" />
                            <div className="skeleton h-4 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Maintenance Teams</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your specialized maintenance teams
                    </p>
                </div>
                {isManager() && (
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        Add Team
                    </button>
                )}
            </div>

            {/* Teams grid */}
            {teams.length === 0 ? (
                <div className="card p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        No teams yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Create your first maintenance team
                    </p>
                    {isManager() && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn btn-primary"
                        >
                            <Plus className="w-5 h-5" />
                            Add Team
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => (
                        <Link
                            key={team.id}
                            to={`/teams/${team.id}`}
                            className="card-hover p-6 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                                    <Users className="w-6 h-6 text-brand-600" />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-brand-600 transition-colors mb-4">
                                {team.name}
                            </h3>

                            {/* Team members */}
                            <div className="flex items-center gap-2 mb-4">
                                {team.members?.slice(0, 4).map((member) => (
                                    <img
                                        key={member.id}
                                        src={member.avatar}
                                        alt={member.name}
                                        title={member.name}
                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                    />
                                ))}
                                {team.members?.length > 4 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                        +{team.members.length - 4}
                                    </div>
                                )}
                                {(!team.members || team.members.length === 0) && (
                                    <p className="text-sm text-gray-500">No members yet</p>
                                )}
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {team._count?.members || team.members?.length || 0} members
                                </div>
                                <div className="flex items-center gap-1">
                                    <Cog className="w-4 h-4" />
                                    {team._count?.equipment || 0} equipment
                                </div>
                                <div className="flex items-center gap-1">
                                    <ClipboardList className="w-4 h-4" />
                                    {team._count?.requests || 0} requests
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Team Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Create Team
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="p-6">
                            <div className="mb-6">
                                <label htmlFor="teamName" className="label">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    id="teamName"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    className="input"
                                    placeholder="e.g., Mechanics, Electricians, IT Support"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
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
                                        'Create Team'
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
