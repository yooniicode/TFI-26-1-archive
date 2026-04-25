import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me().then(r => r.payload),
  })
}
