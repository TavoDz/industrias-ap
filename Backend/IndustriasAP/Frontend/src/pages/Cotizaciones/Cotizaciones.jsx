import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cotizacionesService, clientesService } from '../../services'

const estadoColor = {
  pendiente:  'bg-yellow-100 text-yellow-700',
  aprobada:   'bg-green-100 text-green-700',
  rechazada:  'bg-red-100 text-red-600',
  cancelada:  'bg-gray-100 text-gray-500',
}

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [clientes, setClientes]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [form, setForm]                 = useState({ clienteId: '', usuarioId: 1 })
  const navigate = useNavigate()

  const cargar = async () => {
    try {
      const [resCot, resCli] = await Promise.all([
        cotizacionesService.obtenerTodos(),
        clientesService.obtenerTodos()
      ])
      setCotizaciones(resCot.data)
      setClientes(resCli.data)
    } catch {
      setError('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    try {
      const res = await cotizacionesService.crear({
        clienteId: parseInt(form.clienteId),
        usuarioId: parseInt(form.usuarioId),
        totalMateriales: 0, totalHerrajes: 0, totalServicios: 0, total: 0,
        estado: 'pendiente'
      })
      setMostrarForm(false)
      navigate(`/cotizaciones/${res.data.id}`)
    } catch {
      setError('Error al crear cotización')
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await cotizacionesService.actualizarEstado(id, estado)
      cargar()
    } catch {
      setError('Error al actualizar estado')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Cotizaciones</h2>
        <button onClick={() => setMostrarForm(true)} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition">
          + Nueva cotización
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">Nueva cotización</h3>
          <form onSubmit={crear} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Cliente *</label>
              <select value={form.clienteId} onChange={e => setForm({...form, clienteId: e.target.value})}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button type="button" onClick={() => setMostrarForm(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit"
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Crear y editar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cotizaciones.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Sin cotizaciones registradas</td></tr>
              ) : cotizaciones.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{c.clienteId}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(c.fecha).toLocaleDateString('es-GT')}</td>
                  <td className="px-4 py-3 text-gray-800 font-medium">Q{Number(c.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <select value={c.estado}
                      onChange={e => cambiarEstado(c.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border-0 font-medium cursor-pointer ${estadoColor[c.estado] || 'bg-gray-100'}`}>
                      <option value="pendiente">pendiente</option>
                      <option value="aprobada">aprobada</option>
                      <option value="rechazada">rechazada</option>
                      <option value="cancelada">cancelada</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => navigate(`/cotizaciones/${c.id}`)}
                      className="text-xs text-blue-600 hover:underline">Ver / Editar</button>
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
