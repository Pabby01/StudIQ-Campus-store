export default function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  color = "blue",
}: {
  label: string;
  value: string | number;
  change: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          <p className="text-xs text-slate-600 mt-2">{change}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend !== "neutral" && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <span className={`text-xs font-semibold ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? "↑" : "↓"} {trend === "up" ? "Increasing" : "Decreasing"}
          </span>
        </div>
      )}
    </div>
  );
}
