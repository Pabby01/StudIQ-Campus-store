export default function AnalyticsChart({
  labels,
  data,
  color = "bg-blue-600",
  title = "Data",
}: {
  labels: string[];
  data: number[];
  color?: string;
  title?: string;
}) {
  const maxValue = Math.max(...data);
  const chartHeight = 200;

  return (
    <div className="w-full">
      <div className="flex items-end justify-center gap-1 h-48">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center group">
            <div
              className={`w-full ${color} rounded-t transition-all hover:opacity-80 relative group`}
              style={{ height: `${(value / maxValue) * chartHeight}px` }}
              title={`${title}: ${value}`}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 whitespace-nowrap">
                {value}
              </div>
            </div>
            <span className="text-xs text-slate-600 mt-2 text-center truncate max-w-full">
              {labels[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
