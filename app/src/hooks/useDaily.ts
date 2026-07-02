import { useQuery } from '@tanstack/react-query';
import { videosApi } from '@/api/videos';
import { useAuth } from './useAuth';

export function useDaily() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['daily-status'],
    queryFn: videosApi.getTodayStatus,
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // re-fetch every minute
  });
}
