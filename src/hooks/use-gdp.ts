import { useQuery } from '@tanstack/react-query';

interface GdpHistoryEntry {
  date: string;
  paymentVolumeUsd: number;
  burnVolumeUsd: number;
  dealVolumeUsd: number;
}

interface GdpDashboardData {
  dashboard: {
    growthMetrics?: {
      paymentGrowth?: number;
      burnGrowth?: number;
      dealGrowth?: number;
    };
  };
  kpis: {
    totalEconomicVolume?: number;
    avgDailyVolume?: number;
    peakDay?: { date: string; amount: number };
    activityStreak?: number;
  };
}

interface ApiResponse<T> {
  data: T;
  error: string | null;
}

export function useGdpDashboard() {
  return useQuery({
    queryKey: ['gdp', 'dashboard'],
    queryFn: async (): Promise<GdpDashboardData> => {
      const res = await fetch('/api/v1/gdp/dashboard');
      if (!res.ok) throw new Error('Failed to fetch GDP dashboard');
      const json: ApiResponse<GdpDashboardData> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useGdpHistory(days: number = 30) {
  return useQuery({
    queryKey: ['gdp', 'history', days],
    queryFn: async (): Promise<GdpHistoryEntry[]> => {
      const res = await fetch(`/api/v1/gdp/history?days=${days}`);
      if (!res.ok) throw new Error('Failed to fetch GDP history');
      const json: ApiResponse<GdpHistoryEntry[]> = await res.json();
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    staleTime: 60_000,
  });
}
