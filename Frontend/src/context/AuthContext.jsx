import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const AuthContext = createContext(null)

const INACTIVITY_LIMIT = 60 * 60 * 1000 // 1 hora

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = sessionStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  })
  const timerRef = useRef(null)

  const doLogout = useCallback(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('usuario')
    setUsuario(null)
  }, [])

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(doLogout, INACTIVITY_LIMIT)
  }, [doLogout])

  useEffect(() => {
    if (!usuario) return
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach(ev => window.addEventListener(ev, resetTimer, true))
    resetTimer()
    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetTimer, true))
      clearTimeout(timerRef.current)
    }
  }, [usuario, resetTimer])

  const login = (datos) => {
    sessionStorage.setItem('token',   datos.token)
    sessionStorage.setItem('usuario', JSON.stringify(datos))
    setUsuario(datos)
  }

  const logout = () => {
    doLogout()
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
