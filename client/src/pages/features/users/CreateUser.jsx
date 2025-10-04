import React from 'react';
import Modal from '../../../components/Modal';

export default function CreateUser({ onUserCreated }) {
  const [newUser, setNewUser] = React.useState({ username: '', password: '', role: 'user' });
  const [createUserError, setCreateUserError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
      }

      setModalMessage('User created successfully!');
      setNewUser({ username: '', password: '', role: 'user' });
      if (onUserCreated) onUserCreated();
    } catch (err) {
      setCreateUserError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Create New User</h3>
      <form
        onSubmit={handleCreateUser}
        className="space-y-3 sm:space-y-4 max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-xl shadow-md"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Username</label>
          <input
            type="text"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Password</label>
          <input
            type="password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Role</label>
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {createUserError && (
          <p className="text-red-500 text-sm text-center font-medium">{createUserError}</p>
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white font-bold py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Create User
        </button>
      </form>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}