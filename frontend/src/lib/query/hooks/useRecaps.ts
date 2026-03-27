import { useQuery, useMutation } from '@tanstack/react-query';
import client, { endpoints } from '../../api/client';
import type { MonthlyRecap, AvailableRecapMonth, ApiResponse } from '../../api/types';

const recapKeys = {
  all: ['recaps'] as const,
  available: () => [...recapKeys.all, 'available'] as const,
  detail: (year: number, month: number) => [...recapKeys.all, year, month] as const,
};

export function useAvailableRecaps(enabled = true) {
  return useQuery({
    queryKey: recapKeys.available(),
    queryFn: async () => {
      const response = await client.get<ApiResponse<AvailableRecapMonth[]>>(endpoints.recaps.available);
      return response.data.data;
    },
    enabled,
  });
}

export function useMonthlyRecap(year: number, month: number, enabled = true) {
  return useQuery({
    queryKey: recapKeys.detail(year, month),
    queryFn: async () => {
      const response = await client.get<ApiResponse<MonthlyRecap>>(endpoints.recaps.get(year, month));
      return response.data.data;
    },
    enabled,
    staleTime: Infinity, // Recaps don't change once generated
  });
}

export function useUpdateRecapProgress() {
  return useMutation({
    mutationFn: async ({ id, slideIndex }: { id: number; slideIndex: number }) => {
      await client.patch(endpoints.recaps.updateProgress(id), { slideIndex });
    },
  });
}
