# Crear estructura de carpetas
New-Item -ItemType Directory -Force -Path "src"
New-Item -ItemType Directory -Force -Path "src\context"
New-Item -ItemType Directory -Force -Path "src\services"
New-Item -ItemType Directory -Force -Path "src\components\layout"
New-Item -ItemType Directory -Force -Path "src\components\common"
New-Item -ItemType Directory -Force -Path "src\pages\Login"
New-Item -ItemType Directory -Force -Path "src\pages\Clientes"
New-Item -ItemType Directory -Force -Path "src\pages\Materiales"
New-Item -ItemType Directory -Force -Path "src\pages\Herrajes"
New-Item -ItemType Directory -Force -Path "src\pages\Servicios"
New-Item -ItemType Directory -Force -Path "src\pages\Cotizaciones"

# ── index.css ─────────────────────────────────────────────
@"
@tailwind base;
@tailwind components;
@tailwind utilities;
"@ | Set-Content "src\index.css"

# ── main.jsx ──────────────────────────────────────────────
@"
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
"@ | Set-Content "src\main.jsx"

# ── AuthContext.jsx ───────────────────────────────────────
@"
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  })

  const login = (datos) => {
    localStorage.setItem('token',   datos.token)
    localStorage.setItem('usuario', JSON.stringify(datos))
    setUsuario(datos)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
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
"@ | Set-Content "src\context\AuthContext.jsx"

# ── api.js ────────────────────────────────────────────────
@"
import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer `+token
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
"@ | Set-Content "src\services\api.js"

# ── services/index.js ─────────────────────────────────────
@"
import api from './api'

export const clientesService = {
  obtenerTodos:  ()            => api.get('/Clientes'),
  obtenerPorId:  (id)          => api.get(`/Clientes/`+id),
  crear:         (datos)       => api.post('/Clientes', datos),
  actualizar:    (id, datos)   => api.put(`/Clientes/`+id, datos),
  eliminar:      (id)          => api.delete(`/Clientes/`+id)
}

export const materialesService = {
  obtenerTodos:  ()            => api.get('/Materiales'),
  obtenerPorId:  (id)          => api.get(`/Materiales/`+id),
  crear:         (datos)       => api.post('/Materiales', datos),
  actualizar:    (id, datos)   => api.put(`/Materiales/`+id, datos),
  eliminar:      (id)          => api.delete(`/Materiales/`+id)
}

export const herrajesService = {
  obtenerTodos:  ()            => api.get('/Herrajes'),
  obtenerPorId:  (id)          => api.get(`/Herrajes/`+id),
  crear:         (datos)       => api.post('/Herrajes', datos),
  actualizar:    (id, datos)   => api.put(`/Herrajes/`+id, datos),
  eliminar:      (id)          => api.delete(`/Herrajes/`+id)
}

export const serviciosService = {
  obtenerTodos:  ()            => api.get('/ServiciosExternos'),
  obtenerPorId:  (id)          => api.get(`/ServiciosExternos/`+id),
  crear:         (datos)       => api.post('/ServiciosExternos', datos),
  actualizar:    (id, datos)   => api.put(`/ServiciosExternos/`+id, datos),
  eliminar:      (id)          => api.delete(`/ServiciosExternos/`+id)
}

export const tapacantosService = {
  obtenerTodos:  ()            => api.get('/Tapacantos'),
  crear:         (datos)       => api.post('/Tapacantos', datos),
  actualizar:    (id, datos)   => api.put(`/Tapacantos/`+id, datos),
  eliminar:      (id)          => api.delete(`/Tapacantos/`+id)
}

export const inventarioService = {
  obtenerTodos:  ()            => api.get('/Inventario'),
  crear:         (datos)       => api.post('/Inventario', datos),
  actualizar:    (id, datos)   => api.put(`/Inventario/`+id, datos),
  eliminar:      (id)          => api.delete(`/Inventario/`+id)
}

export const cotizacionesService = {
  obtenerTodos:      ()           => api.get('/Cotizaciones'),
  obtenerPorId:      (id)         => api.get(`/Cotizaciones/`+id),
  obtenerPorCliente: (clienteId)  => api.get(`/Cotizaciones/cliente/`+clienteId),
  obtenerCompleta:   (id)         => api.get(`/CotizacionCompleta/`+id),
  crear:             (datos)      => api.post('/Cotizaciones', datos),
  actualizarEstado:  (id, estado) => api.put(`/Cotizaciones/`+id+`/estado`, JSON.stringify(estado), { headers: { 'Content-Type': 'application/json' }}),
  recalcular:        (id)         => api.put(`/Cotizaciones/`+id+`/recalcular`),
  eliminar:          (id)         => api.delete(`/Cotizaciones/`+id)
}

export const piezasService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/PiezasCorte/cotizacion/`+cotizacionId),
  crear:                (datos)        => api.post('/PiezasCorte', datos),
  actualizar:           (id, datos)    => api.put(`/PiezasCorte/`+id, datos),
  eliminar:             (id)           => api.delete(`/PiezasCorte/`+id)
}

