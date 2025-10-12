import React, { useState, useEffect } from 'react';
import TopBar from '../../components/TopBar';
import Drawer from '../../components/Drawer';
import SidebarNav from '../../components/SidebarNav';


// Plug your real feature components below
import UsersList from '../features/users/UsersList';
import CreateUser from '../features/users/CreateUser';
import OrdersList from '../features/orders/OrdersList';
import CreateOrder from '../features/orders/CreateOrder';
import AuditLogsList from '../features/audits/AuditLogsList';
import ConfigurationsList from '../features/configs/ConfigurationsList';
import CreateConfiguration from '../features/configs/CreateConfiguration';
import ConfigHeadersList from '../features/configHeaders/ConfigHeadersList';
import CreateConfigHeader from '../features/configHeaders/CreateConfigHeader';
import UpdateProfile from '../features/users/UpdateProfile';
import UpdatePassword from '../features/users/UpdatePassword';
import CurrentDeliveries from '../features/orders/CurrentDeliveries';
import KPICard from '../../components/KPICard';
import {fetchWithAuthJSON} from "../../utils/auth.js";
import OrderChart from '../../components/OrderChart';

const API_BASE = import.meta.env.VITE_API_BASE;

const Container = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 ${className}`}>{children}</div>
);

// =========================================================================
// 1. UPDATED API FETCH FUNCTION
// =========================================================================
const fetchKpiData = async () => {

    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found. Please log in.');

    const fetchJson = async (url) => {
        const response = await fetch(url,{
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
        if (!response.ok) {
            console.log('Failed to fetch order counts:'+response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    };
    // 1. Fetch Order Counts
    const ordersPromise = fetchJson(API_BASE+'/api/orders/kpi-counts');

    // 2. Fetch User Count
    // NOTE: You must create a GET /users/count route in your users.routes.js
    // that returns { count: N }
    const usersPromise = fetchJson(API_BASE+'/api/users/count');

    const breakdownPromise = fetchJson(`${API_BASE}/api/orders/status-breakdown`);

    const logsPromise = fetchJson(`${API_BASE}/api/audits/recent?limit=5`);

    const [ordersData, usersData,breakdownData,logsData,] = await Promise.allSettled([ordersPromise, usersPromise,breakdownPromise,logsPromise]);


    // Combine results into a single object for state
    return {
        overdueDeliveries: ordersData.status === 'fulfilled' ? ordersData.value.overdueDeliveries : 0,
        deliveriesToday: ordersData.status === 'fulfilled' ? ordersData.value.deliveriesToday : 0,
        newOrders: ordersData.status === 'fulfilled' ? ordersData.value.newOrders : 0,

        // Total Users KPI
        totalUsers: usersData.status === 'fulfilled' ? usersData.value.count : 0,

        // Order Status Breakdown (Chart Data)
        orderStatusBreakdown: breakdownData.status === 'fulfilled' ? breakdownData.value : [],

        // NEW: Recent Audit Logs
        recentAuditLogs: logsData.status === 'fulfilled' ? logsData.value : [],
    };
};

export default function AdminDashboard({ onLogout, username }) {
  const [view, setView] = React.useState('dashboard');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

    // 2. NEW STATE for KPI DATA
    const [kpiData, setKpiData] = useState(null);
    const [loadingKpi, setLoadingKpi] = useState(true);
    const [chartData, setChartData] = useState([]);

    const [recentLogs, setRecentLogs] = useState([]);

    // 3. EFFECT to fetch data on component mount
    useEffect(() => {
        setLoadingKpi(true);
        fetchKpiData()
            .then(data => {
                setKpiData(data);
                if (Array.isArray(data.orderStatusBreakdown)) {
                    setChartData(data.orderStatusBreakdown);
                } else {
                    setChartData([]);
                    console.warn("Order Status Breakdown was not an array:", data.orderStatusBreakdown);
                }
                if (Array.isArray(data.recentAuditLogs)) {
                    setRecentLogs(data.recentAuditLogs);
                } else {
                    setChartData([]);
                    console.warn("Order Status Breakdown was not an array:", data.recentAuditLogs);
                }

            })
            .catch(error => {
                console.error("Failed to fetch KPI data:", error);
                // Set all related states to their safe initial values on error
                setKpiData({ overdueDeliveries: 0, deliveriesToday: 0, newOrders: 0, totalUsers: 0 });
                setChartData([]);
            })
            .finally(() => {
                setLoadingKpi(false);
            });
    }, []);

    const navItems = [
        {
            key: 'dashboard',
            label: 'Dashboard',
            icon: 'fa-solid fa-chart-line', // Font Awesome for chart/analytics
            isGroup: false,
        },
        {
            key: 'order-management',
            label: 'Order Management',
            icon: 'fa-solid fa-truck', // Font Awesome for shipping/orders
            isGroup: true,
            children: [
                { key: 'currentDeliveries', label: 'Current Deliveries', icon: 'fa-solid fa-bell' }, // Highlighted item
                { key: 'orders', label: 'Orders List', icon: 'fa-solid fa-list-check' },
                { key: 'createOrder', label: 'Create Order', icon: 'fa-solid fa-plus' },
            ],
        },
        {
            key: 'user-management',
            label: 'User Management',
            icon: 'fa-solid fa-users', // Font Awesome for users
            isGroup: true,
            children: [
                { key: 'users', label: 'Users List', icon: 'fa-solid fa-user-group' },
                { key: 'createUser', label: 'Create User', icon: 'fa-solid fa-plus' },
            ],
        },
        {
            key: 'system-settings',
            label: 'System Settings',
            icon: 'fa-solid fa-cogs', // Font Awesome for configuration
            isGroup: true,
            children: [
                { key: 'audits', label: 'Audit Logs', icon: 'fa-solid fa-shield-halved' },
                // Grouping configs for better organization
                { key: 'configurations', label: 'General Configs', icon: 'fa-solid fa-sliders' },
                { key: 'createConfiguration', label: 'Create Config', icon: 'fa-solid fa-plus' },
                { key: 'configHeaders', label: 'Config Headers', icon: 'fa-solid fa-database' },
                { key: 'createConfigHeader', label: 'Create Header', icon: 'fa-solid fa-plus' },
            ],
        },
    ];

// Add profile items separately at the end
    const profileItems = [
        { key: 'updateProfile', label: 'My Profile', icon: 'fa-solid fa-user-circle' },
        { key: 'updatePassword', label: 'Change Password', icon: 'fa-solid fa-lock' },
    ]

  const renderContent = () => {
    switch (view) {
      case 'currentDeliveries': // <--- ADDED NEW CASE
        return <CurrentDeliveries />;
      case 'users':
        return <UsersList />;
      case 'createUser':
        return <CreateUser onUserCreated={() => setView('users')} />;
      case 'orders':
        return <OrdersList />;
      case 'createOrder':
        return <CreateOrder role="admin" />;
      case 'audits':
        return <AuditLogsList />;
      case 'configurations':
        return <ConfigurationsList setView={setView} />;
      case 'createConfiguration':
        return <CreateConfiguration onConfigCreated={() => setView('configurations')} />;
      case 'configHeaders':
        return <ConfigHeadersList setView={setView} />;
      case 'createConfigHeader':
        return <CreateConfigHeader onConfigHeaderCreated={() => setView('configHeaders')} />;
      case 'updateProfile':
        return <UpdateProfile role="admin" currentUsername={username} />;
      case 'updatePassword': // <-- ADD THIS CASE
        return <UpdatePassword username={username} />;
        default:
        return (
            <div className="p-6 sm:p-8 space-y-6">
                <h1 className="text-3xl font-bold text-gray-900">Admin Overview 📊</h1>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Pending Deliveries (Critical) */}
                    {loadingKpi ? (
                        <div className="lg:col-span-4 text-center p-8 bg-white shadow-lg rounded-lg text-gray-500">
                            Fetching Key Performance Indicators...
                        </div>
                    ) : (
                    <>
                    <KPICard
                        title="Overdue Deliveries"
                        value={kpiData?.overdueDeliveries ?? 0} // Replace with real API data
                        icon="fa-solid fa-triangle-exclamation"
                        color="bg-red-500"
                        linkAction={() => setView('currentDeliveries')}
                    />

                    {/* 2. Today's Deliveries */}
                    <KPICard
                        title="Deliveries Today"
                        value={kpiData?.deliveriesToday ?? 0} // Replace with real API data
                        icon="fa-solid fa-calendar-day"
                        color="bg-amber-500"
                        linkAction={() => setView('currentDeliveries')}
                    />

                    {/* 3. New Orders */}
                    <KPICard
                        title="New Orders (24h)"
                        value={kpiData?.newOrders ?? 0} // Replace with real API data
                        icon="fa-solid fa-file-circle-plus"
                        color="bg-blue-500"
                        linkAction={() => setView('orders')}
                    />

                    {/* 4. Total Users */}
                    <KPICard
                        title="Total Active Users"
                        value={kpiData?.totalUsers ?? 0} // Replace with real API data
                        icon="fa-solid fa-users"
                        color="bg-green-500"
                        linkAction={() => setView('users')}
                    />
            </>
                )}
                </div>

                {/* Placeholder for larger charts/logs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 💡 Increase the height of the chart's container for reliability */}
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Order Status Breakdown</h3>
                        {/* 💡 Make the INNER div taller and use 'h-full' for the chart */}
                        <div className="h-96 w-full">
                            {loadingKpi ? (
                                <div className="h-full flex items-center justify-center text-gray-500">Loading chart data...</div>
                            ) : (
                                <OrderChart data={chartData} />
                            )}
                        </div>
                    </div>
                    {/* Recent Audit Logs (lg:col-span-1) */}
                    <div className="lg:col-span-1 bg-white shadow-lg rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Recent Audit Logs</h3>
                        {/* 4. RENDER RECENT AUDIT LOGS */}
                        <div className="h-96 overflow-y-auto text-gray-700">
                            {loadingKpi ? (
                                <div className="text-center p-4">Loading logs...</div>
                            ) : recentLogs.length === 0 ? (
                                <div className="text-center p-4">No recent audit logs found.</div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {recentLogs.map((log) => (
                                        <li key={log.id} className="py-2">
                                            <p className="font-semibold text-gray-900">{log.action}</p>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500">by {log.user}</span>
                                                <span className="text-gray-400">
                                                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    {' '}
                                                    {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                            </div>
                                            {log.details && (
                                                <p className="text-xs text-gray-400 mt-1 truncate">Details: {JSON.stringify(log.details)}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar title="Admin Dashboard" onLogout={onLogout} onMenu={() => setDrawerOpen(true)} username={username} />
      <div className="flex">
        <div className="hidden md:block w-64 bg-gradient-to-br from-emerald-900 to-gray-950 text-white min-h-[calc(100vh-56px)]">
          <SidebarNav title="Menu" items={navItems} profileItems={profileItems} onSelect={setView} onLogout={onLogout} />
        </div>
        <Drawer open={drawerOpen}  onClose={() => setDrawerOpen(false)}>
          <SidebarNav
            title="Menu"
            items={navItems}
            profileItems={profileItems}
            onSelect={(k) => {
              setView(k);
              setDrawerOpen(false);
            }}
            onLogout={onLogout}
          />
        </Drawer>
        <div className="flex-1 p-3 sm:p-6 overflow-auto">
          <Container>{renderContent()}</Container>
        </div>
      </div>
    </div>
  );
}