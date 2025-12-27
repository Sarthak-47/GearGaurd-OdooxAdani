/**
 * Calendar Page
 * Shows preventive maintenance requests in calendar view
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../api/services';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
    Plus,
    Calendar as CalendarIcon,
    Info,
} from 'lucide-react';

export default function Calendar() {
    const navigate = useNavigate();
    const { isManager } = useAuth();
    const calendarRef = useRef(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const response = await requestsAPI.getCalendar({});
            setEvents(response.data.events);
        } catch (error) {
            console.error('Failed to fetch calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (info) => {
        if (!isManager()) return;

        // Navigate to create new preventive request with date pre-filled
        const date = info.dateStr;
        navigate(`/requests/new?scheduledDate=${date}`);
    };

    const handleEventClick = (info) => {
        const event = info.event;
        setSelectedEvent({
            id: event.id,
            title: event.title,
            date: event.start,
            stage: event.extendedProps.stage,
            equipment: event.extendedProps.equipment,
            technician: event.extendedProps.technician,
            priority: event.extendedProps.priority,
        });
    };

    const closeEventModal = () => {
        setSelectedEvent(null);
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

    const getPriorityLabel = (priority) => {
        const labels = {
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Critical',
        };
        return labels[priority] || 'Low';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between">
                    <div className="skeleton h-8 w-48" />
                </div>
                <div className="card p-6">
                    <div className="skeleton h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Maintenance Calendar
                    </h1>
                    <p className="text-gray-500 mt-1">
                        View and schedule preventive maintenance
                    </p>
                </div>
                {isManager() && (
                    <button
                        onClick={() => navigate('/requests/new')}
                        className="btn btn-primary"
                    >
                        <Plus className="w-5 h-5" />
                        Schedule Maintenance
                    </button>
                )}
            </div>

            {/* Info banner */}
            <div className="card p-4 bg-purple-50 border-purple-200">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm text-purple-800">
                            This calendar shows <strong>Preventive Maintenance</strong>{' '}
                            requests only. Corrective (breakdown) requests are not scheduled
                            and appear in the Kanban board instead.
                        </p>
                        {isManager() && (
                            <p className="text-sm text-purple-600 mt-1">
                                Click on a date to schedule new preventive maintenance.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="card p-6">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek',
                    }}
                    height="auto"
                    eventDisplay="block"
                    dayMaxEvents={3}
                    moreLinkClick="popover"
                    eventClassNames="cursor-pointer"
                />
            </div>

            {/* Legend */}
            <div className="card p-4">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-gray-600">New</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-gray-600">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span className="text-gray-600">Scrapped</span>
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="modal-overlay" onClick={closeEventModal}>
                    <div
                        className="modal-content max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Maintenance Details
                            </h2>
                            <button
                                onClick={closeEventModal}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                ×
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Subject</p>
                                <p className="font-medium text-gray-900">{selectedEvent.title}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Scheduled Date</p>
                                <p className="font-medium text-gray-900">
                                    {selectedEvent.date?.toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Equipment</p>
                                <p className="font-medium text-gray-900">
                                    {selectedEvent.equipment?.name || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`badge ${getStageBadge(selectedEvent.stage)}`}>
                                    {selectedEvent.stage?.replace('_', ' ')}
                                </span>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500">Priority</p>
                                <p className="font-medium text-gray-900">
                                    {getPriorityLabel(selectedEvent.priority)}
                                </p>
                            </div>

                            {selectedEvent.technician && (
                                <div>
                                    <p className="text-sm text-gray-500">Assigned To</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <img
                                            src={selectedEvent.technician.avatar}
                                            alt={selectedEvent.technician.name}
                                            className="w-6 h-6 rounded-full"
                                        />
                                        <span className="font-medium text-gray-900">
                                            {selectedEvent.technician.name}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => {
                                        navigate(`/requests/${selectedEvent.id}`);
                                        closeEventModal();
                                    }}
                                    className="btn btn-primary w-full"
                                >
                                    View Full Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