export const detalleHerrajesService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/DetalleHerrajes/cotizacion/`+cotizacionId),
  crear:                (datos)        => api.post('/DetalleHerrajes', datos),
  actualizar:           (id, datos)    => api.put(`/DetalleHerrajes/`+id, datos),
  eliminar:             (id)           => api.delete(`/DetalleHerrajes/`+id)
}

export const detalleServiciosService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/DetalleServicios/cotizacion/`+cotizacionId),
  crear:                (datos)        => api.post('/DetalleServicios', datos),
  actualizar:           (id, datos)    => api.put(`/DetalleServicios/`+id, datos),
  eliminar:             (id)           => api.delete(`/DetalleServicios/`+id)
}

export const usuariosService = {
  obtenerTodos:    ()            => api.get('/Usuarios'),
  obtenerPorId:    (id)          => api.get(`/Usuarios/`+id),
  crear:           (datos)       => api.post('/Usuarios', datos),
  actualizar:      (id, datos)   => api.put(`/Usuarios/`+id, datos),
  cambiarPassword: (id, datos)   => api.put(`/Usuarios/`+id+`/password`, datos),
  eliminar:        (id)          => api.delete(`/Usuarios/`+id)
}

export const authService = {
  login: (datos) => api.post('/Auth/login', datos)
}
"@ | Set-Content "src\services\index.js"

