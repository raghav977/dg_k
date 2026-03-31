import React from 'react'
import { useQuery } from "@tanstack/react-query"
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { fetchShopkeeperDashboard } from "../../../../../../api/Dashboard"
import { FiLoader } from "react-icons/fi"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `Rs ${ctx.parsed.y.toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => `Rs ${value.toLocaleString()}`,
      },
    },
  },
}

const ChartCard = () => {
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ["shopkeeperDashboard"],
    queryFn: fetchShopkeeperDashboard,
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-72">
        <FiLoader className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-center h-72 text-red-500">
        Failed to load chart data
      </div>
    )
  }

  const monthlyRevenue = dashboardData?.monthly_revenue || []

  const chartData = {
    labels: monthlyRevenue.map((m) => m.month),
    datasets: [
      {
        label: 'Revenue',
        data: monthlyRevenue.map((m) => m.amount),
        backgroundColor: '#4ade80',
        borderRadius: 4,
      },
    ],
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Monthly Revenue</h2>
        <span className="text-sm text-gray-500">Last 6 months</span>
      </div>

      {monthlyRevenue.length > 0 ? (
        <Bar data={chartData} options={options} height={250} />
      ) : (
        <div className="flex items-center justify-center h-56 text-gray-400">
          No revenue data available
        </div>
      )}
    </div>
  )
}

export default ChartCard