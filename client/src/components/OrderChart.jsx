// src/components/OrderChart.jsx (Example using react-chartjs-2)

import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register components used by the chart (CRITICAL STEP)
ChartJS.register(ArcElement, Tooltip, Legend);

export default function OrderChart({ data }) {
    if (!data || data.length === 0) { // <-- Added Array.isArray check
        return (
            <div className="text-center text-gray-500 p-8">
                No order data available for breakdown.
            </div>
        );
    }
    const backgroundColors = [
        '#3b82f6', // blue-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#10b981', // emerald-500
        '#6366f1', // indigo-500
        '#a855f7', // purple-500
        '#ec4899', // pink-500
    ];
    const safeData = data || [];

    // 💡 CLEAN FIX: Map and log data separately
    const labels = safeData.map(item => item.status);
    const counts = safeData.map(item => item.count);


    const chartData = {
        labels: labels, // Use the clean labels array
        datasets: [{
            data: counts, // Use the clean counts array (array of numbers)
            backgroundColor: backgroundColors.slice(0, safeData.length),
            hoverOffset: 4,
        }]
    };

    return (
        // Ensure this container is full width/height
        <div className="w-full h-full flex items-center justify-center">
            <Doughnut
                data={chartData}
                options={{
                    // CRITICAL: Tells the chart to scale with the parent div
                    responsive: true,
                    // CRITICAL: Must be false for responsive containers, especially flex
                    maintainAspectRatio: false,

                    // You might need to explicitly set the cutting radius if it's drawing as a tiny dot
                    cutout: '60%',

                    // Optional but helpful: ensure plugins are enabled
                    plugins: {
                        legend: {
                            display: true, // Make sure legend is enabled
                            position: 'right',
                            labels: { padding: 20 }
                        },
                        tooltip: {
                            enabled: true,
                        }
                    }
                }}
            />
        </div>
    );
}