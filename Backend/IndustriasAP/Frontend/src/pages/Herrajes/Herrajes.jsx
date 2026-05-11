import { useEffect, useState } from 'react'
import { herrajesService } from '../../services'

const formInicial = { nombre: '', marca: '', precioUnitario: '' }

export default function Herrajes() {
  const [herrajes, setHerrajes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const res = await herrajesService.obtenerTodos()
      setHerrajes(res.data)
    } catch {
      setError('Error al cargar herrajes')
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

  const abrirEditar = (h) => {
    setEditando(h.id)
    setForm({ nombre: h.nombre, marca: h.marca || '', precioUnitario: h.precioUnitario })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = { ...form, precioUnitario: parseFloat(form.precioUnitario) }
      if (editando) await herrajesService.actualizar(editando, datos)
      else          await herrajesService.crear(datos)
      setMostrarForm(false)
      cargar()
    } catch {
      setError('Error al guardar herraje')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este herraje?')) return
    try {
      await herrajesService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar herraje')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Herrajes</h2>
        <button onClick={abrirNuevo} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition">
          + Nuevo herraje
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editando ? 'Editar herraje' : 'Nuevo herraje'}</h3>
          <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Marca</label>
              <input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Precio unitario (Q)</label>
              <input type="number" step="0.01" value={form.precioUnitario} onChange={e => setForm({...form, precioUnitario: e.target.value})}
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
                {['Nombre', 'Marca', 'Precio unitario', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {herrajes.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">Sin herrajes registrados</td></tr>
              ) : herrajes.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{h.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{h.marca || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">Q{Number(h.precioUnitario).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(h)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(h.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
