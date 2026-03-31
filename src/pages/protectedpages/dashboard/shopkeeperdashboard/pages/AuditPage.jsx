import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiRefreshCw, FiTrendingUp, FiPieChart, FiAlertTriangle, FiDollarSign } from "react-icons/fi";
import { fetchAuditMetrics } from "../../../../../api/Orders";

const periodOptions = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
  { key: "custom", label: "Custom" },
];

const numberFormat = (value = 0) =>
  `Rs ${Number(value ?? 0).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AuditPage = () => {
  const [period, setPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const queryEnabled = period !== "custom" || (customStart && customEnd);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["auditMetrics", period, customStart, customEnd],
    queryFn: () =>
      fetchAuditMetrics({
        period,
        ...(period === "custom" ? { start_date: customStart, end_date: customEnd } : {}),
      }),
    enabled: queryEnabled,
    staleTime: 60 * 1000,
  });

  const totals = data?.totals || {};
  const paymentBreakdown = data?.payment_breakdown || [];
  const topProducts = data?.top_products || [];

  const productTotals = useMemo(() => {
    return topProducts.reduce(
      (acc, product) => {
        acc.quantity += product.quantity_sold || 0;
        acc.revenue += product.revenue || 0;
        acc.cost += product.cost || 0;
        acc.profit += product.profit || 0;
        return acc;
      },
      { quantity: 0, revenue: 0, cost: 0, profit: 0 }
    );
  }, [topProducts]);

  const periodLabel = useMemo(() => {
    if (!data?.start_date || !data?.end_date) return "";
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }, [data]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit Center</h1>
          <p className="text-sm text-gray-500">Track revenue, cost, and profitability across any period.</p>
          {periodLabel && <p className="text-xs text-gray-400">{periodLabel}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {periodOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                period === opt.key ? "bg-blue-600 text-white border-blue-600" : "text-gray-600 border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            disabled={!queryEnabled}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {period === "custom" && (
        <div className="grid grid-cols-1 gap-3 p-4 bg-white border rounded-lg shadow-sm md:grid-cols-3">
          <label className="text-sm text-gray-600">
            Start date
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <label className="text-sm text-gray-600">
            End date
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2"
            />
          </label>
          <div className="text-xs text-gray-500 flex items-center">
            Select both dates to load custom stats.
          </div>
        </div>
      )}

      {!queryEnabled ? (
        <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">Select a valid custom date range.</div>
      ) : isLoading ? (
        <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">Loading audit metrics...</div>
      ) : isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">Unable to load metrics.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <AuditCard icon={<FiTrendingUp />} label="Revenue" value={numberFormat(totals.revenue)} helper={`${totals.orders || 0} orders`} />
            <AuditCard icon={<FiPieChart />} label="Cost" value={numberFormat(totals.cost)} helper="Inventory spend" />
            <AuditCard
              icon={<FiDollarSign />}
              label="Profit"
              value={numberFormat(totals.profit)}
              helper={`Avg order ${numberFormat(totals.average_order_value)}`}
            />
            <AuditCard
              icon={<FiAlertTriangle />}
              label="Outstanding loans"
              value={numberFormat(totals.outstanding_loans)}
              helper={`${totals.open_loan_count || 0} open accounts`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b">
                <h3 className="text-sm font-semibold text-gray-700">Payment breakdown</h3>
              </div>
              <div className="p-4">
                {paymentBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-500">No payments recorded in this period.</p>
                ) : (
                  <ul className="divide-y">
                    {paymentBreakdown.map((entry) => (
                      <li key={entry.payment_method} className="flex items-center justify-between py-2 text-sm">
                        <div className="capitalize">{entry.payment_method}</div>
                        <div className="text-right">
                          <div className="font-semibold">{numberFormat(entry.total)}</div>
                          <div className="text-xs text-gray-500">{entry.count} orders</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Products sold</h3>
                <span className="text-xs text-gray-400">{topProducts.length} items</span>
              </div>
              <div className="overflow-x-auto">
                {topProducts.length === 0 ? (
                  <p className="p-4 text-sm text-gray-500">No products sold in this period.</p>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-right">Units</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Cost</th>
                        <th className="px-4 py-3 text-right">Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {topProducts.map((product) => (
                        <tr key={product.product_id} className="text-gray-700">
                          <td className="px-4 py-3 font-medium">{product.product_name}</td>
                          <td className="px-4 py-3 text-right">{product.quantity_sold}</td>
                          <td className="px-4 py-3 text-right">{numberFormat(product.revenue)}</td>
                          <td className="px-4 py-3 text-right">{numberFormat(product.cost)}</td>
                          <td className="px-4 py-3 text-right text-green-600">{numberFormat(product.profit)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100 font-semibold text-gray-900">
                        <td className="px-4 py-3">Total</td>
                        <td className="px-4 py-3 text-right">{productTotals.quantity}</td>
                        <td className="px-4 py-3 text-right">{numberFormat(productTotals.revenue)}</td>
                        <td className="px-4 py-3 text-right">{numberFormat(productTotals.cost)}</td>
                        <td className="px-4 py-3 text-right text-green-700">{numberFormat(productTotals.profit)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AuditCard = ({ icon, label, value, helper }) => (
  <div className="p-4 bg-white border rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div className="text-xl text-blue-600">{icon}</div>
      <span className="text-xs uppercase tracking-wide text-gray-400">{label}</span>
    </div>
    <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500">{helper}</div>
  </div>
);

export default AuditPage;