# ── Layout.jsx ────────────────────────────────────────────
@"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menu = [
  { path: '/dashboard',    label: 'Dashboard' },
  { path: '/clientes',     label: 'Clientes' },
  { path: '/cotizaciones', label: 'Cotizaciones' },
  { path: '/materiales',   label: 'Materiales' },
  { path: '/herrajes',     label: 'Herrajes' },
  { path: '/servicios',    label: 'Servicios' },
  { path: '/inventario',   label: 'Inventario' },
  { path: '/usuarios',     label: 'Usuarios', rol: 'admin' },
]

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const location            = useLocation()
  const navigate            = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuFiltrado = menu.filter(item => !item.rol || item.rol === usuario?.rol)

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="font-bold text-base">Insutrias AP</h1>
          <p className="text-xs text-gray-400 mt-1">{usuario?.nombre}</p>
          <span className="text-xs bg-blue-700 px-2 py-0.5 rounded mt-1 inline-block">{usuario?.rol}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuFiltrado.map(item => (
            <Link key={item.path} to={item.path}
              className={`block px-3 py-2 rounded text-sm transition `+(location.pathname.startsWith(item.path) ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700')}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <button onClick={handleLogout}
            className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded hover:bg-gray-700 transition">
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
"@ | Set-Content "src\components\layout\Layout.jsx"

# ── PrivateRoute.jsx ──────────────────────────────────────
@"
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../layout/Layout'

export default function PrivateRoute({ children, rol }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (rol && usuario.rol !== rol) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}
"@ | Set-Content "src\components\common\PrivateRoute.jsx"

# ── Login.jsx ─────────────────────────────────────────────
@"
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Insutrias AP</h1>
        <p className="text-gray-500 text-sm mb-6">Sistema de Carpinteria</p>
        {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contrasena</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
"@ | Set-Content "src\pages\Login\Login.jsx"

# ── Dashboard.jsx ─────────────────────────────────────────
@"
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { usuario } = useAuth()
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Bienvenido, {usuario?.nombre}</h2>
      <p className="text-gray-500 text-sm mb-6">Panel de control</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clientes',     link: '/clientes' },
          { label: 'Cotizaciones', link: '/cotizaciones' },
          { label: 'Materiales',   link: '/materiales' },
          { label: 'Inventario',   link: '/inventario' },
        ].map(card => (
          <a key={card.label} href={card.link}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition text-center">
            <p className="text-sm font-medium text-gray-700">{card.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
"@ | Set-Content "src\pages\Dashboard.jsx"

# ── Clientes.jsx ──────────────────────────────────────────
@"
import { useEffect, useState } from 'react'
import { clientesService } from '../../services'

const formInicial = { nombre: '', telefono: '', email: '', direccion: '' }

export default function Clientes() {
  const [clientes, setClientes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const res = await clientesService.obtenerTodos()
      setClientes(res.data)
    } catch { setError('Error al cargar clientes') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setEditando(null); setForm(formInicial); setMostrarForm(true) }
  const abrirEditar = (c) => { setEditando(c.id); setForm({ nombre: c.nombre, telefono: c.telefono||'', email: c.email||'', direccion: c.direccion||'' }); setMostrarForm(true) }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await clientesService.actualizar(editando, form)
      else          await clientesService.crear(form)
      setMostrarForm(false); cargar()
    } catch { setError('Error al guardar cliente') }
  }

  const eliminar = async (id) => {
    if (!confirm('Eliminar este cliente?')) return
    try { await clientesService.eliminar(id); cargar() }
    catch { setError('Error al eliminar') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Clientes</h2>
        <button onClick={abrirNuevo} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">+ Nuevo cliente</button>
      </div>
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}
      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            {[['Nombre','nombre',true],['Telefono','telefono'],['Email','email'],['Direccion','direccion']].map(([label,key,req]) => (
              <div key={key}>
                <label className="block text-sm text-gray-600 mb-1">{label}{req?' *':''}</label>
                <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required={!!req} />
              </div>
            ))}
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setMostrarForm(false)} className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Nombre','Telefono','Email','Direccion',''].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.length===0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin clientes</td></tr>
              : clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono||'—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email||'—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.direccion||'—'}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(c.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
"@ | Set-Content "src\pages\Clientes\Clientes.jsx"

# ── App.jsx ───────────────────────────────────────────────
@"
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute      from './components/common/PrivateRoute'
import Login             from './pages/Login/Login'
import Dashboard         from './pages/Dashboard'
import Clientes          from './pages/Clientes/Clientes'

const Placeholder = ({ titulo }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-2">{titulo}</h2>
    <p className="text-gray-500 text-sm">En construccion.</p>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/clientes"   element={<PrivateRoute><Clientes /></PrivateRoute>} />
          <Route path="/materiales" element={<PrivateRoute><Placeholder titulo="Materiales" /></PrivateRoute>} />
          <Route path="/herrajes"   element={<PrivateRoute><Placeholder titulo="Herrajes" /></PrivateRoute>} />
          <Route path="/servicios"  element={<PrivateRoute><Placeholder titulo="Servicios" /></PrivateRoute>} />
          <Route path="/inventario" element={<PrivateRoute><Placeholder titulo="Inventario" /></PrivateRoute>} />
          <Route path="/cotizaciones"     element={<PrivateRoute><Placeholder titulo="Cotizaciones" /></PrivateRoute>} />
          <Route path="/cotizaciones/:id" element={<PrivateRoute><Placeholder titulo="Detalle Cotizacion" /></PrivateRoute>} />
          <Route path="/usuarios"   element={<PrivateRoute rol="admin"><Placeholder titulo="Usuarios" /></PrivateRoute>} />
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
"@ | Set-Content "src\App.jsx"

Write-Host ""
Write-Host "✓ Proyecto creado exitosamente" -ForegroundColor Green
Write-Host "✓ Ejecuta: npm run dev" -ForegroundColor Green
