"use client";

export default function BarChart({
  data,
  labels,
  color = "bg-blue-600",
  title,
  showValues = true,
}: {
  data: number[];
  labels: string[];
  color?: string;
  title?: string;
  showValues?: boolean;
}) {
  const maxValue = Math.max(...data);
  const colorMap: { [key: string]: string } = {
    "bg-blue-600": "#2563EB",
    "bg-green-600": "#16A34A",
    "bg-purple-600": "#9333EA",
    "bg-orange-600": "#EA580C",
    "bg-pink-600": "#DB2777",
    "bg-red-600": "#DC2626",
    "bg-yellow-600": "#CA8A04",
    "bg-indigo-600": "#4F46E5",
  };

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-bold text-slate-900">{title}</h3>}
      
      <div className="space-y-3">
        {data.map((value, index) => {
          const percentage = (value / maxValue) * 100;
          return (
            <div key={labels[index]} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">{labels[index]}</span>
                {showValues && <span className="text-sm font-semibold text-slate-900">{value}</span>}
              </div>
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${color} transition-all duration-300 flex items-center justify-end pr-3`}
                  style={{ width: `${percentage}%` }}
                >
                  {percentage > 20 && showValues && (
                    <span className="text-xs font-bold text-white">{Math.round(percentage)}%</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
