import { useAuthStore } from '../authStore'
import type { Session } from '@supabase/supabase-js'

const mockSession = {
  user: { id: 'user-123', email: 'test@test.com' },
  access_token: 'token',
} as unknown as Session

beforeEach(() => {
  useAuthStore.setState({ session: null, user: null, loading: true })
})

describe('authStore', () => {
  it('initializes with loading=true and no session', () => {
    const { session, loading } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(loading).toBe(true)
  })

  it('setSession stores session and user, clears loading', () => {
    useAuthStore.getState().setSession(mockSession)
    const { session, user, loading } = useAuthStore.getState()
    expect(session).toBe(mockSession)
    expect(user?.id).toBe('user-123')
    expect(loading).toBe(false)
  })

  it('setSession(null) clears session and user', () => {
    useAuthStore.getState().setSession(mockSession)
    useAuthStore.getState().setSession(null)
    const { session, user } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(user).toBeNull()
  })
})
