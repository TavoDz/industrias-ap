import { useEffect, useState } from 'react'
import { usuariosService } from '../../services'

const formInicial = { nombre: '', email: '', passwordHash: '', rol: 'vendedor' }

const rolColor = {
  admin:    'bg-purple-100 text-purple-700',
  vendedor: 'bg-emerald-100 text-emerald-700',
  bodega:   'bg-green-100 text-green-700'
}

export default function Usuarios() {
  const [usuarios, setUsuarios]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarPass, setMostrarPass] = useState(null)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)
  const [nuevaPass, setNuevaPass]     = useState('')

  const cargar = async () => {
    try {
      const res = await usuariosService.obtenerTodos()
      setUsuarios(res.data)
      setError('')
    } catch (e) {
      setError('Error al cargar usuarios: ' + (e.response?.status || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(formInicial)
    setMostrarForm(true)
  }

  const abrirEditar = (u) => {
    setEditando(u.id)
    setForm({ nombre: u.nombre, email: u.email, passwordHash: '', rol: u.rol || 'vendedor' })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) {
        await usuariosService.actualizar(editando, { nombre: form.nombre, email: form.email, rol: form.rol })
      } else {
        await usuariosService.crear(form)
      }
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data || e.message))
    }
  }

  const cambiarPassword = async (id) => {
    if (!nuevaPass.trim()) return
    try {
      await usuariosService.cambiarPassword(id, { nuevaPassword: nuevaPass })
      setMostrarPass(null)
      setNuevaPass('')
      alert('Contraseña actualizada correctamente')
    } catch {
      setError('Error al cambiar contraseña')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('Eliminar este usuario?')) return
    try {
      await usuariosService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Usuarios</h2>
          <p className="text-sm text-gray-500 mt-0.5">Solo visible para administradores</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded hover:bg-emerald-700 transition"
        >
          + Nuevo usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">
            {editando ? 'Editar usuario' : 'Nuevo usuario'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            {!editando && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={form.passwordHash}
                  onChange={e => setForm({ ...form, passwordHash: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={!editando}
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Rol *</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="admin">admin</option>
                <option value="vendedor">vendedor</option>
                <option value="bodega">bodega</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {mostrarPass && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">Cambiar contraseña</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={nuevaPass}
                onChange={e => setNuevaPass(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => cambiarPassword(mostrarPass)}
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Guardar
            </button>
            <button
              onClick={() => { setMostrarPass(null); setNuevaPass('') }}
              className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">
                    Sin usuarios registrados
                  </td>
                </tr>
              ) : usuarios.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${rolColor[u.rol] || 'bg-gray-100 text-gray-600'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${u.estado === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {u.estado === 1 ? 'activo' : 'inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button
                      onClick={() => abrirEditar(u)}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => { setMostrarPass(u.id); setNuevaPass('') }}
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      Contraseña
                    </button>
                    <button
                      onClick={() => eliminar(u.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Eliminar
                    </button>
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
