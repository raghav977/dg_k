import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard";
import { FiLoader, FiShoppingBag } from "react-icons/fi";

const HeroProduct = () => {
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
        Unable to fetch hero products
      </div>
    );
  }

  const heroProducts = data?.hero_products || [];

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Hero Products</h2>
        <span className="text-xs text-gray-500">Top sellers</span>
      </div>
      {heroProducts.length ? (
        <ul className="divide-y divide-gray-100">
          {heroProducts.map((product) => (
            <li key={product.id} className="p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <FiShoppingBag />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {product.quantity_sold} sold
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {product.description || "No description provided."}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Avg. order value</span>
                  <span className="text-base font-bold text-gray-900">
                    {product.price ? `Rs ${Number(product.price).toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Revenue: Rs {Number(product.total_revenue || 0).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="p-5 text-sm text-gray-500">No sales data yet.</div>
      )}
    </div>
  );
};

export default HeroProduct;