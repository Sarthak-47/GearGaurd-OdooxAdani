/**
 * Equipment Detail Page
 * Shows equipment info with smart button for maintenance requests
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { equipmentAPI, requestsAPI } from '../api/services';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Cog,
    MapPin,
    Calendar,
    Users,
    User,
    Wrench,
    AlertTriangle,
    ClipboardList,
    Plus,
} from 'lucide-react';

export default function EquipmentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const [equipment, setEquipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchEquipment();
    }, [id]);

    const fetchEquipment = async () => {
        try {
            const response = await equipmentAPI.getById(id);
            setEquipment(response.data.equipment);
        } catch (error) {
            console.error('Failed to fetch equipment:', error);
            toast.error('Equipment not found');
            navigate('/equipment');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this equipment?')) return;

        setDeleting(true);
        try {
            await equipmentAPI.delete(id);
            toast.success('Equipment deleted');
            navigate('/equipment');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        } finally {
            setDeleting(false);
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

    if (!equipment) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/equipment')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {equipment.name}
                        </h1>
                        {equipment.isScrapped && (
                            <span className="badge badge-red">Scrapped</span>
                        )}
                    </div>
                    <p className="text-gray-500">{equipment.serialNumber}</p>
                </div>

                {/* ODOO-STYLE SMART BUTTON - Maintenance */}
                <Link
                    to={`/requests?equipmentId=${id}`}
                    className="relative flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-brand-600 hover:to-brand-700 transition-all group"
                >
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-white/80 font-medium">Maintenance</p>
                        <p className="text-lg font-bold">
                            {equipment.openRequestsCount || 0} Open
                        </p>
                    </div>
                    {/* Badge for open requests */}
                    {equipment.openRequestsCount > 0 && (
                        <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            {equipment.openRequestsCount}
                        </span>
                    )}
                </Link>

                {isManager() && !equipment.isScrapped && (
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/equipment/${id}/edit`}
                            className="btn btn-secondary"
                        >
                            <Edit className="w-4 h-4" />
                            Edit
                        </Link>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="btn btn-danger"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Equipment details */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Equipment Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Location</p>
                                    <p className="font-medium text-gray-900">
                                        {equipment.location}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Cog className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Department</p>
                                    <p className="font-medium text-gray-900">
                                        {equipment.department}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Purchase Date</p>
                                    <p className="font-medium text-gray-900">
                                        {new Date(equipment.purchaseDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Warranty End</p>
                                    <p className="font-medium text-gray-900">
                                        {equipment.warrantyEndDate
                                            ? new Date(equipment.warrantyEndDate).toLocaleDateString()
                                            : 'N/A'}
                                        {equipment.warrantyEndDate &&
                                            new Date(equipment.warrantyEndDate) < new Date() && (
                                                <span className="ml-2 text-red-500 text-sm">
                                                    (Expired)
                                                </span>
                                            )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Maintenance Team</p>
                                    <p className="font-medium text-gray-900">
                                        {equipment.team?.name}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Assigned Employee</p>
                                    <p className="font-medium text-gray-900">
                                        {equipment.assignedEmployee || 'Not assigned'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Maintenance History */}
                    <div className="card">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Maintenance History
                            </h2>
                            {!equipment.isScrapped && (
                                <Link
                                    to={`/requests/new?equipmentId=${id}`}
                                    className="btn btn-sm btn-primary"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Request
                                </Link>
                            )}
                        </div>
                        {equipment.requests?.length === 0 ? (
                            <div className="p-8 text-center">
                                <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No maintenance history</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {equipment.requests?.map((request) => (
                                    <Link
                                        key={request.id}
                                        to={`/requests/${request.id}`}
                                        className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${request.type === 'CORRECTIVE'
                                                ? 'bg-red-100'
                                                : 'bg-purple-100'
                                                }`}
                                        >
                                            <Wrench
                                                className={`w-5 h-5 ${request.type === 'CORRECTIVE'
                                                    ? 'text-red-500'
                                                    : 'text-purple-500'
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {request.subject}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(request.createdAt).toLocaleDateString()} •{' '}
                                                {request.type}
                                            </p>
                                        </div>
                                        <span className={`badge ${getStageBadge(request.stage)}`}>
                                            {request.stage.replace('_', ' ')}
                                        </span>
                                        {request.technician && (
                                            <img
                                                src={request.technician.avatar}
                                                alt={request.technician.name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Smart Button - Maintenance Count */}
                    <Link
                        to={`/requests?equipmentId=${id}`}
                        className="card-hover p-6 flex items-center gap-4"
                    >
                        <div
                            className={`w-14 h-14 rounded-xl flex items-center justify-center ${equipment.openRequestsCount > 0
                                ? 'bg-amber-100'
                                : 'bg-green-100'
                                }`}
                        >
                            <Wrench
                                className={`w-7 h-7 ${equipment.openRequestsCount > 0
                                    ? 'text-amber-600'
                                    : 'text-green-600'
                                    }`}
                            />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Open Requests</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {equipment.openRequestsCount || 0}
                            </p>
                        </div>
                        {equipment.openRequestsCount > 0 && (
                            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
                        )}
                    </Link>

                    {/* Team Members */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">
                            {equipment.team?.name} Team
                        </h3>
                        {equipment.team?.members?.length === 0 ? (
                            <p className="text-sm text-gray-500">No team members</p>
                        ) : (
                            <div className="space-y-3">
                                {equipment.team?.members?.map((member) => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-8 h-8 rounded-full"
                                        />
                                        <span className="text-sm font-medium text-gray-900">
                                            {member.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Warning for scrapped */}
                    {equipment.isScrapped && (
                        <div className="card p-6 bg-red-50 border-red-200">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-red-800">
                                        Equipment Scrapped
                                    </h3>
                                    <p className="text-sm text-red-600 mt-1">
                                        This equipment has been marked as scrapped. No new
                                        maintenance requests can be created.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
