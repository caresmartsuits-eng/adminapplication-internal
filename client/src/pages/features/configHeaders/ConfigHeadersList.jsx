import React from 'react';
import UpdateConfigHeaderModal from './UpdateConfigHeaderModal';

export default function ConfigHeadersList({ setView }) {
  const [headers, setHeaders] = React.useState([]);
  const [selectedHeader, setSelectedHeader] = React.useState(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const fetchHeaders = async () => {
    const token = localStorage.getItem('token');
    try {
      setLoading(true);
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/config-headers', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch config headers');
      }
      const data = await response.json();
      setHeaders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchHeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-center text-gray-500">Loading config headers...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Config Headers</h3>
      <div className="mb-4">
        <button
          onClick={() => setView && setView('createConfigHeader')}
          className="bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Add New Config Category
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Category Code
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                English Description
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Telugu Description
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Created By
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Created Date
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {headers.length > 0 ? (
              headers.map((header) => (
                <tr key={header.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-900">{header.id}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{header.category_code}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-600">
                    {header.category_description_english}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 text-gray-600">
                    {header.category_description_telugu}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">
                    {header.created_by || 'N/A'}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">
                    {new Date(header.created_date).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap font-semibold text-gray-600 capitalize">
                    {header.status}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedHeader(header)}
                      className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md hover:bg-blue-600 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-4 px-6 text-center text-gray-500">
                  No config headers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedHeader && (
        <UpdateConfigHeaderModal
          header={selectedHeader}
          onClose={() => setSelectedHeader(null)}
          onHeaderUpdated={fetchHeaders}
        />
      )}
    </div>
  );
}