import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services'

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuth()
  const navigate              = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(form)
      login(res.data)
      navigate('/dashboard')
    } catch {
      setError('Email o contrasena incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-none">Industrias AP</h1>
            <p className="text-white/40 text-xs mt-0.5">Sistema de Carpintería</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-8">
          <h2 className="text-white font-semibold text-xl mb-1">Bienvenido</h2>
          <p className="text-white/40 text-sm mb-7">Ingresa tus credenciales para continuar</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded-lg mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                placeholder="correo@empresa.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-white/[0.05] border border-white/10 text-white rounded-lg px-3 py-2.5 text-sm placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 transition mt-2">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
