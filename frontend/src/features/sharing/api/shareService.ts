import type {
  CreateSharePayload,
  SharePermission,
  TaskShare,
  UpdateSharePayload,
} from '@/features/sharing/types/shareTypes'
import { httpClient } from '@/shared/lib/httpClient'

export const shareService = {
  list: (taskId: number) =>
    httpClient.get<TaskShare[]>(`tasks/${taskId}/shares/`),
  create: (taskId: number, payload: CreateSharePayload) =>
    httpClient.post<TaskShare>(`tasks/${taskId}/shares/`, payload),
  update: (taskId: number, shareId: number, permission: SharePermission) =>
    httpClient.patch<TaskShare>(`tasks/${taskId}/shares/${shareId}/`, {
      permission,
    } satisfies UpdateSharePayload),
  remove: (taskId: number, shareId: number) =>
    httpClient.delete<void>(`tasks/${taskId}/shares/${shareId}/`),
}
