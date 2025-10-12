import React, { useState, useEffect,useRef } from 'react';
import {fetchWithAuthJSON} from "../../../utils/auth.js";
// Assuming you have an API utility for fetching data
// import { fetchFilteredOrders } from '../../api/orders';


const getFilteredOrders = async () => {
    // NOTE: This assumes your authentication token is stored in localStorage.
    // Adjust this to match your actual authentication pattern (e.g., using a custom fetch utility or context).
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Authentication token not found. Please log in.');


    const response = await fetchWithAuthJSON(import.meta.env.VITE_API_BASE +'/api/orders/delivery-status', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });


   return response;
};

export default function CurrentDeliveries() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const componentRef = useRef();
    useEffect(() => {
        setLoading(true);
        // In a real application, this function would handle the API call
        // to get current day delivered and past not-delivered orders.
        // The date logic (today, past dates, status check) should ideally be handled by your backend API.
        const getOrdersData = async () => {
            try {
                // const data = await fetchFilteredOrders(); // Replace with your actual API call
                // Mock data for demonstration:
                const data = await getFilteredOrders();
                setOrders(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        getOrdersData();
    }, []);
    // 🛑 NEW: Print handler function
    const handlePrint = () => {
        // This opens the browser's print dialog
        window.print();
    };
    if (loading) return <div className="text-center p-4">Loading Orders...</div>;
    if (error) return <div className="text-center p-4 text-red-500">Error: {error}</div>;

    return (

        <div className="p-4 sm:p-6 bg-white shadow-lg rounded-lg">
            <div className="p-4 flex justify-between items-center border-b border-gray-200 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Day Deliveries & Pending Past Orders</h2>

            {/* 🛑 NEW: Print Button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={handlePrint}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2v2H5v-2h2m-2 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2zM17 9H7v2h10V9z"></path></svg>
                    Print List
                </button>
            </div>
            </div>
            {/* End Print Button */}
            {error && <p className="text-red-500 mb-4">{error}</p>}


                <div className="overflow-x-auto rounded-lg shadow-md" ref={componentRef}  id="delivery-printable-area">
                    <h2 className="text-xl font-semibold mb-4 hidden" id="delivery-printable-header" >Current Day Deliveries & Pending Past Orders</h2>
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
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="py-10 text-center text-gray-500">Loading current deliveries...</td>
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
                                </tr>
                        ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="py-4 px-6 text-center text-gray-500">
                                    No current or pending deliveries found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

        </div>
    );
}