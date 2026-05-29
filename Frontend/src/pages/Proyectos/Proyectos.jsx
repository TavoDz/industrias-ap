import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { proyectosService } from '../../services'

const ESTADO_CONFIG = {
  pendiente:   { label: 'Pendiente',   cls: 'bg-amber-100 text-amber-700 border-amber-200'  },
  en_proceso:  { label: 'En proceso',  cls: 'bg-emerald-100  text-emerald-700  border-emerald-200'   },
  finalizado:  { label: 'Finalizado',  cls: 'bg-green-100 text-green-700 border-green-200'  },
}

const ESTADOS = Object.keys(ESTADO_CONFIG)

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CONFIG[estado] || { label: estado, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function fmtFecha(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Proyectos() {
  const [proyectos,   setProyectos]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [editando,    setEditando]    = useState(null)   // id del proyecto en edición de estado
  const [editForm,    setEditForm]    = useState({})
  const [showEdit,    setShowEdit]    = useState(null)   // id del proyecto con panel edición abierto
  const navigate = useNavigate()

  const cargar = async () => {
    setLoading(true)
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {}
      const res = await proyectosService.obtenerTodos(params)
      setProyectos(res.data)
    } catch (e) {
      setError('Error al cargar proyectos: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [filtroEstado])

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await proyectosService.actualizar(id, { estado: nuevoEstado })
      setProyectos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p))
    } catch (e) {
      setError('Error al cambiar estado: ' + (e.response?.data || e.message))
    }
  }

  const guardarEdicion = async (id) => {
    try {
      await proyectosService.actualizar(id, editForm)
      setShowEdit(null)
      cargar()
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data || e.message))
    }
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el proyecto "${nombre}"?`)) return
    try {
      await proyectosService.eliminar(id)
      setProyectos(prev => prev.filter(p => p.id !== id))
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data || e.message))
    }
  }

  const abrirEdicion = (p) => {
    setEditForm({
      nombre:       p.nombre,
      notas:        p.notas || '',
      fechaInicio:  p.fechaInicio  ? p.fechaInicio.split('T')[0]  : '',
      fechaEntrega: p.fechaEntrega ? p.fechaEntrega.split('T')[0] : '',
    })
    setShowEdit(p.id)
  }

  const counts = {
    pendiente:  proyectos.filter(p => p.estado === 'pendiente').length,
    en_proceso: proyectos.filter(p => p.estado === 'en_proceso').length,
    finalizado: proyectos.filter(p => p.estado === 'finalizado').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Proyectos de producción</h2>
          <p className="text-sm text-gray-500 mt-0.5">{proyectos.length} proyecto{proyectos.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pendientes',  key: 'pendiente',  color: 'text-amber-600' },
          { label: 'En proceso',  key: 'en_proceso', color: 'text-emerald-600'  },
          { label: 'Finalizados', key: 'finalizado', color: 'text-green-600' },
        ].map(({ label, key, color }) => (
          <button key={key}
            onClick={() => setFiltroEstado(filtroEstado === key ? '' : key)}
            className={`bg-white border rounded-xl p-4 text-left transition hover:shadow-sm ${
              filtroEstado === key ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-200'
            }`}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{counts[key]}</p>
          </button>
        ))}
      </div>

      {/* Filtro activo */}
      {filtroEstado && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500">Filtrando por:</span>
          <EstadoBadge estado={filtroEstado} />
          <button onClick={() => setFiltroEstado('')}
            className="text-xs text-red-500 hover:underline">× Quitar filtro</button>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : proyectos.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm mb-1">
            {filtroEstado ? `No hay proyectos con estado "${ESTADO_CONFIG[filtroEstado]?.label}"` : 'No hay proyectos aún'}
          </p>
          <p className="text-xs text-gray-400">Los proyectos se crean desde una cotización aprobada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proyectos.map(p => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">

              {/* Card header */}
              <div className={`px-1 py-1 ${
                p.estado === 'finalizado' ? 'bg-green-500' :
                p.estado === 'en_proceso' ? 'bg-emerald-500' : 'bg-amber-400'
              }`} />

              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{p.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{p.clienteNombre}</p>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </div>
              </div>

              {/* Info */}
              <div className="px-5 py-3 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Cotización</span>
                  <button onClick={() => navigate(`/cotizaciones/${p.cotizacionId}`)}
                    className="text-emerald-500 hover:underline font-medium">
                    #{p.cotizacionId} — Q{Number(p.cotizacionTotal).toFixed(2)}
                  </button>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Inicio</span>
                  <span>{fmtFecha(p.fechaInicio)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Entrega</span>
                  <span className={p.fechaEntrega && new Date(p.fechaEntrega) < new Date() && p.estado !== 'finalizado'
                    ? 'text-red-500 font-medium' : ''}>
                    {fmtFecha(p.fechaEntrega)}
                  </span>
                </div>
                {p.totalOptimizaciones > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Optimizaciones</span>
                    <span className="text-emerald-500 font-medium">{p.totalOptimizaciones} corte{p.totalOptimizaciones > 1 ? 's' : ''}</span>
                  </div>
                )}
                {p.notas && (
                  <p className="text-xs text-gray-500 italic mt-2 border-t border-gray-100 pt-2 line-clamp-2">
                    {p.notas}
                  </p>
                )}
              </div>

              {/* Cambio de estado rápido */}
              <div className="px-5 pb-3">
                <p className="text-xs text-gray-400 mb-1.5">Cambiar estado:</p>
                <div className="flex gap-1.5">
                  {ESTADOS.map(e => (
                    <button key={e}
                      onClick={() => cambiarEstado(p.id, e)}
                      disabled={p.estado === e}
                      className={`flex-1 text-xs py-1.5 rounded-lg border transition font-medium ${
                        p.estado === e
                          ? ESTADO_CONFIG[e].cls + ' opacity-60 cursor-default'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}>
                      {ESTADO_CONFIG[e].label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Panel edición */}
              {showEdit === p.id && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-3 bg-gray-50">
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                      <input value={editForm.nombre} onChange={e => setEditForm({ ...editForm, nombre: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                        <input type="date" value={editForm.fechaInicio}
                          onChange={e => setEditForm({ ...editForm, fechaInicio: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Entrega</label>
                        <input type="date" value={editForm.fechaEntrega}
                          onChange={e => setEditForm({ ...editForm, fechaEntrega: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Notas</label>
                      <textarea value={editForm.notas}
                        onChange={e => setEditForm({ ...editForm, notas: e.target.value })}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => guardarEdicion(p.id)}
                        className="flex-1 text-xs bg-emerald-600 text-white py-1.5 rounded-lg hover:bg-emerald-700 font-medium">
                        Guardar
                      </button>
                      <button onClick={() => setShowEdit(null)}
                        className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-white">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="px-5 pb-4 pt-1 flex gap-2 border-t border-gray-100">
                <button onClick={() => navigate(`/cotizaciones/${p.cotizacionId}`)}
                  className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 transition text-center">
                  Ver cotización
                </button>
                <button onClick={() => abrirEdicion(p)}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  title="Editar detalles">
                  ✏️
                </button>
                <button onClick={() => eliminar(p.id, p.nombre)}
                  className="text-xs border border-red-100 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  title="Eliminar proyecto">
                  ✕
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
