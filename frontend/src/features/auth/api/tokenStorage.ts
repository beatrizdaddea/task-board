const ACCESS_TOKEN_KEY = 'taskboard.accessToken'
const listeners = new Set<() => void>()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  setAccessToken: (accessToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    notifyListeners()
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    notifyListeners()
  },
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export const authStorageKey = ACCESS_TOKEN_KEY
