import { ApiError } from '@/shared/lib/http/ApiError'

export function getCategoryDeleteErrorMessage(error: unknown) {
  if (error instanceof ApiError && [400, 409].includes(error.status)) {
    return 'Não é possível excluir: esta categoria está em uso por uma ou mais tarefas.'
  }

  return error instanceof Error
    ? error.message
    : 'Não foi possível excluir a categoria.'
}
