'use client';

import { BarChart3 } from 'lucide-react';
import { useGdpDashboard, useGdpHistory } from '@/hooks/use-gdp';
import { GdpDashboard } from '@/components/gdp';

export default function DashboardPage() {
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
  } = useGdpDashboard();

  const {
    data: historyData,
    isLoading: isHistoryLoading,
  } = useGdpHistory(30);

  const isLoading = isDashboardLoading || isHistoryLoading;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4ADE80]/10">
            <BarChart3 className="h-5 w-5 text-[#4ADE80]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Enigma GDP Dashboard</h1>
            <p className="text-sm text-slate-400">
              Real-time economic metrics for the agent ecosystem
            </p>
          </div>
        </div>
      </div>

      {/* Error State */}
      {dashboardError && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            Failed to load dashboard data. Please try again later.
          </p>
        </div>
      )}

      {/* Dashboard */}
      <GdpDashboard
        dashboard={dashboardData?.dashboard}
        kpis={dashboardData?.kpis}
        history={historyData}
        isLoading={isLoading}
      />
    </div>
  );
}
