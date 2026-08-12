import { useEffect, useState } from 'react'

import type {
  TaskFilters,
  TaskPriority,
} from '@/features/tasks/types/taskTypes'

export type StatusFilter = 'all' | 'open' | 'completed'

export function useTaskFilters() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState('all')
  const [priority, setPriority] = useState<'all' | TaskPriority>('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const filters: TaskFilters = {
    page,
    search: search || undefined,
    completed: status === 'all' ? undefined : status === 'completed',
    category: category === 'all' ? undefined : Number(category),
    priority: priority === 'all' ? undefined : priority,
  }

  return {
    filters,
    searchInput,
    status,
    category,
    priority,
    page,
    setSearchInput,
    setStatus: (value: StatusFilter) => {
      setStatus(value)
      setPage(1)
    },
    setCategory: (value: string) => {
      setCategory(value)
      setPage(1)
    },
    setPriority: (value: 'all' | TaskPriority) => {
      setPriority(value)
      setPage(1)
    },
    setPage,
  }
}
