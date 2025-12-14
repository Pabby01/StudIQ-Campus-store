"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type OrdersChartProps = {
    data: {
        labels: string[];
        orders: number[];
    };
};

export default function OrdersChart({ data }: OrdersChartProps) {
    // Transform data for Recharts
    const chartData = data.labels.map((label, index) => ({
        date: label,
        orders: data.orders[index]
    }));

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '8px'
                        }}
                        formatter={(value: number) => [value, 'Orders']}
                    />
                    <Legend />
                    <Bar
                        dataKey="orders"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                        name="Orders"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
