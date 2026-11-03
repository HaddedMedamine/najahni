import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import { ADMIN_KEY, useAdminMutation } from './shared'

export interface Room {
  id: string
  name: string
  capacity: number
  isActive: boolean
}

export type RoomInput = Pick<Room, 'name' | 'capacity'> & { isActive?: boolean }

const KEY = [ADMIN_KEY, 'rooms'] as const

export const useRooms = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Room[]>('/admin/rooms').then((r) => r.data),
  })

export const useCreateRoom = () =>
  useAdminMutation((input: RoomInput) =>
    api.post<Room>('/admin/rooms', input).then((r) => r.data),
  )

export const useUpdateRoom = () =>
  useAdminMutation(({ id, ...input }: Partial<RoomInput> & { id: string }) =>
    api.patch<Room>(`/admin/rooms/${id}`, input).then((r) => r.data),
  )

export const useDeleteRoom = () =>
  useAdminMutation((id: string) => api.delete(`/admin/rooms/${id}`))
