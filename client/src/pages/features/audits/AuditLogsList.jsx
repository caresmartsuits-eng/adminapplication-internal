import React from 'react';

export default function AuditLogsList() {
  const [audits, setAudits] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAudits = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE + '/api/audits', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch audit logs');
        }
        const data = await response.json();
        setAudits(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  if (loading) return <div className="text-center text-gray-500">Loading audit logs...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Audit Logs</h3>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Action
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                User
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {audits.length > 0 ? (
              audits.map((audit, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">
                    {new Date(audit.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap font-semibold text-gray-900">
                    {audit.action}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">
                    {audit.username}
                  </td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6">
                    <pre className="whitespace-pre-wrap font-mono text-[11px] sm:text-xs bg-gray-50 p-2 rounded-md">
                      {JSON.stringify(audit.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="py-4 px-6 text-center text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}