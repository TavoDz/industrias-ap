import { useEffect, useState } from 'react'
import { serviciosService } from '../../services'

const formInicial = { nombre: '', proveedor: '', costo: '' }

export default function Servicios() {
  const [servicios, setServicios]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const res = await serviciosService.obtenerTodos()
      setServicios(res.data)
    } catch {
      setError('Error al cargar servicios')
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

  const abrirEditar = (s) => {
    setEditando(s.id)
    setForm({ nombre: s.nombre, proveedor: s.proveedor || '', costo: s.costo })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = { ...form, costo: parseFloat(form.costo) }
      if (editando) await serviciosService.actualizar(editando, datos)
      else          await serviciosService.crear(datos)
      setMostrarForm(false)
      cargar()
    } catch {
      setError('Error al guardar servicio')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      await serviciosService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar servicio')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Servicios Externos</h2>
        <button onClick={abrirNuevo} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition">
          + Nuevo servicio
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editando ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Proveedor</label>
              <input value={form.proveedor} onChange={e => setForm({...form, proveedor: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Costo (Q)</label>
              <input type="number" step="0.01" value={form.costo} onChange={e => setForm({...form, costo: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit"
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Proveedor', 'Costo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicios.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin servicios registrados</td></tr>
              ) : servicios.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{s.proveedor || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">Q{Number(s.costo).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(s)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(s.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
