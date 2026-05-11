import { useEffect, useState } from 'react'
import { materialesService } from '../../services'

const formInicial = { nombre: '', tipo: '', grosor: '', largo: '', ancho: '', precioTablero: '' }

export default function Materiales() {
  const [materiales, setMateriales] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const res = await materialesService.obtenerTodos()
      setMateriales(res.data)
      setError('')
    } catch (e) {
      setError('Error al cargar materiales: ' + (e.response?.status || e.message))
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

  const abrirEditar = (m) => {
    setEditando(m.id)
    setForm({
      nombre: m.nombre,
      tipo: m.tipo || '',
      grosor: m.grosor,
      largo: m.largo,
      ancho: m.ancho,
      precioTablero: m.precioTablero
    })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        ...form,
        grosor:        parseFloat(form.grosor),
        largo:         parseFloat(form.largo),
        ancho:         parseFloat(form.ancho),
        precioTablero: parseFloat(form.precioTablero)
      }
      if (editando) await materialesService.actualizar(editando, datos)
      else          await materialesService.crear(datos)
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data || e.message))
    }
  }

  const eliminar = async (id) => {
    if (!confirm('Eliminar este material?')) return
    try {
      await materialesService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Materiales</h2>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Nuevo material
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">
            {editando ? 'Editar material' : 'Nuevo material'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <input
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                placeholder="melamina, MDF, plywood..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Grosor (mm)</label>
              <input
                type="number"
                value={form.grosor}
                onChange={e => setForm({ ...form, grosor: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Largo (mm)</label>
              <input
                type="number"
                value={form.largo}
                onChange={e => setForm({ ...form, largo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ancho (mm)</label>
              <input
                type="number"
                value={form.ancho}
                onChange={e => setForm({ ...form, ancho: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Precio tablero (Q)</label>
              <input
                type="number"
                step="0.01"
                value={form.precioTablero}
                onChange={e => setForm({ ...form, precioTablero: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Tipo', 'Grosor', 'Largo', 'Ancho', 'Precio tablero', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materiales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    Sin materiales registrados
                  </td>
                </tr>
              ) : materiales.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{m.tipo || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{m.grosor} mm</td>
                  <td className="px-4 py-3 text-gray-600">{m.largo} mm</td>
                  <td className="px-4 py-3 text-gray-600">{m.ancho} mm</td>
                  <td className="px-4 py-3 text-gray-600">Q{Number(m.precioTablero).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(m)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(m.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
