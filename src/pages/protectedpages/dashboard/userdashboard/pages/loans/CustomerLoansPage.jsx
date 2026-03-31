import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSearch, FiCreditCard, FiX } from "react-icons/fi";
import { fetchCustomerLedgers, initiateLedgerEsewaPayment } from "../../../../../../api/Orders";

const formatCurrency = (value = 0) =>
  `Rs ${Number(value).toLocaleString("en-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CustomerLoansPage = () => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["customerLedgers"],
    queryFn: () => fetchCustomerLedgers(),
  });

  const ledgers = data?.ledgers || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const paymentMutation = useMutation({
    mutationFn: ({ ledgerId, amount }) => initiateLedgerEsewaPayment(ledgerId, amount),
    onSuccess: (data) => {
      setPaymentError("");
      setPaymentModal(null);
      submitEsewaForm(data?.pay_url, data?.fields);
    },
    onError: (error) => {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.response?.data ||
        "Unable to initiate payment.";
      setPaymentError(typeof message === "string" ? message : "Unable to initiate payment.");
    },
  });

  const openPaymentModal = (ledger) => {
    setPaymentModal(ledger);
    setPaymentAmount(Number(ledger.amount_due).toFixed(2));
    setPaymentError("");
  };

  const closePaymentModal = () => {
    if (paymentMutation.isPending) return;
    setPaymentModal(null);
    setPaymentAmount("");
    setPaymentError("");
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    const amountNumber = Number(paymentAmount);
    if (!amountNumber || amountNumber <= 0) {
      setPaymentError("Enter an amount greater than zero.");
      return;
    }
    paymentMutation.mutate({
      ledgerId: paymentModal.ledger_id,
      amount: amountNumber,
    });
  };

  const submitEsewaForm = (payUrl, fields) => {
    if (!payUrl || !fields) return;
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payUrl;
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const summary = useMemo(() => {
    return ledgers.reduce(
      (acc, ledger) => {
        if (ledger.amount_due > 0) {
          acc.active += 1;
          acc.outstanding += ledger.amount_due;
        } else {
          acc.cleared += 1;
        }
        acc.total += 1;
        return acc;
      },
      { total: 0, active: 0, cleared: 0, outstanding: 0 }
    );
  }, [ledgers]);

  const filteredLedgers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return ledgers;
    return ledgers.filter((ledger) => {
      const businessName = ledger.business_name ? ledger.business_name.toLowerCase() : "";
      const orderIdentifier = String(ledger.order_id).toLowerCase();
      return businessName.includes(query) || orderIdentifier.includes(query);
    });
  }, [ledgers, searchTerm]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Loans</h1>
          <p className="text-sm text-gray-500">
            These purchases were recorded as credit by your shopkeeper. Payments can only be cleared by the shopkeeper.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <SummaryCard label="Active loans" value={summary.active} helper="Awaiting clearance" accent="text-orange-600" />
        <SummaryCard label="Outstanding" value={formatCurrency(summary.outstanding)} helper="Total due" />
        <SummaryCard label="Cleared" value={summary.cleared} helper="Fully paid" accent="text-green-600" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">Loading loans...</div>
      ) : isError ? (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">Unable to load loan data.</div>
      ) : ledgers.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">No credit purchases yet.</div>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <div className="relative w-full md:w-72">
              <FiSearch className="absolute w-4 h-4 text-gray-400 left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                placeholder="Search by shop or order ID"
              />
            </div>
          </div>
          {filteredLedgers.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-white border rounded-lg">No loans match your search.</div>
          ) : (
            <div className="space-y-4">
              {filteredLedgers.map((ledger) => (
                <div key={ledger.ledger_id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{ledger.order_id}</h3>
                      <p className="text-sm text-gray-500">{ledger.business_name}</p>
                    </div>
                    <StatusPill isPaid={ledger.amount_due === 0} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Info label="Total" value={formatCurrency(ledger.total_amount)} />
                    <Info label="Paid" value={formatCurrency(ledger.amount_paid)} />
                    <Info label="Due" value={formatCurrency(ledger.amount_due)} highlight={ledger.amount_due > 0} />
                    <Info label="Payment method" value={ledger.payment_method} />
                  </div>
                  {ledger.amount_due > 0 && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openPaymentModal(ledger)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                      >
                        <FiCreditCard /> Pay via eSewa
                      </button>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-gray-500">
                    Last update: {new Date(ledger.updated_at).toLocaleString()} | Please visit the shopkeeper to settle the due amount.
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

        {paymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500">Order #{paymentModal.order_id}</p>
                  <h2 className="text-lg font-semibold text-gray-900">Pay due via eSewa</h2>
                </div>
                <button
                  onClick={closePaymentModal}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={paymentMutation.isPending}
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4 px-6 py-5">
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                  <p className="font-medium text-gray-800">{paymentModal.business_name}</p>
                  <p>Total due: <span className="font-semibold text-gray-900">{formatCurrency(paymentModal.amount_due)}</span></p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="paymentAmount">Amount to pay (Rs)</label>
                  <input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="1"
                    max={paymentModal.amount_due}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-gray-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">You can make a partial payment. Remaining balance will stay open until cleared.</p>
                </div>
                {paymentError && <p className="text-sm text-red-600">{paymentError}</p>}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                    onClick={closePaymentModal}
                    disabled={paymentMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white ${
                      paymentMutation.isPending ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                    disabled={paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? "Processing..." : "Continue to eSewa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

const SummaryCard = ({ label, value, helper, accent = "text-gray-900" }) => (
  <div className="p-4 bg-white border rounded-lg shadow-sm">
    <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xs text-gray-400">{helper}</p>
  </div>
);

const StatusPill = ({ isPaid }) => (
  <div
    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
      isPaid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
    }`}
  >
    {isPaid ? <FiCheckCircle /> : <FiAlertTriangle />}
    {isPaid ? "Cleared" : "Awaiting shopkeeper"}
  </div>
);

const Info = ({ label, value, highlight }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`text-base font-semibold ${highlight ? "text-red-600" : "text-gray-900"}`}>{value}</p>
  </div>
);

export default CustomerLoansPage;
