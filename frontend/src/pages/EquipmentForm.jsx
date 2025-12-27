/**
 * Equipment Form Page
 * Create or edit equipment
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipmentAPI, teamsAPI } from '../api/services';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function EquipmentForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [teams, setTeams] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        serialNumber: '',
        department: '',
        assignedEmployee: '',
        purchaseDate: '',
        warrantyEndDate: '',
        location: '',
        teamId: '',
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const teamsRes = await teamsAPI.getAll();
            setTeams(teamsRes.data.teams);

            if (isEdit) {
                const equipmentRes = await equipmentAPI.getById(id);
                const eq = equipmentRes.data.equipment;
                setFormData({
                    name: eq.name,
                    serialNumber: eq.serialNumber,
                    department: eq.department,
                    assignedEmployee: eq.assignedEmployee || '',
                    purchaseDate: eq.purchaseDate?.split('T')[0] || '',
                    warrantyEndDate: eq.warrantyEndDate?.split('T')[0] || '',
                    location: eq.location,
                    teamId: eq.teamId,
                });
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (isEdit) {
                await equipmentAPI.update(id, formData);
                toast.success('Equipment updated');
            } else {
                await equipmentAPI.create(formData);
                toast.success('Equipment created');
            }
            navigate('/equipment');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="skeleton h-8 w-48" />
                <div className="card p-6">
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i}>
                                <div className="skeleton h-4 w-24 mb-2" />
                                <div className="skeleton h-10 w-full" />
                            </div>
                        ))}
                    </div>
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
                        {isEdit ? 'Edit Equipment' : 'Add Equipment'}
                    </h1>
                    <p className="text-gray-500">
                        {isEdit
                            ? 'Update equipment information'
                            : 'Add new equipment to track'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                        <label htmlFor="name" className="label">
                            Equipment Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., CNC Milling Machine"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="serialNumber" className="label">
                            Serial Number *
                        </label>
                        <input
                            type="text"
                            id="serialNumber"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., CNC-2024-001"
                            required
                            disabled={isEdit}
                        />
                        {isEdit && (
                            <p className="text-xs text-gray-500 mt-1">
                                Serial number cannot be changed
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="department" className="label">
                            Department *
                        </label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Manufacturing"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="location" className="label">
                            Location *
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., Building A - Floor 1"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="teamId" className="label">
                            Maintenance Team *
                        </label>
                        <select
                            id="teamId"
                            name="teamId"
                            value={formData.teamId}
                            onChange={handleChange}
                            className="select"
                            required
                        >
                            <option value="">Select a team</option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="assignedEmployee" className="label">
                            Assigned Employee
                        </label>
                        <input
                            type="text"
                            id="assignedEmployee"
                            name="assignedEmployee"
                            value={formData.assignedEmployee}
                            onChange={handleChange}
                            className="input"
                            placeholder="e.g., John Smith"
                        />
                    </div>

                    <div>
                        <label htmlFor="purchaseDate" className="label">
                            Purchase Date *
                        </label>
                        <input
                            type="date"
                            id="purchaseDate"
                            name="purchaseDate"
                            value={formData.purchaseDate}
                            onChange={handleChange}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="warrantyEndDate" className="label">
                            Warranty End Date
                        </label>
                        <input
                            type="date"
                            id="warrantyEndDate"
                            name="warrantyEndDate"
                            value={formData.warrantyEndDate}
                            onChange={handleChange}
                            className="input"
                        />
                    </div>
                </div>

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
                                {isEdit ? 'Save Changes' : 'Create Equipment'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
