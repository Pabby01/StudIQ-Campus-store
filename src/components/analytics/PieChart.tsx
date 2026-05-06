"use client";

export default function PieChart({
  data,
  labels,
  colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"],
  title,
}: {
  data: number[];
  labels: string[];
  colors?: string[];
  title?: string;
}) {
  const total = data.reduce((a, b) => a + b, 0);
  const percentages = data.map((value) => ((value / total) * 100).toFixed(1));

  // Calculate pie segments
  let currentAngle = 0;
  const segments = data.map((value, index) => {
    const sliceAngle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;

    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { path, index, value, percentage: percentages[index] };
  });

  const colorMap: { [key: string]: string } = {
    "bg-blue-500": "#3B82F6",
    "bg-green-500": "#10B981",
    "bg-purple-500": "#A855F7",
    "bg-orange-500": "#F97316",
    "bg-pink-500": "#EC4899",
    "bg-red-500": "#EF4444",
    "bg-yellow-500": "#EAB308",
    "bg-indigo-500": "#6366F1",
  };

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* SVG Pie Chart */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-48 h-48">
            {segments.map((segment) => (
              <path
                key={segment.index}
                d={segment.path}
                fill={colorMap[colors[segment.index % colors.length]] || "#3B82F6"}
                stroke="white"
                strokeWidth="1"
              />
            ))}
            <circle cx="50" cy="50" r="25" fill="white" />
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {labels.map((label, index) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}
              ></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-xs text-slate-500">{percentages[index]}%</p>
              </div>
              <p className="text-sm font-semibold text-slate-900">{data[index]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
