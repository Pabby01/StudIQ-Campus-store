"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type RevenueChartProps = {
    data: {
        labels: string[];
        revenue: number[];
    };
    currency: string;
};

export default function RevenueChart({ data, currency }: RevenueChartProps) {
    // Transform data for Recharts
    const chartData = data.labels.map((label, index) => ({
        date: label,
        revenue: data.revenue[index]
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px'
                        }}
                        formatter={(value: number) => [
                            `${currency === 'SOL' ? `${value.toFixed(2)} SOL` : `$${value.toFixed(2)}`}`,
                            'Revenue'
                        ]}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
