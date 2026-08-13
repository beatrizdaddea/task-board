export function getCategoryDeleteErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível excluir a categoria.'
}
