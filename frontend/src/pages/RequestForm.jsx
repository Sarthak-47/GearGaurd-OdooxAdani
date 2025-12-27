/**
 * Request Form Page
 * Create new maintenance request
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI, equipmentAPI, usersAPI } from '../api/services';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function RequestForm() {
    const navigate = useNavigate();
    const { user, isManager } = useAuth();
    const [searchParams] = useSearchParams();
    const preselectedEquipmentId = searchParams.get('equipmentId');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [equipment, setEquipment] = useState([]);
    const [selectedEquipment, setSelectedEquipment] = useState(null);
    const [technicians, setTechnicians] = useState([]);

    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        type: 'CORRECTIVE',
        priority: 2,
        equipmentId: preselectedEquipmentId || '',
        scheduledDate: '',
        technicianId: '',
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // When equipment is selected, fetch team's technicians
        if (formData.equipmentId) {
            const eq = equipment.find((e) => e.id === formData.equipmentId);
            setSelectedEquipment(eq);

            if (eq?.teamId) {
                fetchTechnicians(eq.teamId);
            }
        } else {
            setSelectedEquipment(null);
            setTechnicians([]);
        }
    }, [formData.equipmentId, equipment]);

    const fetchData = async () => {
        try {
            const equipmentRes = await equipmentAPI.getAll({ isScrapped: 'false' });
            setEquipment(equipmentRes.data.equipment);

            // If preselected equipment, set it
            if (preselectedEquipmentId) {
                const eq = equipmentRes.data.equipment.find(
                    (e) => e.id === preselectedEquipmentId
                );
                if (eq) {
                    setSelectedEquipment(eq);
                    fetchTechnicians(eq.teamId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTechnicians = async (teamId) => {
        try {
            const response = await usersAPI.getTechnicians({ teamId });
            setTechnicians(response.data.technicians);
        } catch (error) {
            console.error('Failed to fetch technicians:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = {
                ...formData,
                priority: parseInt(formData.priority),
                technicianId: formData.technicianId || undefined,
                scheduledDate: formData.scheduledDate || undefined,
            };

            await requestsAPI.create(data);
            toast.success('Request created successfully');
            navigate('/requests');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create request');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="mb-4">
                            <div className="skeleton h-4 w-24 mb-2" />
                            <div className="skeleton h-10 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        New Maintenance Request
                    </h1>
                    <p className="text-gray-500">Report a breakdown or schedule maintenance</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                {/* Type Selection */}
                <div>
                    <label className="label">Request Type *</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'CORRECTIVE' })}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${formData.type === 'CORRECTIVE'
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <p className="font-semibold text-gray-900">Corrective</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Something is broken and needs repair
                            </p>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'PREVENTIVE' })}
                            disabled={!isManager()}
                            className={`p-4 rounded-lg border-2 text-left transition-all ${formData.type === 'PREVENTIVE'
                                    ? 'border-purple-500 bg-purple-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                } ${!isManager() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <p className="font-semibold text-gray-900">Preventive</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Scheduled routine maintenance
                            </p>
                            {!isManager() && (
                                <p className="text-xs text-amber-600 mt-2">
                                    Only managers can create preventive requests
                                </p>
                            )}
                        </button>
                    </div>
                </div>

                {/* Subject */}
                <div>
                    <label htmlFor="subject" className="label">
                        Subject *
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="input"
                        placeholder="e.g., Machine making strange noise"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="description" className="label">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="input min-h-[100px]"
                        placeholder="Describe the issue or maintenance needed..."
                    />
                </div>

                {/* Equipment Selection */}
                <div>
                    <label htmlFor="equipmentId" className="label">
                        Equipment *
                    </label>
                    <select
                        id="equipmentId"
                        name="equipmentId"
                        value={formData.equipmentId}
                        onChange={handleChange}
                        className="select"
                        required
                    >
                        <option value="">Select equipment</option>
                        {equipment.map((eq) => (
                            <option key={eq.id} value={eq.id}>
                                {eq.name} ({eq.serialNumber}) - {eq.department}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Auto-filled Team Info */}
                {selectedEquipment && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-800">
                                    Maintenance Team: {selectedEquipment.team?.name}
                                </p>
                                <p className="text-sm text-blue-600 mt-1">
                                    Location: {selectedEquipment.location}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Priority */}
                <div>
                    <label htmlFor="priority" className="label">
                        Priority
                    </label>
                    <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="select"
                    >
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                        <option value={4}>Critical</option>
                    </select>
                </div>

                {/* Scheduled Date (for Preventive) */}
                {formData.type === 'PREVENTIVE' && (
                    <div>
                        <label htmlFor="scheduledDate" className="label">
                            Scheduled Date *
                        </label>
                        <input
                            type="date"
                            id="scheduledDate"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleChange}
                            className="input"
                            min={new Date().toISOString().split('T')[0]}
                            required={formData.type === 'PREVENTIVE'}
                        />
                    </div>
                )}

                {/* Technician Assignment (optional, for managers) */}
                {isManager() && technicians.length > 0 && (
                    <div>
                        <label htmlFor="technicianId" className="label">
                            Assign Technician (optional)
                        </label>
                        <select
                            id="technicianId"
                            name="technicianId"
                            value={formData.technicianId}
                            onChange={handleChange}
                            className="select"
                        >
                            <option value="">Leave unassigned</option>
                            {technicians.map((tech) => (
                                <option key={tech.id} value={tech.id}>
                                    {tech.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Create Request
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
