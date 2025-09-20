import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTechnicianLabTests, updateLabTestStatus } from '../api';
import CountUp from "react-countup";
import { Calendar, Clock, CheckCircle, AlertCircle, MapPin, User } from "lucide-react";
import toast from 'react-hot-toast';

// Stat Card component
const StatCard = ({ value, label, icon, color = 'blue' }) => (
    <div className="bg-secondary-dark p-6 rounded-lg text-center flex items-center gap-4">
        <div className={`text-4xl text-${color}-400`}>{icon}</div>
        <div>
            <p className="text-2xl font-bold text-white text-left">
                {typeof value === 'number' ? <CountUp end={value} duration={2.5} /> : value}
            </p>
            <p className="text-secondary-text text-left">{label}</p>
        </div>
    </div>
);

// Lab Test Card component
const LabTestCard = ({ test, onStatusUpdate }) => {
    const [updating, setUpdating] = useState(false);

    const handleStatusUpdate = async (newStatus) => {
        setUpdating(true);
        try {
            await updateLabTestStatus(test._id, { status: newStatus });
            onStatusUpdate(test._id, newStatus);
            toast.success('Status updated successfully');
        } catch {
            toast.error('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'yellow';
            case 'Sample Collected': return 'blue';
            case 'Report Ready': return 'green';
            case 'Completed': return 'gray';
            default: return 'gray';
        }
    };

    return (
        <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">{test.testName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mt-1">
                        <User size={16} />
                        <span>{test.patient?.name || 'Patient'}</span>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${getStatusColor(test.status)}-500 text-white`}>
                    {test.status}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar size={16} />
                    <span>{test.collectionDate}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock size={16} />
                    <span>{test.collectionTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin size={16} />
                    <span>{test.patientAddress}</span>
                </div>
            </div>

            {test.status !== 'Completed' && (
                <div className="flex gap-2">
                    {test.status === 'Pending' && (
                        <button
                            onClick={() => handleStatusUpdate('Sample Collected')}
                            disabled={updating}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Mark as Collected'}
                        </button>
                    )}
                    {test.status === 'Sample Collected' && (
                        <button
                            onClick={() => handleStatusUpdate('Report Ready')}
                            disabled={updating}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Mark Report Ready'}
                        </button>
                    )}
                    {test.status === 'Report Ready' && (
                        <button
                            onClick={() => handleStatusUpdate('Completed')}
                            disabled={updating}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            {updating ? 'Updating...' : 'Mark Completed'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const TechnicianDashboard = () => {
    const { user } = useAuth();
    const [labTests, setLabTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today');

    useEffect(() => {
        fetchLabTests();
    }, []);

    const fetchLabTests = async () => {
        try {
            const { data } = await getTechnicianLabTests();
            setLabTests(data.data);
        } catch (error) {
            console.error('Error fetching lab tests:', error);
            toast.error('Failed to load lab tests');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = (testId, newStatus) => {
        setLabTests(prevTests =>
            prevTests.map(test =>
                test._id === testId ? { ...test, status: newStatus } : test
            )
        );
    };

    // Filter tests based on date and status
    const today = new Date().toISOString().split('T')[0];

    const todaysCollections = labTests.filter(test =>
        test.collectionDate === today && test.status !== 'Completed'
    );

    const upcomingCollections = labTests.filter(test =>
        test.collectionDate > today && test.status === 'Pending'
    );

    const completedCollections = labTests.filter(test =>
        test.status === 'Completed'
    );

    const stats = {
        today: todaysCollections.length,
        upcoming: upcomingCollections.length,
        completed: completedCollections.length,
        total: labTests.length
    };

    const getCurrentTests = () => {
        switch (activeTab) {
            case 'today': return todaysCollections;
            case 'upcoming': return upcomingCollections;
            case 'completed': return completedCollections;
            default: return todaysCollections;
        }
    };

    if (loading) {
        return (
            <div className="bg-primary-dark min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-primary-dark min-h-screen">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 h-60">
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-start p-8 md:p-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">Technician Dashboard</h1>
                    <p className="text-lg text-gray-300 mt-2">Welcome back, {user?.name}!</p>
                    <p className="text-sm text-blue-300 mt-1">Manage your lab test collections</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="px-8 md:px-12 -mt-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        value={stats.today}
                        label="Today's Collections"
                        icon={<Calendar />}
                        color="blue"
                    />
                    <StatCard
                        value={stats.upcoming}
                        label="Upcoming Collections"
                        icon={<Clock />}
                        color="yellow"
                    />
                    <StatCard
                        value={stats.completed}
                        label="Completed Collections"
                        icon={<CheckCircle />}
                        color="green"
                    />
                    <StatCard
                        value={stats.total}
                        label="Total Tests"
                        icon={<AlertCircle />}
                        color="purple"
                    />
                </div>

                {/* Tabs */}
                <div className="bg-secondary-dark rounded-lg p-6 mb-8">
                    <div className="flex space-x-1 mb-6">
                        {[
                            { id: 'today', label: "Today's Collections", count: stats.today },
                            { id: 'upcoming', label: 'Upcoming Collections', count: stats.upcoming },
                            { id: 'completed', label: 'Completed Collections', count: stats.completed }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Lab Tests List */}
                    <div className="space-y-4">
                        {getCurrentTests().length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-300 mb-2">No tests found</h3>
                                <p className="text-gray-500">
                                    {activeTab === 'today' && "No collections scheduled for today."}
                                    {activeTab === 'upcoming' && "No upcoming collections."}
                                    {activeTab === 'completed' && "No completed collections yet."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {getCurrentTests().map(test => (
                                    <LabTestCard
                                        key={test._id}
                                        test={test}
                                        onStatusUpdate={handleStatusUpdate}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TechnicianDashboard;