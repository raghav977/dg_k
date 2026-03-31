import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard";
import { FiAlertTriangle, FiLoader } from "react-icons/fi";

const StockAlertCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shopkeeperDashboard"],
    queryFn: fetchShopkeeperDashboard,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center justify-center h-48">
        <FiLoader className="w-5 h-5 animate-spin text-green-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl shadow border border-gray-100 p-5 text-center text-red-500">
        Failed to fetch stock alerts
      </div>
    );
  }

  const alerts = data?.stock_alerts || [];

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Stock Alerts</h2>
        <span className="text-xs text-gray-500">Below 10 units</span>
      </div>
      {alerts.length ? (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-amber-100">
                <FiAlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{alert.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {alert.selling_price !== null && alert.selling_price !== undefined
                    ? `Rs ${Number(alert.selling_price).toLocaleString()}`
                    : "Price unavailable"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Stock</p>
                <p className="text-base font-bold text-amber-600">{alert.stock}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Inventory looks healthy. No low-stock items.
        </div>
      )}
    </div>
  );
};

export default StockAlertCard;
