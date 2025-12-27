/**
 * Kanban Board Page
 * Drag and drop maintenance requests between stages
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../api/services';
import toast from 'react-hot-toast';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    AlertTriangle,
    Wrench,
    Clock,
    Calendar,
    Plus,
    RefreshCw,
} from 'lucide-react';

const stages = [
    { id: 'NEW', label: 'New', color: 'blue' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'amber' },
    { id: 'REPAIRED', label: 'Repaired', color: 'green' },
    { id: 'SCRAP', label: 'Scrap', color: 'red' },
];

// Sortable Card Component
function SortableCard({ request }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: request.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="kanban-card"
        >
            <RequestCard request={request} />
        </div>
    );
}

// Request Card Content
function RequestCard({ request }) {
    const getTypeBadge = (type) => {
        return type === 'CORRECTIVE' ? 'badge-red' : 'badge-purple';
    };

    const getPriorityIndicator = (priority) => {
        const colors = {
            1: 'bg-gray-300',
            2: 'bg-blue-400',
            3: 'bg-amber-400',
            4: 'bg-red-500',
        };
        return colors[priority] || 'bg-gray-300';
    };

    return (
        <Link to={`/requests/${request.id}`} className="block">
            <div className="flex items-start justify-between gap-2 mb-3">
                <span className={`badge ${getTypeBadge(request.type)} text-xs`}>
                    {request.type}
                </span>
                {request.isOverdue && (
                    <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Overdue
                    </span>
                )}
            </div>

            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {request.subject}
            </h4>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Wrench className="w-3 h-3" />
                <span className="truncate">{request.equipment?.name}</span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                    <div
                        className={`w-2 h-2 rounded-full ${getPriorityIndicator(
                            request.priority
                        )}`}
                    />
                    {request.scheduledDate && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(request.scheduledDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                {request.technician ? (
                    <img
                        src={request.technician.avatar}
                        alt={request.technician.name}
                        title={request.technician.name}
                        className="w-6 h-6 rounded-full"
                    />
                ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-400">?</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

// Kanban Column
function KanbanColumn({ stage, requests }) {
    const getColumnStyle = (color) => {
        const styles = {
            blue: 'bg-blue-50 border-blue-200',
            amber: 'bg-amber-50 border-amber-200',
            green: 'bg-green-50 border-green-200',
            red: 'bg-red-50 border-red-200',
        };
        return styles[color] || 'bg-gray-50 border-gray-200';
    };

    const getHeaderStyle = (color) => {
        const styles = {
            blue: 'text-blue-700',
            amber: 'text-amber-700',
            green: 'text-green-700',
            red: 'text-red-700',
        };
        return styles[color] || 'text-gray-700';
    };

    return (
        <div className="flex-1 min-w-[280px] max-w-[320px]">
            <div
                className={`rounded-t-lg px-4 py-3 border-t-4 ${getColumnStyle(
                    stage.color
                )}`}
            >
                <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${getHeaderStyle(stage.color)}`}>
                        {stage.label}
                    </h3>
                    <span className="text-sm font-medium text-gray-500">
                        {requests.length}
                    </span>
                </div>
            </div>

            <SortableContext
                items={requests.map((r) => r.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="kanban-column bg-gray-50 rounded-b-lg p-3 space-y-3">
                    {requests.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                            No requests
                        </div>
                    ) : (
                        requests.map((request) => (
                            <SortableCard key={request.id} request={request} />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}

export default function KanbanBoard() {
    const { user, isManager, isTechnician } = useAuth();
    const [kanban, setKanban] = useState({
        NEW: [],
        IN_PROGRESS: [],
        REPAIRED: [],
        SCRAP: [],
    });
    const [loading, setLoading] = useState(true);
    const [activeRequest, setActiveRequest] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchKanban();
    }, []);

    const fetchKanban = async () => {
        try {
            const response = await requestsAPI.getKanban();
            setKanban(response.data.kanban);
        } catch (error) {
            console.error('Failed to fetch kanban:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const request = findRequest(active.id);
        setActiveRequest(request);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveRequest(null);

        if (!over) return;

        const activeRequest = findRequest(active.id);
        if (!activeRequest) return;

        // Find which column the item was dropped in
        let newStage = null;
        for (const stage of stages) {
            if (kanban[stage.id].find((r) => r.id === over.id)) {
                newStage = stage.id;
                break;
            }
            // Also check if dropped on the column itself
            if (over.id === stage.id) {
                newStage = stage.id;
                break;
            }
        }

        if (!newStage || newStage === activeRequest.stage) return;

        // Check permissions
        if (user?.role === 'USER') {
            toast.error('Users cannot change request stage');
            return;
        }

        if (
            isTechnician() &&
            user?.teamId !== activeRequest.teamId
        ) {
            toast.error("You can only update your team's requests");
            return;
        }

        // Confirm scrap action
        if (newStage === 'SCRAP') {
            if (
                !confirm(
                    'Moving to SCRAP will mark the equipment as scrapped. Continue?'
                )
            ) {
                return;
            }
        }

        // Optimistic update
        const oldKanban = { ...kanban };
        const newKanban = {
            ...kanban,
            [activeRequest.stage]: kanban[activeRequest.stage].filter(
                (r) => r.id !== activeRequest.id
            ),
            [newStage]: [
                ...kanban[newStage],
                { ...activeRequest, stage: newStage },
            ],
        };
        setKanban(newKanban);

        try {
            await requestsAPI.updateStage(activeRequest.id, newStage);
            toast.success(`Moved to ${newStage.replace('_', ' ')}`);
        } catch (error) {
            // Revert on error
            setKanban(oldKanban);
            toast.error(error.response?.data?.message || 'Failed to update stage');
        }
    };

    const findRequest = (id) => {
        for (const stage of stages) {
            const request = kanban[stage.id].find((r) => r.id === id);
            if (request) return request;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <div className="skeleton h-8 w-48" />
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {stages.map((stage) => (
                        <div key={stage.id} className="flex-1 min-w-[280px] max-w-[320px]">
                            <div className="skeleton h-12 rounded-t-lg mb-2" />
                            <div className="skeleton h-96 rounded-b-lg" />
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
                    <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
                    <p className="text-gray-500 mt-1">
                        Drag and drop requests between stages
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchKanban} className="btn btn-secondary">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <Link to="/requests/new" className="btn btn-primary">
                        <Plus className="w-5 h-5" />
                        New Request
                    </Link>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-6 overflow-x-auto pb-4">
                    {stages.map((stage) => (
                        <KanbanColumn
                            key={stage.id}
                            stage={stage}
                            requests={kanban[stage.id]}
                        />
                    ))}
                </div>

                <DragOverlay>
                    {activeRequest && (
                        <div className="kanban-card shadow-lg rotate-3">
                            <RequestCard request={activeRequest} />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Legend */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="badge badge-red">Corrective</span>
                        <span className="text-gray-500">Breakdown repair</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="badge badge-purple">Preventive</span>
                        <span className="text-gray-500">Scheduled maintenance</span>
                    </div>
                    <div className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Overdue (created more than 2 days ago)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
