import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard";
import { FiLoader, FiTrendingUp } from "react-icons/fi";

const trendColors = {
  up: "text-emerald-600",
  down: "text-rose-600",
  flat: "text-gray-400",
};

const StockHistoryCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shopkeeperDashboard"],
    queryFn: fetchShopkeeperDashboard,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center justify-center h-48">
        <FiLoader className="w-6 h-6 animate-spin text-green-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center text-red-500">
        Unable to load stock history
      </div>
    );
  }

  const metrics = data?.stock_history || [];

  if (!metrics.length) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
        <h2 className="text-lg font-semibold mb-2 text-gray-900">Inventory Snapshot</h2>
        <p className="text-sm text-gray-500">No stock activity to display yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Inventory Snapshot</h2>
          <p className="text-xs text-gray-500">Live pull from your orders & stock</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {metrics.map((metric) => {
          const trend = metric.trend_direction || "flat";
          const value = Number(metric.value ?? 0);
          return (
            <div key={metric.key} className="p-4 border border-gray-100 rounded-xl hover:shadow-sm transition bg-gray-50/60">
              <div className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</span>
                {metric.trend_pct !== null && metric.trend_pct !== undefined && (
                  <span className={`flex items-center gap-1 text-xs font-semibold ${trendColors[trend]}`}>
                    <FiTrendingUp className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`} />
                    {metric.trend_pct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">{metric.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockHistoryCard;
