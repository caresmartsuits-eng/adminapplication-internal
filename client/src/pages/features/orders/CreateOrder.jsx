import React from 'react';
import Modal from '../../../components/Modal';

export default function CreateOrder({ role }) {
  const [newOrder, setNewOrder] = React.useState({
    snum: '',
    order_number: '',
    product_type: '',
    delivery_date: '',
    assigned_user: '',
    quantity: 1,
    person: '',
  });
  const [createOrderError, setCreateOrderError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');
  const [users, setUsers] = React.useState([]);
  const [productTypes, setProductTypes] = React.useState([]);
  const [customerTypes, setCustomerTypes] = React.useState([]);


    const fetchNextSnum = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/orders/next-snum', {
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

    const fetchCustomerTypes = async () => {
        const token = localStorage.getItem('token');
        try {
            // FIX 1: Use the /api/configurations/active endpoint which supports category filtering
            // FIX 2: Use the 'category' query parameter, not 'header'
            const configRes = await fetch(
                import.meta.env.VITE_API_BASE + '/api/configurations/active?category=CUST_TYPE',
                { headers: { Authorization: 'Bearer ' + token } }
            );

            if (configRes.ok) {
                const data = await configRes.json();
                console.log('Fetched customer types:', data);
                // FIX 3: Set customerTypes directly from the array returned by the server (data),
                // assuming the server returns an array of objects like { id: '...', value: '...' }
                setCustomerTypes(data || []);
            } else {
                console.error('Failed to fetch customer types:', configRes.statusText);
            }
        } catch (err) {
            console.error('Failed to fetch customer types:', err);
        }
    };

    const fetchProdTypes = async () => {
        const token = localStorage.getItem('token');
        try {
            // Assuming 'PROD_TYPE' is the category for product types
            const configRes = await fetch(
                import.meta.env.VITE_API_BASE + '/api/configurations/active?category=PROD_TYPE',
                { headers: { Authorization: 'Bearer ' + token } }
            );
            if (configRes.ok) {
                const data = await configRes.json();
                // Assuming data is an array of objects with a 'value' field (e.g., english_description)
                setProductTypes(data || []);
            }
        } catch (err) {
            console.error('Failed to fetch product types:', err);
        }
    };

  React.useEffect(() => {
    fetchNextSnum();
    fetchProdTypes();
    fetchCustomerTypes();
    if (role === 'admin') {
      const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
          const userResponse = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/users', {
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
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Convert 'quantity' to a number if it is the quantity field
        if (name === 'quantity') {
            const numValue = parseInt(value, 10);
            setNewOrder(prev => ({
                ...prev,
                [name]: isNaN(numValue) ? 0 : numValue >= 1 ? numValue : 1
            }));
        } else {
            setNewOrder(prev => ({ ...prev, [name]: value }));
        }
    };
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setCreateOrderError('');
    const token = localStorage.getItem('token');

    const assignedUserValue = role === 'user' ? newOrder.assigned_user : newOrder.assigned_user;
      if (newOrder.quantity <= 0) {
          setCreateOrderError('Quantity must be a positive number.');
          return;
      }
      if (!newOrder.person) {
          setCreateOrderError('Person/Customer Type is required.');
          return;
      }
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/orders/create', {
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
        quantity: newOrder.quantity,
        person: newOrder.person,
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
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 text-left md:text-center">Create New Order</h3>
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
          <label className="block text-gray-700 font-semibold mb-1">Bill Number</label>
          <input
            type="number"
            value={newOrder.order_number}
            onChange={(e) => setNewOrder({ ...newOrder, order_number: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
          <div>
              <label htmlFor="quantity" className="block text-gray-700 font-semibold mb-1">Quantity</label>
              <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={newOrder.quantity}
                  onChange={handleChange}
                  min="1" // Enforce positive number on client side
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
          <div>
              <label htmlFor="person" className="block text-gray-700 font-semibold mb-1">Person / Customer Type</label>
              <select
                  id="person"
                  name="person"
                  value={newOrder.person}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
              >
                  <option value="" disabled>Select Customer Type</option>
                  {customerTypes.map((typeObj) => (
                      <option key={typeObj.id} value={typeObj.english_description}>
                          {typeObj.english_description}
                      </option>
                  ))}
              </select>
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