import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginApi, studentLogin as studentLoginApi, logout as logoutApi } from '../api/authApi'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      sessionToken: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (account, password) => {
        set({ loading: true, error: null })
        try {
          const data = await loginApi(account, password)
          set({
            user: data.user,
            sessionToken: data.sessionToken || null,
            isAuthenticated: true,
            loading: false,
          })
          return data
        } catch (error) {
          set({ loading: false, error: error.message })
          throw error
        }
      },

      studentLogin: async (studentNo, phone, name) => {
        set({ loading: true, error: null })
        try {
          const data = await studentLoginApi(studentNo, phone, name)
          set({
            user: data.user,
            sessionToken: data.sessionToken || null,
            isAuthenticated: true,
            loading: false,
          })
          return data
        } catch (error) {
          set({ loading: false, error: error.message })
          throw error
        }
      },

      logout: async () => {
        try {
          await logoutApi()
        } finally {
          set({ user: null, sessionToken: null, isAuthenticated: false, error: null })
        }
      },

      clearAuth: () => set({ user: null, sessionToken: null, isAuthenticated: false, error: null }),
    }),
    {
      name: 'lab-auth-storage',
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
