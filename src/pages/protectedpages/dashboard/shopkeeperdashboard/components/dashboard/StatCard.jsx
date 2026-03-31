import { useQuery } from "@tanstack/react-query";
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard";
import { FiLoader, FiUsers, FiPackage, FiDollarSign, FiAlertTriangle, FiClock, FiCreditCard } from "react-icons/fi";

export default function StatCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shopkeeperDashboard"],
    queryFn: fetchShopkeeperDashboard,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center">
        <FiLoader className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-red-500">
        Failed to load stats
      </div>
    );
  }

  const stats = [
    {
      label: "Total Revenue",
      value: `Rs ${(data?.total_revenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
    },
    {
      label: "Total Customers",
      value: data?.total_customers || 0,
      icon: FiUsers,
    },
    {
      label: "Total Products",
      value: data?.total_products || 0,
      icon: FiPackage,
    },
    {
      label: "Pending Orders",
      value: data?.pending_orders || 0,
      icon: FiClock,
    },
    {
      label: "Low Stock",
      value: data?.low_stock || 0,
      icon: FiAlertTriangle,
    },
    {
      label: "Outstanding",
      value: `Rs ${(data?.outstanding_receivables || 0).toLocaleString()}`,
      icon: FiCreditCard,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow p-4 flex items-center gap-3"
          >
            <div className="bg-gray-100 p-2 rounded-md">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>

            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}