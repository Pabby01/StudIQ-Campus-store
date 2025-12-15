"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type RevenueChartProps = {
    data: number[];
    labels: string[];
};

export default function RevenueChart({ data = [], labels = [] }: RevenueChartProps) {
    // Ensure data and labels are arrays
    const safeData = Array.isArray(data) ? data : [];
    const safeLabels = Array.isArray(labels) ? labels : [];

    const chartData = safeLabels.map((label, index) => ({
        name: label,
        value: safeData[index] || 0
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
            <LineChart data={chartData}>
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
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
