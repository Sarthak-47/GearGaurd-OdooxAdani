/**
 * Request Detail Page
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, usersAPI } from '../api/services';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Wrench,
    Cog,
    Users,
    Calendar,
    Clock,
    User,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Play,
    UserPlus,
} from 'lucide-react';

export default function RequestDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isManager, isTechnician } = useAuth();
    const [request, setRequest] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [selectedTechnician, setSelectedTechnician] = useState('');
    const [duration, setDuration] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchRequest();
    }, [id]);

    const fetchRequest = async () => {
        try {
            const response = await requestsAPI.getById(id);
            setRequest(response.data.request);

            // Fetch technicians for assignment
            if (response.data.request.team?.id) {
                const techRes = await usersAPI.getTechnicians({
                    teamId: response.data.request.team.id,
                });
                setTechnicians(techRes.data.technicians);
            }
        } catch (error) {
            console.error('Failed to fetch request:', error);
            toast.error('Request not found');
            navigate('/requests');
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (newStage) => {
        if (newStage === 'SCRAP') {
            if (
                !confirm(
                    'Moving to SCRAP will mark the equipment as scrapped. This action cannot be undone. Continue?'
                )
            ) {
                return;
            }
        }

        try {
            await requestsAPI.updateStage(id, newStage);
            toast.success(`Stage updated to ${newStage.replace('_', ' ')}`);
            fetchRequest();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update stage');
        }
    };

    const handleAssign = async () => {
        setSaving(true);
        try {
            // Self-assign for technicians
            const techId =
                isTechnician() && !selectedTechnician ? user.id : selectedTechnician;
            await requestsAPI.assign(id, techId);
            toast.success('Technician assigned');
            setShowAssignModal(false);
            setSelectedTechnician('');
            fetchRequest();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to assign');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await requestsAPI.complete(id, {
                duration: duration ? parseFloat(duration) : undefined,
                notes: notes || undefined,
            });
            toast.success('Request completed');
            setShowCompleteModal(false);
            fetchRequest();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this request?')) return;

        try {
            await requestsAPI.delete(id);
            toast.success('Request deleted');
            navigate('/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
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

    const canAssignSelf =
        isTechnician() &&
        !request?.technicianId &&
        request?.teamId === user?.teamId &&
        request?.stage === 'NEW';

    const canComplete =
        (isTechnician() && request?.technicianId === user?.id) || isManager();

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    <div className="skeleton h-6 w-1/3 mb-4" />
                    <div className="skeleton h-4 w-1/2 mb-2" />
                    <div className="skeleton h-4 w-2/3" />
                </div>
            </div>
        );
    }

    if (!request) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <button
                    onClick={() => navigate('/requests')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {request.subject}
                        </h1>
                        <span className={`badge ${getStageBadge(request.stage)}`}>
                            {request.stage.replace('_', ' ')}
                        </span>
                        <span
                            className={`badge ${request.type === 'CORRECTIVE' ? 'badge-red' : 'badge-purple'
                                }`}
                        >
                            {request.type}
                        </span>
                        {request.isOverdue && (
                            <span className="badge badge-red flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Overdue
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 mt-1">
                        Created {new Date(request.createdAt).toLocaleString()} by{' '}
                        {request.createdBy?.name}
                    </p>
                </div>
                {isManager() && request.stage === 'NEW' && (
                    <button onClick={handleDelete} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    {request.description && (
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                Description
                            </h2>
                            <p className="text-gray-600 whitespace-pre-wrap">
                                {request.description}
                            </p>
                        </div>
                    )}

                    {/* Details */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Request Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Cog className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Equipment</p>
                                    <Link
                                        to={`/equipment/${request.equipment?.id}`}
                                        className="font-medium text-brand-600 hover:text-brand-700"
                                    >
                                        {request.equipment?.name}
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Maintenance Team</p>
                                    <Link
                                        to={`/teams/${request.team?.id}`}
                                        className="font-medium text-brand-600 hover:text-brand-700"
                                    >
                                        {request.team?.name}
                                    </Link>
                                </div>
                            </div>

                            {request.scheduledDate && (
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Scheduled Date</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(request.scheduledDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {request.duration && (
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Duration</p>
                                        <p className="font-medium text-gray-900">
                                            {request.duration} hours
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Assigned Technician</p>
                                    {request.technician ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <img
                                                src={request.technician.avatar}
                                                alt={request.technician.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className="font-medium text-gray-900">
                                                {request.technician.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="font-medium text-gray-400">Unassigned</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.priority === 4
                                            ? 'bg-red-100'
                                            : request.priority === 3
                                                ? 'bg-amber-100'
                                                : request.priority === 2
                                                    ? 'bg-blue-100'
                                                    : 'bg-gray-100'
                                        }`}
                                >
                                    <AlertTriangle
                                        className={`w-5 h-5 ${request.priority === 4
                                                ? 'text-red-500'
                                                : request.priority === 3
                                                    ? 'text-amber-500'
                                                    : request.priority === 2
                                                        ? 'text-blue-500'
                                                        : 'text-gray-500'
                                            }`}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Priority</p>
                                    <p className="font-medium text-gray-900">
                                        {request.priority === 4
                                            ? 'Critical'
                                            : request.priority === 3
                                                ? 'High'
                                                : request.priority === 2
                                                    ? 'Medium'
                                                    : 'Low'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {request.notes && (
                        <div className="card p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                                Notes & Logs
                            </h2>
                            <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-lg">
                                {request.notes}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Sidebar - Actions */}
                <div className="space-y-6">
                    {/* Stage Actions */}
                    {!['REPAIRED', 'SCRAP'].includes(request.stage) && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
                            <div className="space-y-3">
                                {/* Self-assign for technicians */}
                                {canAssignSelf && (
                                    <button
                                        onClick={handleAssign}
                                        className="btn btn-primary w-full"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Assign to Me
                                    </button>
                                )}

                                {/* Manager can assign anyone */}
                                {isManager() && !request.technicianId && (
                                    <button
                                        onClick={() => setShowAssignModal(true)}
                                        className="btn btn-secondary w-full"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Assign Technician
                                    </button>
                                )}

                                {/* Start work */}
                                {request.stage === 'NEW' &&
                                    request.technicianId &&
                                    (request.technicianId === user?.id || isManager()) && (
                                        <button
                                            onClick={() => handleStageChange('IN_PROGRESS')}
                                            className="btn btn-primary w-full"
                                        >
                                            <Play className="w-4 h-4" />
                                            Start Work
                                        </button>
                                    )}

                                {/* Complete */}
                                {request.stage === 'IN_PROGRESS' && canComplete && (
                                    <button
                                        onClick={() => setShowCompleteModal(true)}
                                        className="btn btn-success w-full"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark as Repaired
                                    </button>
                                )}

                                {/* Scrap */}
                                {request.stage === 'IN_PROGRESS' && (isManager() || isTechnician()) && (
                                    <button
                                        onClick={() => handleStageChange('SCRAP')}
                                        className="btn btn-danger w-full"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Mark as Scrap
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Timeline</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Created</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(request.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            {request.technicianId && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Assigned
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {request.technician?.name}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {request.stage === 'REPAIRED' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Completed
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(request.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {request.stage === 'SCRAP' && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                                        <XCircle className="w-4 h-4 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Scrapped</p>
                                        <p className="text-xs text-gray-500">
                                            Equipment marked as scrapped
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Members */}
                    {request.team?.members && request.team.members.length > 0 && (
                        <div className="card p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Team Members
                            </h3>
                            <div className="space-y-3">
                                {request.team.members.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="text-sm font-medium text-gray-900">
                                            {member.name}
                                        </span>
                                        {member.id === request.technicianId && (
                                            <span className="badge badge-green text-xs">Assigned</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowAssignModal(false)}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Assign Technician
                            </h2>
                        </div>
                        <div className="p-6">
                            <label className="label">Select Technician</label>
                            <select
                                value={selectedTechnician}
                                onChange={(e) => setSelectedTechnician(e.target.value)}
                                className="select"
                            >
                                <option value="">Choose a technician</option>
                                {technicians.map((tech) => (
                                    <option key={tech.id} value={tech.id}>
                                        {tech.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssign}
                                    disabled={saving || !selectedTechnician}
                                    className="btn btn-primary"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Assign'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Complete Modal */}
            {showCompleteModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowCompleteModal(false)}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Complete Request
                            </h2>
                        </div>
                        <form onSubmit={handleComplete} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="duration" className="label">
                                    Duration (hours)
                                </label>
                                <input
                                    type="number"
                                    id="duration"
                                    step="0.5"
                                    min="0"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="input"
                                    placeholder="e.g., 2.5"
                                />
                            </div>
                            <div>
                                <label htmlFor="notes" className="label">
                                    Completion Notes
                                </label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input min-h-[100px]"
                                    placeholder="Describe what was done..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCompleteModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-success"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Mark as Repaired
                                        </>
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
