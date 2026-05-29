import { useEffect, useState } from 'react'
import { clientesService } from '../../services'

const formInicial = { nombre: '', telefono: '', email: '', direccion: '' }

export default function Clientes() {
  const [clientes,    setClientes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [form,        setForm]        = useState(formInicial)
  const [buscar,      setBuscar]      = useState('')

  const cargar = async () => {
    try {
      const res = await clientesService.obtenerTodos()
      setClientes(res.data)
    } catch (e) {
      setError('Error al cargar clientes: ' + (e.response?.status || e.message))
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

  const abrirEditar = (c) => {
    setEditando(c.id)
    setForm({
      nombre:    c.nombre,
      telefono:  c.telefono  || '',
      email:     c.email     || '',
      direccion: c.direccion || '',
    })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await clientesService.actualizar(editando, form)
      else          await clientesService.crear(form)
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setError('Error al guardar cliente: ' + (e.response?.data || e.message))
    }
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar a "${nombre}"?`)) return
    try {
      await clientesService.eliminar(id)
      cargar()
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data || e.message))
    }
  }

  const filtrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (c.telefono || '').toLowerCase().includes(buscar.toLowerCase()) ||
    (c.email    || '').toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Clientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">{clientes.length} registrados</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Nuevo cliente
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {editando ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nombre *',   key: 'nombre',    req: true,  type: 'text' },
              { label: 'Teléfono',   key: 'telefono',  req: false, type: 'text' },
              { label: 'Email',      key: 'email',     req: false, type: 'email' },
              { label: 'Dirección',  key: 'direccion', req: false, type: 'text' },
            ].map(({ label, key, req, type }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={req}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="submit"
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                {editando ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador */}
      <div className="mb-4 flex items-center gap-3">
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {buscar && (
          <span className="text-xs text-gray-400">
            {filtrados.length} de {clientes.length} clientes
          </span>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Cargando...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Teléfono', 'Email', 'Dirección', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    {buscar ? (
                      <p className="text-gray-400 text-sm">Sin resultados para "{buscar}"</p>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">No hay clientes registrados</p>
                        <button onClick={abrirNuevo}
                          className="text-sm text-emerald-600 hover:underline font-medium">
                          Agregar primer cliente →
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : filtrados.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email    || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.direccion|| '—'}</td>
                  <td className="px-4 py-3 flex gap-3 justify-end">
                    <button onClick={() => abrirEditar(c)}
                      className="text-xs text-emerald-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(c.id, c.nombre)}
                      className="text-xs text-red-500 hover:underline">Eliminar</button>
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
