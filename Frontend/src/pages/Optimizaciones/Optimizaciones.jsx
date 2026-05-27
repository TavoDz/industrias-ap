import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { optimizacionesService } from '../../services'

export default function Optimizaciones() {
  const [lista,   setLista]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [buscar,  setBuscar]  = useState('')
  const [material, setMaterial] = useState('')
  const [desde,   setDesde]   = useState('')
  const [hasta,   setHasta]   = useState('')
  const navigate = useNavigate()

  const cargar = async () => {
    setLoading(true)
    try {
      const params = {}
      if (buscar)   params.buscar   = buscar
      if (material) params.material = material
      if (desde)    params.desde    = desde
      if (hasta)    params.hasta    = hasta
      const res = await optimizacionesService.listar(params)
      setLista(res.data)
    } catch {
      setError('Error al cargar optimizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre || 'esta optimización'}"?`)) return
    try {
      await optimizacionesService.eliminar(id)
      setLista(prev => prev.filter(o => o.id !== id))
    } catch {
      setError('Error al eliminar')
    }
  }

  const abrir = (id) => navigate(`/optimizador?load=${id}`)

  const duplicar = async (id) => {
    try {
      const res = await optimizacionesService.obtener(id)
      const orig = res.data
      await optimizacionesService.guardar({
        nombre:        `${orig.nombre || 'Optimización'} (copia)`,
        descripcion:   orig.descripcion,
        materialId:    orig.materialId,
        materialNombre: orig.materialNombre,
        resultado:     orig.resultado,
        request:       orig.request,
      })
      cargar()
    } catch {
      setError('Error al duplicar')
    }
  }

  const reejecutar = async (id) => {
    try {
      await optimizacionesService.reejecutar(id)
      cargar()
    } catch (e) {
      setError(e.response?.data || 'Error al re-ejecutar')
    }
  }

  const handleFiltros = (e) => { e.preventDefault(); cargar() }
  const limpiarFiltros = () => { setBuscar(''); setMaterial(''); setDesde(''); setHasta(''); }

  const fmtFecha = (f) => f ? new Date(f).toLocaleDateString('es-GT', { day:'2-digit', month:'short', year:'numeric' }) : '—'
  const fmtHora  = (f) => f ? new Date(f).toLocaleTimeString('es-GT', { hour:'2-digit', minute:'2-digit' }) : ''

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Optimizaciones guardadas</h2>
          <p className="text-sm text-gray-400 mt-0.5">{lista.length} resultado{lista.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => navigate('/optimizador')}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
          + Nueva optimización
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filtros */}
      <form onSubmit={handleFiltros}
        className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
            <input
              type="text"
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              placeholder="Nombre, descripción o material..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit"
            className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium">
            Buscar
          </button>
          <button type="button" onClick={limpiarFiltros}
            className="text-sm text-gray-500 border border-gray-200 px-4 py-1.5 rounded-lg hover:bg-gray-50 transition">
            Limpiar
          </button>
        </div>
      </form>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Cargando...
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm">No hay optimizaciones guardadas</p>
          <button onClick={() => navigate('/optimizador')}
            className="mt-3 text-sm text-blue-600 hover:underline font-medium">
            Crear primera optimización →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map(opt => (
            <div key={opt.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">

              {/* Card header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                      {opt.nombre || 'Sin nombre'}
                    </h3>
                    {opt.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{opt.descripcion}</p>
                    )}
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0">
                    {opt.materialNombre}
                  </span>
                </div>
              </div>

              {/* Stats */}
              {opt.resumenResultado && (
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-gray-400">Planchas</p>
                    <p className="text-base font-bold text-gray-800">{opt.resumenResultado.totalPlanchas}</p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-gray-400">Uso</p>
                    <p className="text-base font-bold text-green-600">{opt.resumenResultado.porcentajeUso}%</p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-xs text-gray-400">Desperdicio</p>
                    <p className="text-base font-bold text-orange-500">{opt.resumenResultado.porcentajeDesperdicio}%</p>
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="px-5 py-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Creada</span>
                  <span>{fmtFecha(opt.fecha)}</span>
                </div>
                {opt.ultimaEjecucion && (
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Última ejecución</span>
                    <span>{fmtFecha(opt.ultimaEjecucion)} {fmtHora(opt.ultimaEjecucion)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Ejecuciones</span>
                  <span>{opt.totalEjecuciones}</span>
                </div>
                {opt.cotizacionId && (
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Cotización</span>
                    <button onClick={() => navigate(`/cotizaciones/${opt.cotizacionId}`)}
                      className="text-blue-500 hover:underline">#{opt.cotizacionId}</button>
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div className="px-5 pb-4 pt-1 flex gap-2 flex-wrap">
                <button onClick={() => abrir(opt.id)}
                  className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium text-center">
                  Abrir
                </button>
                <button onClick={() => reejecutar(opt.id)}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  title="Re-ejecutar con misma configuración">
                  ↺ Ejecutar
                </button>
                <button onClick={() => duplicar(opt.id)}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  title="Duplicar">
                  ⎘
                </button>
                <button onClick={() => eliminar(opt.id, opt.nombre)}
                  className="text-xs border border-red-100 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                  title="Eliminar">
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
