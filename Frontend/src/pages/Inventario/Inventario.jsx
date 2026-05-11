import { useEffect, useState } from 'react'
import { inventarioService, materialesService, herrajesService } from '../../services'

const formInicial = { tipoItem: 'material', itemId: '', cantidad: '', minimo: '' }

export default function Inventario() {
  const [inventario, setInventario] = useState([])
  const [materiales, setMateriales] = useState([])
  const [herrajes,   setHerrajes]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        inventarioService.obtenerTodos(),
        materialesService.obtenerTodos(),
        herrajesService.obtenerTodos()
      ])
      setInventario(r1.data)
      setMateriales(r2.data)
      setHerrajes(r3.data)
      setError('')
    } catch (e) {
      setError('Error al cargar inventario: ' + (e.response?.status || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const getNombre = (tipoItem, itemId) => {
    if (tipoItem === 'material') {
      return materiales.find(m => m.id === itemId)?.nombre || 'Material #' + itemId
    }
    return herrajes.find(h => h.id === itemId)?.nombre || 'Herraje #' + itemId
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm(formInicial)
    setMostrarForm(true)
  }

  const abrirEditar = (item) => {
    setEditando(item.id)
    setForm({
      tipoItem: item.tipoItem,
      itemId:   item.itemId,
      cantidad: item.cantidad,
      minimo:   item.minimo
    })
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        ...form,
        itemId:   parseInt(form.itemId),
        cantidad: parseFloat(form.cantidad),
        minimo:   parseFloat(form.minimo)
      }
      if (editando) await inventarioService.actualizar(editando, datos)
      else          await inventarioService.crear(datos)
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data || e.message))
    }
  }

  const eliminar = async (id) => {
    if (!confirm('Eliminar este registro?')) return
    try {
      await inventarioService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  const itemsBajoMinimo = inventario.filter(i => i.cantidad <= i.minimo)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Inventario</h2>
          <p className="text-sm text-gray-500 mt-0.5">Control de stock de materiales y herrajes</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Agregar registro
        </button>
      </div>

      {itemsBajoMinimo.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            Alerta de stock bajo ({itemsBajoMinimo.length} item{itemsBajoMinimo.length > 1 ? 's' : ''})
          </p>
          <div className="flex flex-wrap gap-2">
            {itemsBajoMinimo.map(i => (
              <span key={i.id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                {getNombre(i.tipoItem, i.itemId)} — {i.cantidad} restantes
              </span>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">
            {editando ? 'Editar registro' : 'Nuevo registro'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <select
                value={form.tipoItem}
                onChange={e => setForm({ ...form, tipoItem: e.target.value, itemId: '' })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="material">Material</option>
                <option value="herraje">Herraje</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Item *</label>
              <select
                value={form.itemId}
                onChange={e => setForm({ ...form, itemId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Seleccionar...</option>
                {form.tipoItem === 'material'
                  ? materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)
                  : herrajes.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)
                }
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cantidad *</label>
              <input
                type="number"
                step="0.01"
                value={form.cantidad}
                onChange={e => setForm({ ...form, cantidad: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Minimo de alerta</label>
              <input
                type="number"
                step="0.01"
                value={form.minimo}
                onChange={e => setForm({ ...form, minimo: e.target.value })}
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
                {['Tipo', 'Item', 'Cantidad', 'Minimo', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventario.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Sin registros de inventario
                  </td>
                </tr>
              ) : inventario.map(item => {
                const bajo = item.cantidad <= item.minimo
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 ${bajo ? 'bg-yellow-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        item.tipoItem === 'material'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.tipoItem}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {getNombre(item.tipoItem, item.itemId)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{item.cantidad}</td>
                    <td className="px-4 py-3 text-gray-500">{item.minimo}</td>
                    <td className="px-4 py-3">
                      {bajo ? (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 flex gap-2 justify-end">
                      <button onClick={() => abrirEditar(item)} className="text-xs text-blue-600 hover:underline">Editar</button>
                      <button onClick={() => eliminar(item.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
