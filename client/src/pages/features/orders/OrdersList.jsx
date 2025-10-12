import React, { useState, useEffect, useCallback } from 'react';
import UpdateOrderModal from './UpdateOrderModal';

// Helper function to fetch data with authentication
const fetchWithAuth = async (url) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found.');

    const response = await fetch(url, {
        headers: { Authorization: 'Bearer ' + token },
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch data');
    }
    return response.json();
};

export default function OrdersList() {
    const API_BASE = import.meta.env.VITE_API_BASE + '/api';

    // 🛑 New state object for all filters
    const [filters, setFilters] = React.useState({
        snum: '',
        orderNumber: '',
        deliveryDate: '',
        customerType: '',
        status: '',
        assignedUser: '',
    });
    const [orders, setOrders] = React.useState([]);
    const [error, setError] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [selectedOrder, setSelectedOrder] = React.useState(null);

    // Options for filter dropdowns
    const [users, setUsers] = React.useState([]);
    const [customerTypes, setCustomerTypes] = React.useState([]);
    // Assuming status options are known
    const statusOptions = ['Order Received', 'In Progress', 'Ready to Deliver', 'Delivered', 'Cancelled'];

    // 🛑 Handler for all filter inputs
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // 🛑 Centralized function to fetch orders, now accepting filters object
    const fetchOrders = useCallback(async (currentFilters = {}) => {
        const token = localStorage.getItem('token');
        try {
            setLoading(true);
            setError('');
            let url = API_BASE + '/orders';
            const params = new URLSearchParams();

            // Append all filters to the URLSearchParams
            if (currentFilters.snum) params.append('snum', currentFilters.snum);
            if (currentFilters.orderNumber) params.append('orderNumber', currentFilters.orderNumber);
            if (currentFilters.deliveryDate) params.append('deliveryDate', currentFilters.deliveryDate);
            if (currentFilters.customerType) params.append('customerType', currentFilters.customerType);
            if (currentFilters.status) params.append('status', currentFilters.status);
            if (currentFilters.assignedUser) params.append('assignedUser', currentFilters.assignedUser);

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                headers: { Authorization: 'Bearer ' + token },
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to fetch orders');
            }
            const data = await response.json();
            setOrders(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [API_BASE]);



    // 🛑 Function to fetch dropdown options
    useEffect(() => {
        // Fetch Users (for Assigned User filter)
        const fetchUsers = async () => {
            try {
                // Assuming an API endpoint exists to fetch all users for admin
                const data = await fetchWithAuth(API_BASE + '/admin/users');
                setUsers(data.map(u => u.username) || []);
            } catch (e) {
                console.error('Failed to fetch users:', e);
            }
        };

        // Fetch Customer Types (for Customer Type filter)
        const fetchCustomerTypes = async () => {
            try {
                // You might need a specific endpoint to list all unique 'person' types,
                // or fetch all config types and filter for the relevant one.
                // Mocking an endpoint for simplicity:
                const data = await fetchWithAuth(API_BASE + '/configurations/active?category=CUST_TYPE');

                setCustomerTypes(data|| []);
            } catch (e) {
                console.error('Failed to fetch customer types:', e);
            }
        };

        fetchUsers();
        fetchCustomerTypes();

        // Initial fetch with default empty filters
        fetchOrders(filters);
    }, [fetchOrders, API_BASE]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchOrders(filters);
    };

  React.useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-center text-gray-500">Loading orders...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Management</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {/* 🛑 Filter Bar */}
        <form onSubmit={handleApplyFilters} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">

            {/* SNUM Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">SNUM</label>
                <input
                    type="text"
                    name="snum"
                    value={filters.snum}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="e.g., S10"
                />
            </div>

            {/* Order Number Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">Order Number</label>
                <input
                    type="text"
                    name="orderNumber"
                    value={filters.orderNumber}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="e.g., 10"
                />
            </div>

            {/* Delivery Date Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">Delivery Date</label>
                <input
                    type="date"
                    name="deliveryDate"
                    value={filters.deliveryDate}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                />
            </div>

            {/* Customer Type Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">Customer Type</label>
                <select
                    name="customerType"
                    value={filters.customerType}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                >
                    <option value="">All Types</option>
                    {customerTypes.map(type => (
                        <option key={type.english_description} value={type.english_description}>{type.english_description}</option>
                    ))}
                </select>
            </div>

            {/* Status Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                >
                    <option value="">All Statuses</option>
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>

            {/* Assigned User Filter */}
            <div>
                <label className="block text-xs font-medium text-gray-700">Assigned User</label>
                <select
                    name="assignedUser"
                    value={filters.assignedUser}
                    onChange={handleFilterChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                >
                    <option value="">All Users</option>
                    {users.map(user => (
                        <option key={user} value={user}>{user}</option>
                    ))}
                </select>
            </div>

            <div className="md:col-span-3 lg:col-span-6 flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={() => {
                        setFilters({ snum: '', orderNumber: '', deliveryDate: '', customerType: '', status: '', assignedUser: '' });
                        fetchOrders({ snum: '', orderNumber: '', deliveryDate: '', customerType: '', status: '', assignedUser: '' }); // Fetch all after reset
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                    Reset Filters
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                    {loading ? 'Searching...' : 'Apply Filters'}
                </button>
            </div>

        </form>
        {/* 🛑 End Filter Bar */}
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-200">

              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">SNUM</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Bill Number</th>
                <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Quantity</th>
                <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Product Type</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Delivery Date</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Customer</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Assigned User</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
          {loading ? (
              <tr>
                  <td colSpan="9" className="py-10 text-center text-gray-500">Loading orders...</td>
              </tr>
          ) : orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">

                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.snum}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.order_number}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.quantity}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.product_type}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.delivery_date}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap font-semibold text-gray-600 capitalize">
                    {order.status}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.person}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.assigned_user}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md hover:bg-blue-600 transition-colors"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-4 px-6 text-center text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selectedOrder && (
        <UpdateOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
              setSelectedOrder(null);
              fetchOrders(filters);
          }}
        />
      )}
    </div>
  );
}