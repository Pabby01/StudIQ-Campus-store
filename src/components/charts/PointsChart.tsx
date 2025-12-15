"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type PointsChartProps = {
    data: number[];
    labels: string[];
};

export default function PointsChart({ data = [], labels = [] }: PointsChartProps) {
    // Ensure data and labels are arrays
    const safeData = Array.isArray(data) ? data : [];
    const safeLabels = Array.isArray(labels) ? labels : [];

    const chartData = safeLabels.map((label, index) => ({
        name: label,
        points: safeData[index] || 0
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
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                </defs>
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
                <Area
                    type="monotone"
                    dataKey="points"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPoints)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
