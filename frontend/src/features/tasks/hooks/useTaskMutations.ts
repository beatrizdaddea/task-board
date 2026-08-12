import { useMutation, useQueryClient } from '@tanstack/react-query'

import { tasksService } from '@/features/tasks/api/tasksService'
import { taskKeys } from '@/features/tasks/hooks/useTasks'
import type { TaskFormInput } from '@/features/tasks/schemas/taskSchemas'
import type { Task } from '@/features/tasks/types/taskTypes'

export function useTaskMutations() {
  const queryClient = useQueryClient()
  const refreshTasks = () =>
    queryClient.invalidateQueries({ queryKey: taskKeys.all })

  const createTask = useMutation({
    mutationFn: tasksService.create,
    onSuccess: refreshTasks,
  })
  const updateTask = useMutation({
    mutationFn: ({ task, values }: { task: Task; values: TaskFormInput }) =>
      tasksService.update(task, values),
    onSuccess: refreshTasks,
  })
  const deleteTask = useMutation({
    mutationFn: tasksService.remove,
    onSuccess: refreshTasks,
  })
  const changeStatus = useMutation({
    mutationFn: ({
      taskId,
      completed,
    }: {
      taskId: number
      completed: boolean
    }) => tasksService.setCompleted(taskId, completed),
    onSuccess: refreshTasks,
  })

  return { createTask, updateTask, deleteTask, changeStatus }
}
