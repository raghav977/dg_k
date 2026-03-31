import React from 'react';
import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentInvoiceTable from '../components/dashboard/RecentInvoiceTable';
import StockHistoryCard from '../components/dashboard/StockHistoryCard';
import StockAlertCard from '../components/dashboard/StockAlertCard';
import HeroProduct from '../components/dashboard/HeroProduct';
import FrequentlyCustomer from '../components/dashboard/FrequentlyCustomer';

const MainDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="bg-white shadow rounded-xl p-6">
          <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your business performance and activity.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white shadow rounded-xl p-4">
          <StatCard />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-xl p-4">
              <ChartCard />
            </div>

            <div className="bg-white shadow rounded-xl p-4">
              <StockHistoryCard />
            </div>

            <div className="bg-white shadow rounded-xl p-4">
              <RecentInvoiceTable />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-xl p-4">
              <StockAlertCard />
            </div>

            <div className="bg-white shadow rounded-xl p-4">
              <FrequentlyCustomer />
            </div>

            <div className="bg-white shadow rounded-xl p-4">
              <HeroProduct />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;