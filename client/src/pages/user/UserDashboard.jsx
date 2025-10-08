import React from 'react';
import TopBar from '../../components/TopBar';
import Drawer from '../../components/Drawer';
import SidebarNav from '../../components/SidebarNav';

// Plug your real feature components below
import OrdersList from '../features/orders/OrdersList';
import CreateOrder from '../features/orders/CreateOrder';
import UpdateProfile from '../features/users/UpdateProfile';
import UpdatePassword from '../features/users/UpdatePassword';

const Container = ({ children, className = '' }) => (
  <div className={`mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 ${className}`}>{children}</div>
);

export default function UserDashboard({ onLogout,username }) {
  const [view, setView] = React.useState('dashboard');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Home' },
    { key: 'orders', label: 'Orders' },
    { key: 'createOrder', label: 'Create Order' },
    { key: 'updateProfile', label: 'Update Profile' },
    { key: 'updatePassword', label: 'Update Password' },
  ];

  const renderContent = () => {
    switch (view) {
      case 'orders':
        return <OrdersList />;
      case 'createOrder':
        return <CreateOrder role="user" />;
      case 'updateProfile':
        // Passing role='user' and the logged-in username
        return <UpdateProfile role="user" currentUsername={username} />;
      case 'updatePassword':
        return <UpdatePassword username={username} />;
      default:
        return (
          <div className="text-center p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Welcome to your dashboard!</h3>
            <p className="text-gray-600">Use the menu to manage your orders.</p>
          </div>
        );
    }
  };

    return (
        <div className="min-h-screen bg-gray-100">
            <TopBar title="User Dashboard" onLogout={onLogout} onMenu={() => setDrawerOpen(true)} />
            <div className="flex">
                <div className="hidden md:block w-64 bg-gray-800 text-white min-h-[calc(100vh-56px)]">
                    <SidebarNav title="Menu" items={navItems} onSelect={setView} onLogout={onLogout} />
                </div>
                <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                    <SidebarNav title="Menu" items={navItems} onSelect={(k) => { setView(k); setDrawerOpen(false); }} onLogout={onLogout} />
                </Drawer>
                <div className="flex-1 p-3 sm:p-6 overflow-auto">
                    <Container>{renderContent()}</Container>
                </div>
            </div>
        </div>
    );
};