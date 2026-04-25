import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.me().then(r => r.payload),
  })
}
