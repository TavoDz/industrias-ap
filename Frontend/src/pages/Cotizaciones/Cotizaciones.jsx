import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cotizacionesService, clientesService } from '../../services'

const estadoColor = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobada:  'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-600',
  cancelada: 'bg-gray-100 text-gray-500',
}

export default function Cotizaciones() {
  const [data,     setData]     = useState([])
  const [clientes, setClientes] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [show,     setShow]     = useState(false)
  const [form,     setForm]     = useState({ clienteId: '', usuarioId: 1 })
  const navigate = useNavigate()

  // Filtros
  const [filtroEstado,  setFiltroEstado]  = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroDesde,   setFiltroDesde]   = useState('')
  const [filtroHasta,   setFiltroHasta]   = useState('')

  const cargar = async () => {
    try {
      const [r1, r2] = await Promise.all([
        cotizacionesService.obtenerTodos(),
        clientesService.obtenerTodos(),
      ])
      setData(r1.data)
      setClientes(r2.data)
    } catch {
      setError('Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const crear = async (e) => {
    e.preventDefault()
    try {
      const r = await cotizacionesService.crear({
        clienteId: parseInt(form.clienteId),
        usuarioId: 1,
        totalMateriales: 0, totalHerrajes: 0, totalServicios: 0, total: 0,
        estado: 'pendiente',
      })
      setShow(false)
      navigate('/cotizaciones/' + r.data.id)
    } catch {
      setError('Error al crear')
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await cotizacionesService.actualizarEstado(id, estado)
      cargar()
    } catch {
      setError('Error al cambiar estado')
    }
  }

  const nombreCliente = (clienteId) =>
    clientes.find(c => c.id === clienteId)?.nombre || `#${clienteId}`

  // Aplicar filtros
  const filtradas = data.filter(c => {
    if (filtroEstado && c.estado !== filtroEstado) return false
    if (filtroCliente) {
      const nombre = nombreCliente(c.clienteId).toLowerCase()
      if (!nombre.includes(filtroCliente.toLowerCase())) return false
    }
    if (filtroDesde && new Date(c.fecha) < new Date(filtroDesde)) return false
    if (filtroHasta && new Date(c.fecha) > new Date(filtroHasta + 'T23:59:59')) return false
    return true
  })

  const limpiarFiltros = () => {
    setFiltroEstado(''); setFiltroCliente(''); setFiltroDesde(''); setFiltroHasta('')
  }
  const hayFiltros = filtroEstado || filtroCliente || filtroDesde || filtroHasta

  // Resumen rápido
  const totales = {
    pendiente: data.filter(c => c.estado === 'pendiente').length,
    aprobada:  data.filter(c => c.estado === 'aprobada').length,
    monto:     data.filter(c => c.estado === 'aprobada').reduce((s, c) => s + Number(c.total), 0),
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Cotizaciones</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} en total</p>
        </div>
        <button onClick={() => setShow(true)}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Nueva
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pendientes',          value: totales.pendiente, color: 'text-amber-600' },
          { label: 'Aprobadas',           value: totales.aprobada,  color: 'text-green-600' },
          { label: 'Monto aprobado',      value: `Q${totales.monto.toFixed(2)}`, color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {/* Formulario nueva cotización */}
      {show && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Nueva cotización</h3>
          <form onSubmit={crear} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
              <select value={form.clienteId}
                onChange={e => setForm({ ...form, clienteId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit"
              className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              Crear
            </button>
            <button type="button" onClick={() => setShow(false)}
              className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobada">Aprobada</option>
            <option value="rechazada">Rechazada</option>
            <option value="cancelada">Cancelada</option>
          </select>

          <input value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}
            placeholder="Buscar cliente..."
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>Desde</span>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span>Hasta</span>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {hayFiltros && (
            <button onClick={limpiarFiltros}
              className="text-xs text-red-500 hover:underline ml-auto">
              Limpiar filtros
            </button>
          )}

          <span className="text-xs text-gray-400 ml-auto">
            {filtradas.length} de {data.length} cotizaciones
          </span>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Cliente', 'Fecha', 'Total', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    {hayFiltros ? 'Sin cotizaciones con esos filtros' : 'Sin cotizaciones'}
                  </td>
                </tr>
              ) : filtradas.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-400 text-xs">#{c.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{nombreCliente(c.clienteId)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.fecha).toLocaleDateString('es-GT')}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    Q{Number(c.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <select value={c.estado}
                      onChange={e => cambiarEstado(c.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${estadoColor[c.estado] || 'bg-gray-100'}`}>
                      <option value="pendiente">pendiente</option>
                      <option value="aprobada">aprobada</option>
                      <option value="rechazada">rechazada</option>
                      <option value="cancelada">cancelada</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => navigate('/cotizaciones/' + c.id)}
                      className="text-xs text-emerald-600 hover:underline">
                      Ver/Editar →
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
