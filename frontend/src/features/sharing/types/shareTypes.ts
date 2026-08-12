export const SHARE_PERMISSIONS = ['read', 'edit'] as const

export type SharePermission = (typeof SHARE_PERMISSIONS)[number]

export const SHARE_PERMISSION_OPTIONS = [
  { value: 'read', label: 'Leitura' },
  { value: 'edit', label: 'Edição' },
] as const satisfies ReadonlyArray<{
  value: SharePermission
  label: string
}>

export type TaskShare = {
  id: number
  task: number
  user_email: string
  permission: SharePermission
  created_at: string
}

export type CreateSharePayload = {
  user_email: string
  permission: SharePermission
}

export type UpdateSharePayload = {
  permission: SharePermission
}
