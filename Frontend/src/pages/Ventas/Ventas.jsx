import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ventasService, cotizacionesService, clientesService, inventarioService } from '../../services'
import { generarComprobanteVenta } from '../../utils/comprobanteVenta'

const ESTADO_CFG = {
  pendiente_pago: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700' },
  pagada:         { label: 'Pagada',    cls: 'bg-green-100 text-green-700'  },
  anulada:        { label: 'Anulada',   cls: 'bg-red-100   text-red-600'    },
}

const METODOS = ['efectivo', 'transferencia', 'tarjeta']

function fmt(d) {
  return new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}

const pagoInit = { metodo: 'efectivo', monto: '', referencia: '' }
const detalleInit = { descripcion: '', cantidad: 1, precioUnitario: '', inventarioId: null }

export default function Ventas() {
  const { usuario }  = useAuth()
  const navigate     = useNavigate()

  const [ventas,      setVentas]      = useState([])
  const [clientes,    setClientes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [filtroEstado,setFiltroEstado]= useState('')

  // Modal nueva venta
  const [showModal,   setShowModal]   = useState(false)
  const [tipoVenta,   setTipoVenta]   = useState('cotizacion') // cotizacion | suelta
  const [cotizId,     setCotizId]     = useState('')
  const [cotizInfo,   setCotizInfo]   = useState(null)
  const [clienteId,   setClienteId]   = useState('')
  const [clienteLibre,setClienteLibre]= useState('')
  const [descuento,   setDescuento]   = useState('0')
  const [notas,       setNotas]       = useState('')
  const [detalle,     setDetalle]     = useState([detalleInit])
  const [pagos,       setPagos]       = useState([pagoInit])
  const [creando,     setCreando]     = useState(false)

  // Inventario para venta directa
  const [invList,      setInvList]      = useState([])
  const [invSearch,    setInvSearch]    = useState('')

  // Panel pago adicional
  const [ventaDetalle, setVentaDetalle] = useState(null)
  const [showPagoModal,setShowPagoModal]= useState(false)
  const [nuevoPago,    setNuevoPago]    = useState(pagoInit)
  const [pagando,      setPagando]      = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {}
      const [r1, r2] = await Promise.all([
        ventasService.obtenerTodos(params),
        clientesService.obtenerTodos(),
      ])
      setVentas(r1.data)
      setClientes(r2.data)
    } catch (e) {
      setError('Error al cargar: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [filtroEstado])

  const cargarInventario = async () => {
    try {
      const r = await inventarioService.obtenerDisponible()
      setInvList(r.data)
    } catch {}
  }

  const filteredInv = invSearch.length > 0
    ? invList.filter(i => i.nombre.toLowerCase().includes(invSearch.toLowerCase()))
    : []

  const agregarDesdeInventario = (item) => {
    const nuevo = { descripcion: item.nombre, cantidad: 1, precioUnitario: String(item.precio), inventarioId: item.inventarioId }
    setDetalle(prev => {
      const soloVacio = prev.length === 1 && !prev[0].descripcion && !prev[0].precioUnitario
      return soloVacio ? [nuevo] : [...prev, nuevo]
    })
    setInvSearch('')
  }

  const buscarCotizacion = async () => {
    if (!cotizId) return
    try {
      const res = await cotizacionesService.obtenerCompleta(cotizId)
      setCotizInfo(res.data)
      setClienteId(String(res.data.clienteId || ''))
    } catch {
      setError('Cotización no encontrada')
      setCotizInfo(null)
    }
  }

  const totalDetalle = detalle.reduce((s, d) =>
    s + (parseFloat(d.precioUnitario) || 0) * (parseFloat(d.cantidad) || 0), 0)

  const subtotal = tipoVenta === 'cotizacion'
    ? (cotizInfo ? Number(cotizInfo.total) : 0)
    : totalDetalle
  const total = Math.max(0, subtotal - (parseFloat(descuento) || 0))
  const totalPagos = pagos.reduce((s, p) => s + (parseFloat(p.monto) || 0), 0)

  const crearVenta = async (e) => {
    e.preventDefault()
    setCreando(true)
    setError('')
    try {
      const dto = {
        tipo:          tipoVenta,
        cotizacionId:  tipoVenta === 'cotizacion' ? parseInt(cotizId) : null,
        clienteId:     clienteId ? parseInt(clienteId) : null,
        clienteNombre: tipoVenta === 'suelta' ? clienteLibre || null : null,
        usuarioId:     usuario?.id || 1,
        usuarioNombre: usuario?.nombre || 'Usuario',
        descuento:     parseFloat(descuento) || 0,
        notas:         notas || null,
        detalle:       tipoVenta === 'suelta' ? detalle.filter(d => d.descripcion && d.precioUnitario).map(d => ({
          descripcion:    d.descripcion,
          cantidad:       parseFloat(d.cantidad) || 1,
          precioUnitario: parseFloat(d.precioUnitario),
          inventarioId:   d.inventarioId || null,
        })) : [],
        pagos: pagos.filter(p => p.metodo && parseFloat(p.monto) > 0).map(p => ({
          metodo:     p.metodo,
          monto:      parseFloat(p.monto),
          referencia: p.referencia || null,
        })),
      }
      await ventasService.crear(dto)
      setShowModal(false)
      resetModal()
      cargar()
    } catch (e) {
      setError('Error al crear venta: ' + (e.response?.data || e.message))
    } finally {
      setCreando(false)
    }
  }

  const resetModal = () => {
    setTipoVenta('cotizacion'); setCotizId(''); setCotizInfo(null)
    setClienteId(''); setClienteLibre(''); setDescuento('0'); setNotas('')
    setDetalle([detalleInit]); setPagos([pagoInit]); setInvSearch('')
  }

  const abrirPago = async (venta) => {
    try {
      const res = await ventasService.obtenerPorId(venta.id)
      setVentaDetalle(res.data)
      setNuevoPago(pagoInit)
      setShowPagoModal(true)
    } catch {
      setError('Error al cargar venta')
    }
  }

  const registrarPago = async (e) => {
    e.preventDefault()
    setPagando(true)
    try {
      await ventasService.agregarPago(ventaDetalle.venta.id, {
        metodo:     nuevoPago.metodo,
        monto:      parseFloat(nuevoPago.monto),
        referencia: nuevoPago.referencia || null,
      })
      setShowPagoModal(false)
      cargar()
    } catch (e) {
      setError('Error al registrar pago: ' + (e.response?.data || e.message))
    } finally {
      setPagando(false)
    }
  }

  const anular = async (id) => {
    if (!confirm('¿Anular esta venta?')) return
    try {
      await ventasService.anular(id)
      cargar()
    } catch {
      setError('Error al anular')
    }
  }

  const [generandoPdf, setGenerandoPdf] = useState(null)
  const descargarComprobante = async (ventaId) => {
    setGenerandoPdf(ventaId)
    try {
      const res = await ventasService.obtenerPorId(ventaId)
      await generarComprobanteVenta(res.data)
    } catch {
      setError('Error al generar comprobante')
    } finally {
      setGenerandoPdf(null)
    }
  }

  const totales = {
    pendiente: ventas.filter(v => v.estado === 'pendiente_pago').length,
    pagada:    ventas.filter(v => v.estado === 'pagada').length,
    monto:     ventas.filter(v => v.estado !== 'anulada').reduce((s, v) => s + Number(v.total), 0),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Ventas</h2>
          <p className="text-sm text-gray-500 mt-0.5">{ventas.length} registro{ventas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setShowModal(true); resetModal(); cargarInventario() }}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium">
          + Nueva venta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Pendientes de pago', value: totales.pendiente, color: 'text-amber-600' },
          { label: 'Pagadas',            value: totales.pagada,    color: 'text-green-600' },
          { label: 'Total vendido',      value: `Q${totales.monto.toFixed(2)}`, color: 'text-emerald-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-3">
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los estados</option>
          <option value="pendiente_pago">Pendiente de pago</option>
          <option value="pagada">Pagada</option>
          <option value="anulada">Anulada</option>
        </select>
        {filtroEstado && (
          <button onClick={() => setFiltroEstado('')} className="text-xs text-red-500 hover:underline">
            × Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['#', 'Tipo', 'Cliente', 'Fecha', 'Total', 'Pagado', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-gray-400 text-sm mb-2">No hay ventas registradas</p>
                    <button onClick={() => setShowModal(true)}
                      className="text-sm text-emerald-600 hover:underline font-medium">
                      Registrar primera venta →
                    </button>
                  </td>
                </tr>
              ) : ventas.map(v => {
                const cfg = ESTADO_CFG[v.estado] || { label: v.estado, cls: 'bg-gray-100 text-gray-600' }
                const pendiente = Number(v.total) - Number(v.totalPagado)
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 transition ${v.estado === 'anulada' ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-400 text-xs">#{v.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        v.tipo === 'cotizacion' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {v.tipo === 'cotizacion' ? `Cot. #${v.cotizacionId}` : 'Directa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.clienteNombre || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{fmt(v.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">Q{Number(v.total).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${Number(v.totalPagado) >= Number(v.total) ? 'text-green-600' : 'text-amber-600'}`}>
                        Q{Number(v.totalPagado).toFixed(2)}
                      </span>
                      {pendiente > 0 && v.estado !== 'anulada' && (
                        <span className="text-xs text-gray-400 block">Falta Q{pendiente.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end items-center">
                        {v.estado === 'pendiente_pago' && (
                          <button onClick={() => abrirPago(v)}
                            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-700 transition font-medium">
                            + Pago
                          </button>
                        )}
                        <button
                          onClick={() => descargarComprobante(v.id)}
                          disabled={generandoPdf === v.id}
                          className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
                          title="Descargar comprobante PDF">
                          {generandoPdf === v.id ? '...' : 'PDF'}
                        </button>
                        {v.tipo === 'cotizacion' && v.cotizacionId && (
                          <button onClick={() => navigate(`/cotizaciones/${v.cotizacionId}`)}
                            className="text-xs text-emerald-600 hover:underline">Ver cot.</button>
                        )}
                        {v.estado !== 'anulada' && (
                          <button onClick={() => anular(v.id)}
                            className="text-xs text-red-400 hover:underline">Anular</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal nueva venta ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">Nueva venta</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <form onSubmit={crearVenta} className="p-6 space-y-5">

              {/* Tipo */}
              <div className="flex gap-3">
                {['cotizacion', 'suelta'].map(t => (
                  <button key={t} type="button" onClick={() => setTipoVenta(t)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                      tipoVenta === t
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {t === 'cotizacion' ? '📋 Desde cotización' : '🛒 Venta directa'}
                  </button>
                ))}
              </div>

              {/* Desde cotización */}
              {tipoVenta === 'cotizacion' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">N° de cotización *</label>
                  <div className="flex gap-2">
                    <input type="number" value={cotizId} onChange={e => setCotizId(e.target.value)}
                      placeholder="ID de cotización..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <button type="button" onClick={buscarCotizacion}
                      className="text-sm bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                      Buscar
                    </button>
                  </div>
                  {cotizInfo && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3 text-sm">
                      <p className="font-medium text-emerald-800">{cotizInfo.clienteNombre}</p>
                      <p className="text-emerald-600 text-xs mt-0.5">
                        Total: Q{Number(cotizInfo.total).toFixed(2)} · Estado: {cotizInfo.estado}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Venta suelta */}
              {tipoVenta === 'suelta' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente (opcional)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Seleccionar cliente...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                      <input value={clienteLibre} onChange={e => setClienteLibre(e.target.value)}
                        placeholder="O escribir nombre libre..."
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>

                  {/* Buscar en inventario */}
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Buscar en inventario</label>
                    <input
                      type="text"
                      value={invSearch}
                      onChange={e => setInvSearch(e.target.value)}
                      placeholder="Escribir nombre de material o herraje..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {filteredInv.length > 0 && (
                      <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredInv.map(item => (
                          <button
                            key={item.inventarioId}
                            type="button"
                            onClick={() => agregarDesdeInventario(item)}
                            className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                          >
                            <div>
                              <span className="text-sm font-medium text-gray-800">{item.nombre}</span>
                              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${item.tipoItem === 'material' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'}`}>
                                {item.tipoItem}
                              </span>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <span className="text-sm font-semibold text-gray-800">Q{Number(item.precio).toFixed(2)}</span>
                              <span className="text-xs text-gray-400 block">Stock: {Number(item.cantidad)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {invSearch.length > 0 && filteredInv.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">Sin resultados en inventario</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Ítems *</label>
                    <div className="space-y-2">
                      {detalle.map((d, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6 relative">
                            <input value={d.descripcion}
                              onChange={e => { const n=[...detalle]; n[i]={...n[i],descripcion:e.target.value,inventarioId:null}; setDetalle(n) }}
                              placeholder="Descripción"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${d.inventarioId ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'}`} />
                            {d.inventarioId && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-500">inv</span>
                            )}
                          </div>
                          <input type="number" value={d.cantidad} min="0.01" step="0.01"
                            onChange={e => { const n=[...detalle]; n[i]={...n[i],cantidad:e.target.value}; setDetalle(n) }}
                            className="col-span-2 border border-gray-300 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <input type="number" value={d.precioUnitario} min="0" step="0.01"
                            onChange={e => { const n=[...detalle]; n[i]={...n[i],precioUnitario:e.target.value}; setDetalle(n) }}
                            placeholder="Precio"
                            className="col-span-3 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          {detalle.length > 1 && (
                            <button type="button" onClick={() => setDetalle(detalle.filter((_, j) => j !== i))}
                              className="col-span-1 text-red-400 hover:text-red-600 text-lg">×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setDetalle([...detalle, detalleInit])}
                        className="text-xs text-emerald-600 hover:underline">+ Agregar ítem manualmente</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Descuento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Descuento (Q)</label>
                  <input type="number" value={descuento} min="0" step="0.01"
                    onChange={e => setDescuento(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-right">
                    <p className="text-xs text-gray-400">Subtotal: Q{subtotal.toFixed(2)}</p>
                    <p className="text-lg font-bold text-gray-900">Total: Q{total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Pagos */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Pagos</label>
                <div className="space-y-2">
                  {pagos.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select value={p.metodo}
                        onChange={e => { const n=[...pagos]; n[i]={...n[i],metodo:e.target.value}; setPagos(n) }}
                        className="col-span-3 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <input type="number" value={p.monto} min="0" step="0.01" placeholder="Monto"
                        onChange={e => { const n=[...pagos]; n[i]={...n[i],monto:e.target.value}; setPagos(n) }}
                        className="col-span-3 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <input value={p.referencia} placeholder="Ref. / No. transacción"
                        onChange={e => { const n=[...pagos]; n[i]={...n[i],referencia:e.target.value}; setPagos(n) }}
                        className="col-span-5 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      {pagos.length > 1 && (
                        <button type="button" onClick={() => setPagos(pagos.filter((_, j) => j !== i))}
                          className="col-span-1 text-red-400 hover:text-red-600 text-lg">×</button>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setPagos([...pagos, pagoInit])}
                      className="text-xs text-emerald-600 hover:underline">+ Agregar forma de pago</button>
                    <span className={`text-xs font-medium ${totalPagos >= total ? 'text-green-600' : 'text-amber-600'}`}>
                      Pagado: Q{totalPagos.toFixed(2)} / Q{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)}
                  rows={2} placeholder="Observaciones..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creando}
                  className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
                  {creando ? 'Registrando...' : 'Registrar venta'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal pago adicional ────────────────────────────────────────── */}
      {showPagoModal && ventaDetalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Registrar pago</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Venta #{ventaDetalle.venta.id} · Pendiente: Q{
                    Math.max(0, Number(ventaDetalle.venta.total) - ventaDetalle.pagos.reduce((s, p) => s + Number(p.monto), 0)).toFixed(2)
                  }
                </p>
              </div>
              <button onClick={() => setShowPagoModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {/* Pagos existentes */}
            {ventaDetalle.pagos.length > 0 && (
              <div className="mb-4 space-y-1">
                <p className="text-xs text-gray-400 mb-2">Pagos anteriores:</p>
                {ventaDetalle.pagos.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-600 capitalize">{p.metodo} {p.referencia ? `· ${p.referencia}` : ''}</span>
                    <span className="font-medium text-green-600">Q{Number(p.monto).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={registrarPago} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Método de pago *</label>
                <select value={nuevoPago.metodo} onChange={e => setNuevoPago({ ...nuevoPago, metodo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {METODOS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto (Q) *</label>
                <input type="number" min="0.01" step="0.01" value={nuevoPago.monto}
                  onChange={e => setNuevoPago({ ...nuevoPago, monto: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Referencia</label>
                <input value={nuevoPago.referencia} onChange={e => setNuevoPago({ ...nuevoPago, referencia: e.target.value })}
                  placeholder="No. de transacción, cheque..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={pagando}
                  className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition">
                  {pagando ? 'Registrando...' : 'Registrar pago'}
                </button>
                <button type="button" onClick={() => setShowPagoModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
