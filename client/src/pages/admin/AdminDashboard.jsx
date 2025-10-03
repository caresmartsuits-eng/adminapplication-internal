import React from 'react';
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

const Container = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 ${className}`}>{children}</div>
);

export default function AdminDashboard({ onLogout }) {
  const [view, setView] = React.useState('dashboard');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Home' },
    { key: 'users', label: 'Users' },
    { key: 'createUser', label: 'Create User' },
    { key: 'orders', label: 'Orders' },
    { key: 'createOrder', label: 'Create Order' },
    { key: 'configurations', label: 'Configurations' },
    { key: 'configHeaders', label: 'Config Headers' },
    { key: 'audits', label: 'Audit Logs' },
  ];

  const renderContent = () => {
    switch (view) {
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
      default:
        return (
          <div className="text-center p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              Welcome to the Admin Dashboard!
            </h3>
            <p className="text-gray-600">Use the menu to manage users and orders.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar title="Admin Dashboard" onLogout={onLogout} onMenu={() => setDrawerOpen(true)} />
      <div className="flex">
        <div className="hidden md:block w-64 bg-gray-800 text-white min-h-[calc(100vh-56px)]">
          <SidebarNav title="Menu" items={navItems} onSelect={setView} onLogout={onLogout} />
        </div>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <SidebarNav
            title="Menu"
            items={navItems}
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