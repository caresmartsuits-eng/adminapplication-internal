import React from 'react';
import UpdateOrderModal from './UpdateOrderModal';

export default function OrdersList() {
  const [orders, setOrders] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [selectedOrder, setSelectedOrder] = React.useState(null);
  const [snumQuery, setSnumQuery] = React.useState('');
  const [orderNumberQuery, setOrderNumberQuery] = React.useState('');

  const fetchOrders = async (snum, orderNumber) => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      let url = '/api/orders';
      const params = new URLSearchParams();
      if (snum) params.append('snum', snum);
      if (orderNumber) params.append('orderNumber', orderNumber);
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
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');
    fetchOrders(snumQuery.trim(), orderNumberQuery.trim());
  };

  React.useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-center text-gray-500">Loading orders...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">All Orders</h3>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-4">
        <input
          type="text"
          value={snumQuery}
          onChange={(e) => setSnumQuery(e.target.value)}
          placeholder="SNUM (e.g., S123)"
          className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          value={orderNumberQuery}
          onChange={(e) => setOrderNumberQuery(e.target.value)}
          placeholder="Order No. (e.g., 456)"
          className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 sm:flex-none bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSnumQuery('');
              setOrderNumberQuery('');
              fetchOrders();
            }}
            className="flex-1 sm:flex-none bg-gray-500 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
          >
            Show All
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">SNUM</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Order No.</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Product Type</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Delivery Date</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Assigned User</th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-900">{order.id}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.snum}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.order_number}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.product_type}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{order.delivery_date}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap font-semibold text-gray-600 capitalize">
                    {order.status}
                  </td>
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
          onOrderUpdated={() => fetchOrders(snumQuery, orderNumberQuery)}
        />
      )}
    </div>
  );
}