const ACCESS_TOKEN_KEY = 'taskboard.accessToken'
const REFRESH_TOKEN_KEY = 'taskboard.refreshToken'

export const tokenStorage = {
  getAccessToken: () => sessionStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken?: string) => {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken)

    if (refreshToken) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  },
  clear: () => {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY)
    sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}
