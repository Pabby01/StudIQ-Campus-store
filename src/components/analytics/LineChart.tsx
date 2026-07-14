"use client";

export default function LineChart({
  data,
  labels,
  color = "rgb(59, 130, 246)",
  title,
  height = 200,
}: {
  data: number[];
  labels: string[];
  color?: string;
  title?: string;
  height?: number;
}) {
  const padding = 40;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const width = 600;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Calculate points
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
    return { x, y, value };
  });

  // Create path
  const pathData = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Create gradient
  const gradientId = `gradient-${Math.random()}`;

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
      
      <div className="overflow-x-auto">
        <svg width={width} height={height} className="w-full" style={{ minWidth: "100%" }}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding + (i / 4) * chartHeight;
            return (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4"
                strokeWidth="1"
              />
            );
          })}

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = maxValue - (i / 4) * range;
            const y = padding + (i / 4) * chartHeight;
            return (
              <text
                key={`label-${i}`}
                x={padding - 10}
                y={y + 4}
                fontSize="12"
                fill="#64748B"
                textAnchor="end"
              >
                {Math.round(value)}
              </text>
            );
          })}

          {/* Area under curve */}
          <path
            d={`${pathData} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${
              padding + chartHeight
            } Z`}
            fill={`url(#${gradientId})`}
          />

          {/* Line */}
          <path
            d={pathData}
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={color}
              strokeWidth="2"
            />
          ))}

          {/* X-axis labels */}
          {labels.map((label, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
            return (
              <text
                key={`x-label-${index}`}
                x={x}
                y={height - 10}
                fontSize="12"
                fill="#64748B"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
