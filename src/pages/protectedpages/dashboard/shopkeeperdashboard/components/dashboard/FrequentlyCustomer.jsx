import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard";
import { FiLoader } from "react-icons/fi";

const avatarColors = [
  "bg-indigo-100 text-indigo-700",
  "bg-pink-100 text-pink-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
];

const FrequentlyCustomer = () => {
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
        Could not load customer insights
      </div>
    );
  }

  const customers = data?.frequent_customers || [];

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Frequent Customers</h2>
          <p className="text-xs text-gray-500">Based on completed orders</p>
        </div>
        {customers.length > 0 && (
          <span className="text-xs font-semibold text-indigo-600">
            Top {customers.length}
          </span>
        )}
      </div>
      {customers.length ? (
        <ul className="divide-y divide-gray-100">
          {customers.map((customer, index) => (
            <li key={customer.id || index} className="flex items-center gap-4 py-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${avatarColors[index % avatarColors.length]}`}>
                {(customer.name || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{customer.name}</div>
                <div className="text-xs text-gray-500">
                  Visits: <span className="font-semibold text-indigo-600">{customer.visits}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Total Spent</div>
                <div className="font-bold text-green-600">Rs {Number(customer.total_spent || 0).toLocaleString()}</div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No repeat customers just yet.</p>
      )}
    </div>
  );
};

export default FrequentlyCustomer;