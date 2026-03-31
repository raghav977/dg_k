import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiTrendingUp, FiDollarSign, FiCreditCard, FiRefreshCw, FiCheckCircle, FiMail, FiSearch } from "react-icons/fi";
import { fetchShopkeeperOrders, payLedger, sendLedgerReminder } from "../../../../../api/Orders";

const formatCurrency = (value = 0) =>
  `Rs ${Number(value).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-teal-100 text-teal-700",
  cancelled: "bg-red-100 text-red-700",
};

const filterTabs = [
  { key: "all", label: "All sales" },
  { key: "loan", label: "Loans" },
  { key: "cleared", label: "Cleared" },
];

const SalesHistory = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [emailModal, setEmailModal] = useState(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ["shopkeeperOrders"],
    queryFn: () => fetchShopkeeperOrders(),
  });

  const orders = data?.orders || [];

  const summary = useMemo(() => {
    const totals = orders.reduce(
      (acc, order) => {
        acc.count += 1;
        acc.revenue += order.total_amount || 0;
        acc.outstanding += order.amount_due || 0;
        if (order.amount_due > 0) acc.activeLoans += 1;
        return acc;
      },
      { count: 0, revenue: 0, outstanding: 0, activeLoans: 0 }
    );

    return totals;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let subset = orders;
    if (activeTab === "loan") {
      subset = orders.filter((order) => order.amount_due > 0);
    } else if (activeTab === "cleared") {
      subset = orders.filter((order) => order.amount_due === 0);
    }

    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return subset;
    }

    return subset.filter((order) => {
      const customerName = order.customer_name ? order.customer_name.toLowerCase() : "";
      const customerPhone = order.customer_phone ? String(order.customer_phone).toLowerCase() : "";
      const orderIdentifier = String(order.pid || order.order_id).toLowerCase();
      return (
        customerName.includes(query) ||
        customerPhone.includes(query) ||
        orderIdentifier.includes(query)
      );
    });
  }, [orders, activeTab, searchTerm]);

  const paymentMutation = useMutation({
    mutationFn: ({ ledgerId, amount }) => payLedger(ledgerId, amount),
    onSuccess: () => {
      queryClient.invalidateQueries(["shopkeeperOrders"]);
      queryClient.invalidateQueries(["shopkeeperLedgers"]);
      setPaymentModal(null);
      setPaymentAmount(0);
    },
  });

  const openPaymentModal = (order) => {
    if (!order.ledger_id) return;
    setPaymentModal(order);
    setPaymentAmount(order.amount_due);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (!paymentModal?.ledger_id || !paymentAmount) return;
    paymentMutation.mutate({ ledgerId: paymentModal.ledger_id, amount: Number(paymentAmount) });
  };

  const closeEmailModal = () => {
    setEmailModal(null);
    setEmailSubject("");
    setEmailMessage("");
  };

  const reminderMutation = useMutation({
    mutationFn: ({ ledgerId, subject, message }) => sendLedgerReminder(ledgerId, { subject, message }),
    onSuccess: closeEmailModal,
  });

  const openEmailModal = (order) => {
    if (!order.ledger_id || !order.customer_id) return;
    const defaultSubject = `Payment reminder for order #${order.pid || order.order_id}`;
    const dueLabel = formatCurrency(order.amount_due || 0).replace("Rs ", "");
    const defaultMessage = `Hi ${order.customer_name || "there"},\n\nThis is a reminder that Rs ${dueLabel} is still due at our shop. Please visit us to settle the remaining balance.\n\nThank you.`;
    setEmailModal(order);
    setEmailSubject(defaultSubject);
    setEmailMessage(defaultMessage);
  };

  const handleSendReminder = (e) => {
    e.preventDefault();
    if (!emailModal?.ledger_id) return;
    reminderMutation.mutate({ ledgerId: emailModal.ledger_id, subject: emailSubject, message: emailMessage });
  };

  const normalizedPayment = Number(paymentAmount) || 0;
  const remainingAfterPayment = paymentModal ? Math.max(paymentModal.amount_due - normalizedPayment, 0) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sales & Loans</h1>
          <p className="text-sm text-gray-500">Track every sale and clear outstanding walk-in loans.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
        <SummaryCard icon={<FiTrendingUp />} label="Total sales" value={summary.count} helper="All orders" />
        <SummaryCard icon={<FiDollarSign />} label="Revenue" value={formatCurrency(summary.revenue)} helper="Gross" />
        <SummaryCard
          icon={<FiCreditCard />}
          label="Outstanding"
          value={formatCurrency(summary.outstanding)}
          helper={`${summary.activeLoans} active loans`}
        />
        <SummaryCard icon={<FiCheckCircle />} label="Cleared" value={summary.count - summary.activeLoans} helper="Paid orders" />
      </div>

      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                activeTab === tab.key ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <FiSearch className="absolute w-4 h-4 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer or order"
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">Loading sales...</div>
      ) : isError ? (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">Failed to load sales data.</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">No sales to show.</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Payment</Th>
                <Th>Totals</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.order_id} className="text-sm text-gray-700">
                  <Td>
                    <div className="font-semibold">#{order.pid || order.order_id}</div>
                    <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</div>
                  </Td>
                  <Td>
                    <div className="font-medium">{order.customer_name}</div>
                    {order.customer_phone && <div className="text-xs text-gray-500">{order.customer_phone}</div>}
                    <div className="text-xs text-gray-400">{order.items?.length || 0} items</div>
                  </Td>
                  <Td>
                    <div className="capitalize">{order.payment_method}</div>
                    {order.amount_due > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-full">
                        Loan
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Paid
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="font-semibold">{formatCurrency(order.total_amount)}</div>
                    {order.amount_due > 0 && (
                      <div className="text-xs text-red-600">Due: {formatCurrency(order.amount_due)}</div>
                    )}
                    {order.amount_paid > 0 && (
                      <div className="text-xs text-gray-500">Paid: {formatCurrency(order.amount_paid)}</div>
                    )}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[order.status] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </Td>
                  <Td>
                    {order.amount_due > 0 && order.ledger_id ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                        >
                          Record payment
                        </button>
                        {order.customer_id && (
                          <button
                            onClick={() => openEmailModal(order)}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 inline-flex items-center justify-center gap-1"
                          >
                            <FiMail className="w-3 h-3" />
                            Send reminder
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Clear loan for {paymentModal.customer_name}</h3>
            <p className="mt-1 text-sm text-gray-500">Only shopkeepers can record repayments. Customers can only view status.</p>
            <form className="mt-4 space-y-4" onSubmit={handlePayment}>
              <div>
                <label className="text-sm font-medium text-gray-700">Amount paid</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Outstanding: {formatCurrency(paymentModal.amount_due)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Amount remaining will be collected and updated: {formatCurrency(remainingAfterPayment)}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setPaymentModal(null)} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {paymentMutation.isLoading ? "Recording..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">Send reminder to {emailModal.customer_name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Let your customer know about the outstanding balance directly from here.
            </p>
            <form className="mt-4 space-y-4" onSubmit={handleSendReminder}>
              <div>
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <textarea
                  rows={5}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border rounded-lg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due amount: {formatCurrency(emailModal.amount_due)} | Order #{emailModal.pid || emailModal.order_id}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEmailModal} className="px-4 py-2 text-sm text-gray-600">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reminderMutation.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {reminderMutation.isLoading ? "Sending..." : "Send email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon, label, value, helper }) => (
  <div className="p-4 bg-white border rounded-lg shadow-sm">
    <div className="flex items-center justify-between">
      <div className="text-2xl text-green-600">{icon}</div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
    </div>
    <div className="mt-2 text-xl font-semibold text-gray-900">{value}</div>
    <div className="text-sm text-gray-500">{helper}</div>
  </div>
);

const Th = ({ children }) => (
  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    {children}
  </th>
);

const Td = ({ children }) => <td className="px-4 py-4 align-top">{children}</td>;

export default SalesHistory;
