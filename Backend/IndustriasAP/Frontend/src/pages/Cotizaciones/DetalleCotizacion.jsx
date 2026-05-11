import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  cotizacionesService, piezasService,
  detalleHerrajesService, detalleServiciosService,
  materialesService, herrajesService, serviciosService
} from '../../services'

export default function DetalleCotizacion() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [cotizacion, setCotizacion] = useState(null)
  const [materiales, setMateriales] = useState([])
  const [herrajes,   setHerrajes]   = useState([])
  const [servicios,  setServicios]  = useState([])
  const [loading, setLoading]       = useState(true)
  const [error,   setError]         = useState('')
  const [tab,     setTab]           = useState('piezas')

  // Forms
  const [formPieza,    setFormPieza]    = useState({ nombrePieza: '', materialId: '', largo: '', ancho: '', cantidad: '', metroTapacanto: 0 })
  const [formHerraje,  setFormHerraje]  = useState({ herrajeId: '', cantidad: '', precioUnitario: 0 })
  const [formServicio, setFormServicio] = useState({ servicioId: '', cantidad: '', precio: 0 })

  const cargar = async () => {
    try {
      const [resCot, resMat, resHer, resSer] = await Promise.all([
        cotizacionesService.obtenerCompleta(id),
        materialesService.obtenerTodos(),
        herrajesService.obtenerTodos(),
        serviciosService.obtenerTodos()
      ])
      setCotizacion(resCot.data)
      setMateriales(resMat.data)
      setHerrajes(resHer.data)
      setServicios(resSer.data)
    } catch {
      setError('Error al cargar cotización')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const recalcular = async () => {
    await cotizacionesService.recalcular(id)
    cargar()
  }

  // ── Piezas ────────────────────────────────────────────────
  const agregarPieza = async (e) => {
    e.preventDefault()
    try {
      await piezasService.crear({ ...formPieza, cotizacionId: parseInt(id), materialId: parseInt(formPieza.materialId), largo: parseFloat(formPieza.largo), ancho: parseFloat(formPieza.ancho), cantidad: parseInt(formPieza.cantidad), metroTapacanto: parseFloat(formPieza.metroTapacanto) || 0, costoMaterial: 0 })
      setFormPieza({ nombrePieza: '', materialId: '', largo: '', ancho: '', cantidad: '', metroTapacanto: 0 })
      await recalcular()
    } catch { setError('Error al agregar pieza') }
  }

  const eliminarPieza = async (piezaId) => {
    if (!confirm('¿Eliminar pieza?')) return
    await piezasService.eliminar(piezaId)
    await recalcular()
  }

  // ── Herrajes ──────────────────────────────────────────────
  const agregarHerraje = async (e) => {
    e.preventDefault()
    try {
      await detalleHerrajesService.crear({ cotizacionId: parseInt(id), herrajeId: parseInt(formHerraje.herrajeId), cantidad: parseInt(formHerraje.cantidad), precioUnitario: 0, subtotal: 0 })
      setFormHerraje({ herrajeId: '', cantidad: '', precioUnitario: 0 })
      cargar()
    } catch { setError('Error al agregar herraje') }
  }

  const eliminarHerraje = async (dId) => {
    if (!confirm('¿Eliminar herraje?')) return
    await detalleHerrajesService.eliminar(dId)
    cargar()
  }

  // ── Servicios ─────────────────────────────────────────────
  const agregarServicio = async (e) => {
    e.preventDefault()
    try {
      await detalleServiciosService.crear({ cotizacionId: parseInt(id), servicioId: parseInt(formServicio.servicioId), cantidad: parseInt(formServicio.cantidad), precio: 0, subtotal: 0 })
      setFormServicio({ servicioId: '', cantidad: '', precio: 0 })
      cargar()
    } catch { setError('Error al agregar servicio') }
  }

  const eliminarServicio = async (dId) => {
    if (!confirm('¿Eliminar servicio?')) return
    await detalleServiciosService.eliminar(dId)
    cargar()
  }

  if (loading) return <p className="text-sm text-gray-500 p-6">Cargando...</p>
  if (!cotizacion) return <p className="text-sm text-red-500 p-6">Cotización no encontrada</p>

  const tabs = ['piezas', 'herrajes', 'servicios']

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/cotizaciones')} className="text-sm text-gray-500 hover:text-gray-700">← Volver</button>
        <h2 className="text-xl font-semibold text-gray-800">Cotización #{cotizacion.id}</h2>
        <span className="text-sm text-gray-500">— {cotizacion.clienteNombre}</span>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}

      {/* Totales */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Materiales', valor: cotizacion.totalMateriales },
          { label: 'Herrajes',   valor: cotizacion.totalHerrajes },
          { label: 'Servicios',  valor: cotizacion.totalServicios },
          { label: 'TOTAL',      valor: cotizacion.total },
        ].map(t => (
          <div key={t.label} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{t.label}</p>
            <p className="text-lg font-semibold text-gray-800">Q{Number(t.valor).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB: PIEZAS ───────────────────────────── */}
      {tab === 'piezas' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={agregarPieza} className="grid grid-cols-6 gap-3 p-4 border-b border-gray-100 bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre pieza</label>
              <input value={formPieza.nombrePieza} onChange={e => setFormPieza({...formPieza, nombrePieza: e.target.value})}
                placeholder="Lateral" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Material</label>
              <select value={formPieza.materialId} onChange={e => setFormPieza({...formPieza, materialId: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                <option value="">Seleccionar...</option>
                {materiales.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Largo (mm)</label>
              <input type="number" value={formPieza.largo} onChange={e => setFormPieza({...formPieza, largo: e.target.value})}
                placeholder="600" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ancho (mm)</label>
              <input type="number" value={formPieza.ancho} onChange={e => setFormPieza({...formPieza, ancho: e.target.value})}
                placeholder="400" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={formPieza.cantidad} onChange={e => setFormPieza({...formPieza, cantidad: e.target.value})}
                placeholder="2" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Pieza', 'Material', 'Largo', 'Ancho', 'Cant.', 'Costo material', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cotizacion.piezas?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400 text-sm">Sin piezas agregadas</td></tr>
              ) : cotizacion.piezas?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{p.nombrePieza}</td>
                  <td className="px-4 py-2 text-gray-600">{p.materialNombre}</td>
                  <td className="px-4 py-2 text-gray-600">{p.largo} mm</td>
                  <td className="px-4 py-2 text-gray-600">{p.ancho} mm</td>
                  <td className="px-4 py-2 text-gray-600">{p.cantidad}</td>
                  <td className="px-4 py-2 text-gray-800 font-medium">Q{Number(p.costoMaterial).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => eliminarPieza(p.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: HERRAJES ─────────────────────────── */}
      {tab === 'herrajes' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={agregarHerraje} className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Herraje</label>
              <select value={formHerraje.herrajeId} onChange={e => setFormHerraje({...formHerraje, herrajeId: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                <option value="">Seleccionar...</option>
                {herrajes.map(h => <option key={h.id} value={h.id}>{h.nombre} — Q{h.precioUnitario}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={formHerraje.cantidad} onChange={e => setFormHerraje({...formHerraje, cantidad: e.target.value})}
                placeholder="4" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Herraje', 'Marca', 'Cantidad', 'Precio unit.', 'Subtotal', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cotizacion.herrajes?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Sin herrajes agregados</td></tr>
              ) : cotizacion.herrajes?.map(h => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{h.herrajeNombre}</td>
                  <td className="px-4 py-2 text-gray-600">{h.herrajeMarca || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{h.cantidad}</td>
                  <td className="px-4 py-2 text-gray-600">Q{Number(h.precioUnitario).toFixed(2)}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">Q{Number(h.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => eliminarHerraje(h.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: SERVICIOS ────────────────────────── */}
      {tab === 'servicios' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={agregarServicio} className="grid grid-cols-3 gap-3 p-4 border-b border-gray-100 bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Servicio</label>
              <select value={formServicio.servicioId} onChange={e => setFormServicio({...formServicio, servicioId: e.target.value})}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required>
                <option value="">Seleccionar...</option>
                {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} — Q{s.costo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={formServicio.cantidad} onChange={e => setFormServicio({...formServicio, cantidad: e.target.value})}
                placeholder="1" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded hover:bg-blue-700">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Servicio', 'Proveedor', 'Cantidad', 'Precio', 'Subtotal', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cotizacion.servicios?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Sin servicios agregados</td></tr>
              ) : cotizacion.servicios?.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{s.servicioNombre}</td>
                  <td className="px-4 py-2 text-gray-600">{s.servicioProveedor || '—'}</td>
                  <td className="px-4 py-2 text-gray-600">{s.cantidad}</td>
                  <td className="px-4 py-2 text-gray-600">Q{Number(s.precio).toFixed(2)}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">Q{Number(s.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => eliminarServicio(s.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
