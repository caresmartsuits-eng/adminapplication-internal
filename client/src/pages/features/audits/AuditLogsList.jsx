import React, { useState, useEffect, useMemo } from 'react';

export default function AuditLogsList() {
  const [audits, setAudits] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);


    // State for search filters
    const [filters, setFilters] = React.useState({
        fromDate: '',
        toDate: '',
        action: '',
        username: '',
        detailsText: '',
    });

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

    // Filter the audit logs based on the current filter state
    const filteredAudits = useMemo(() => {
        return audits.filter(audit => {
            const auditTimestamp = new Date(audit.timestamp).getTime();
            const detailsText = JSON.stringify(audit.details).toLowerCase();

            // 1. Date Range Filter (from date)
            if (filters.fromDate) {
                const fromDate = new Date(filters.fromDate).getTime();
                // Check if the audit date is ON or AFTER the fromDate
                if (auditTimestamp < fromDate) {
                    return false;
                }
            }

            // 2. Date Range Filter (to date)
            if (filters.toDate) {
                // We set the time to the end of the day (23:59:59.999) for the 'to' date
                const toDate = new Date(filters.toDate);
                toDate.setHours(23, 59, 59, 999);
                if (auditTimestamp > toDate.getTime()) {
                    return false;
                }
            }

            // 3. Action Filter
            if (filters.action && !audit.action.toLowerCase().includes(filters.action.toLowerCase())) {
                return false;
            }

            // 4. User Filter
            if (filters.username && !audit.username.toLowerCase().includes(filters.username.toLowerCase())) {
                return false;
            }

            // 5. Details Text Search
            if (filters.detailsText && !detailsText.includes(filters.detailsText.toLowerCase())) {
                return false;
            }

            return true; // Passes all filters
        });
    }, [audits, filters]);

    // Handler for all filter inputs
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="text-center text-gray-500">Loading audit logs...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Audit Logs</h3>

        {/* ────────────────────────────────── Filter Panel ────────────────────────────────── */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">Filter Logs</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">

                {/* From Date */}
                <div>
                    <label htmlFor="fromDate" className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                    <input
                        type="date"
                        name="fromDate"
                        id="fromDate"
                        value={filters.fromDate}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* To Date */}
                <div>
                    <label htmlFor="toDate" className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                    <input
                        type="date"
                        name="toDate"
                        id="toDate"
                        value={filters.toDate}
                        onChange={handleFilterChange}
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Action Search */}
                <div>
                    <label htmlFor="action" className="block text-xs font-medium text-gray-500 mb-1">Action Search</label>
                    <input
                        type="text"
                        name="action"
                        id="action"
                        value={filters.action}
                        onChange={handleFilterChange}
                        placeholder="e.g., LOGIN, ORDER_CREATED"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* User Search */}
                <div>
                    <label htmlFor="username" className="block text-xs font-medium text-gray-500 mb-1">User Search</label>
                    <input
                        type="text"
                        name="username"
                        id="username"
                        value={filters.username}
                        onChange={handleFilterChange}
                        placeholder="e.g., admin_user"
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Details Text Search */}
                <div className="sm:col-span-2 md:col-span-1"> {/* Adjust column span for a better layout */}
                    <label htmlFor="detailsText" className="block text-xs font-medium text-gray-500 mb-1">Details Text Search</label>
                    <input
                        type="text"
                        name="detailsText"
                        id="detailsText"
                        value={filters.detailsText}
                        onChange={handleFilterChange}
                        placeholder="Search details JSON..."
                        className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

            </div>
            <p className="text-sm text-gray-500 mt-3">{filteredAudits.length} of {audits.length} logs displayed.</p>
        </div>
        {/* ────────────────────────────────── End Filter Panel ────────────────────────────────── */}
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
            {filteredAudits.length > 0 ? (
                filteredAudits.map((audit, index) => (
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