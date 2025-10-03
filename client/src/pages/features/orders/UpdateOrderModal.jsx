import React from 'react';
import Modal from '../../../components/Modal';

export default function UpdateOrderModal({ order, onClose, onOrderUpdated }) {
  const [updateError, setUpdateError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');
  const [statuses, setStatuses] = React.useState([]);
  const [updatedOrder, setUpdatedOrder] = React.useState(order);

  const fetchConfigurations = async (category, setStateFunction) => {
    const token = localStorage.getItem('token');
    try {
      const configRes = await fetch('/api/configurations/active', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!configRes.ok) throw new Error('Failed to fetch configurations');
      const configData = await configRes.json();
      const filteredData = configData.filter((cfg) => cfg.category === category);
      setStateFunction(filteredData);
    } catch (err) {
      setUpdateError('Failed to load form data');
    }
  };

  React.useEffect(() => {
    fetchConfigurations('ORDER_STATUS', setStatuses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/orders/update/' + order.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({ status: updatedOrder.status }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update order');
      }

      setModalMessage('Order updated successfully!');
      if (onOrderUpdated) onOrderUpdated();
      onClose();
    } catch (err) {
      setUpdateError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white p-5 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-md mx-auto">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">
          Update Order #{order.id}
        </h3>
        <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">SNUM</label>
            <input
              type="text"
              value={order.snum}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Order Number</label>
            <input
              type="text"
              value={order.order_number}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Product Type</label>
            <input
              type="text"
              value={order.product_type}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Delivery Date</label>
            <input
              type="text"
              value={order.delivery_date}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Status</label>
            {statuses.length > 0 ? (
              <select
                value={updatedOrder.status}
                onChange={(e) => setUpdatedOrder({ ...updatedOrder, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.english_description}>
                    {s.english_description}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={updatedOrder.status}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                readOnly
                disabled
              />
            )}
          </div>
          {updateError && (
            <p className="text-red-500 text-sm text-center font-medium">{updateError}</p>
          )}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}