"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type OrdersChartProps = {
    data: number[];
    labels: string[];
};

export default function OrdersChart({ data = [], labels = [] }: OrdersChartProps) {
    // Ensure data and labels are arrays
    const safeData = Array.isArray(data) ? data : [];
    const safeLabels = Array.isArray(labels) ? labels : [];

    const chartData = safeLabels.map((label, index) => ({
        name: label,
        orders: safeData[index] || 0
    }));

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-text">
                No data available
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                    dataKey="name"
                    stroke="#888"
                    fontSize={12}
                />
                <YAxis
                    stroke="#888"
                    fontSize={12}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                    }}
                />
                <Bar
                    dataKey="orders"
                    fill="#f59e0b"
                    radius={[8, 8, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}
