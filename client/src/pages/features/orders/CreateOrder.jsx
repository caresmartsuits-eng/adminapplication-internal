import React from 'react';
import Modal from '../../../components/Modal';

export default function CreateOrder({ role }) {
  const [newOrder, setNewOrder] = React.useState({
    snum: '',
    order_number: '',
    product_type: '',
    delivery_date: '',
    assigned_user: '',
  });
  const [createOrderError, setCreateOrderError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');
  const [users, setUsers] = React.useState([]);
  const [productTypes, setProductTypes] = React.useState([]);

  const fetchNextSnum = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/orders/next-snum', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (response.ok) {
        const data = await response.json();
        setNewOrder((prev) => ({ ...prev, snum: data.snum }));
      }
    } catch (err) {
      console.error('Failed to fetch next SNUM:', err);
    }
  };

  const fetchProdTypes = async () => {
    const token = localStorage.getItem('token');
    try {
      const configRes = await fetch('/api/admin/configurations', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!configRes.ok) throw new Error('Failed to fetch configurations');
      const configData = await configRes.json();
      const prodTypes = configData.filter((cfg) => cfg.category === 'PROD_TYPE');
      setProductTypes(prodTypes);
    } catch (err) {
      console.error('Failed to fetch product types:', err);
    }
  };

  React.useEffect(() => {
    fetchNextSnum();
    fetchProdTypes();

    if (role === 'admin') {
      const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
          const userResponse = await fetch('/api/admin/users', {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (userResponse.ok) {
            const data = await userResponse.json();
            setUsers(data);
          }
        } catch (err) {
          console.error('Failed to fetch users:', err);
        }
      };
      fetchUsers();
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setNewOrder((prev) => ({ ...prev, assigned_user: payload.username }));
      }
    }
  }, [role]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreateOrderError('');
    const token = localStorage.getItem('token');

    const assignedUserValue = role === 'user' ? newOrder.assigned_user : newOrder.assigned_user;

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify({
          snum: newOrder.snum,
          order_number: parseInt(newOrder.order_number, 10),
          product_type: newOrder.product_type,
          delivery_date: newOrder.delivery_date,
          assigned_user: assignedUserValue,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create order');
      }

      setModalMessage('Order created successfully!');
      setNewOrder({
        order_number: '',
        product_type: '',
        delivery_date: '',
        assigned_user: role === 'user' ? assignedUserValue : '',
        snum: '',
      });
      fetchNextSnum();
    } catch (err) {
      setCreateOrderError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Create New Order</h3>
      <form
        onSubmit={handleCreateOrder}
        className="space-y-3 sm:space-y-4 max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-xl shadow-md"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-1">SNUM</label>
          <input
            type="text"
            value={newOrder.snum}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            readOnly
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Order Number</label>
          <input
            type="number"
            value={newOrder.order_number}
            onChange={(e) => setNewOrder({ ...newOrder, order_number: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Product Type</label>
          <select
            value={newOrder.product_type}
            onChange={(e) => setNewOrder({ ...newOrder, product_type: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select product type</option>
            {productTypes.map((type) => (
              <option key={type.id} value={type.english_description}>
                {type.english_description}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Delivery Date</label>
          <input
            type="date"
            value={newOrder.delivery_date}
            onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {role === 'admin' ? (
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Assigned User</label>
            <select
              value={newOrder.assigned_user}
              onChange={(e) => setNewOrder({ ...newOrder, assigned_user: e.target.value })}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="" disabled>
                Select an assigned user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Assigned User</label>
            <input
              type="text"
              value={newOrder.assigned_user}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
        )}
        {createOrderError && (
          <p className="text-red-500 text-sm text-center font-medium">{createOrderError}</p>
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white font-bold py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Create Order
        </button>
      </form>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}