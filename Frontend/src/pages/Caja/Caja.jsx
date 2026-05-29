import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { cajaService, ventasService } from '../../services'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtHora(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

const METODOS = ['efectivo', 'transferencia', 'tarjeta']

export default function Caja() {
  const { usuario } = useAuth()

  const [cajaData,    setCajaData]    = useState(null)   // { caja, movimientos, totales... }
  const [historial,   setHistorial]   = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [tab,         setTab]         = useState('hoy')  // hoy | historial

  // Apertura
  const [showApertura, setShowApertura] = useState(false)
  const [montoApertura,setMontoApertura]= useState('0')
  const [notasApertura,setNotasApertura]= useState('')
  const [abriendo,     setAbriendo]     = useState(false)

  // Cierre
  const [showCierre, setShowCierre]  = useState(false)
  const [montoCierre,setMontoCierre] = useState('')
  const [notasCierre,setNotasCierre] = useState('')
  const [cerrando,   setCerrando]    = useState(false)

  // Movimiento manual
  const [showMov,   setShowMov]   = useState(false)
  const [movForm,   setMovForm]   = useState({ tipo: 'entrada', concepto: '', monto: '', metodo: 'efectivo', referencia: '' })
  const [guardandoMov, setGuardandoMov] = useState(false)

  // Resumen ventas del día
  const [resumenVentas, setResumenVentas] = useState(null)

  const cargarHoy = async () => {
    setLoading(true)
    try {
      const [r1, r2] = await Promise.all([
        cajaService.hoy(),
        ventasService.resumenDia(new Date().toISOString().split('T')[0]),
      ])
      setCajaData(r1.data)
      setResumenVentas(r2.data)
    } catch (e) {
      setError('Error al cargar caja: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }

  const cargarHistorial = async () => {
    try {
      const res = await cajaService.historial(60)
      setHistorial(res.data)
    } catch (e) {
      setError('Error al cargar historial')
    }
  }

  useEffect(() => { cargarHoy() }, [])
  useEffect(() => { if (tab === 'historial') cargarHistorial() }, [tab])

  const abrir = async (e) => {
    e.preventDefault()
    setAbriendo(true)
    try {
      await cajaService.abrir({
        usuarioId:     usuario?.id || 1,
        usuarioNombre: usuario?.nombre || 'Usuario',
        montoApertura: parseFloat(montoApertura) || 0,
        notasApertura: notasApertura || null,
      })
      setShowApertura(false)
      cargarHoy()
    } catch (e) {
      setError('Error al abrir caja: ' + (e.response?.data || e.message))
    } finally {
      setAbriendo(false)
    }
  }

  const cerrar = async (e) => {
    e.preventDefault()
    setCerrando(true)
    try {
      await cajaService.cerrar(cajaData.caja.id, {
        montoCierre: parseFloat(montoCierre) || 0,
        notasCierre: notasCierre || null,
      })
      setShowCierre(false)
      cargarHoy()
    } catch (e) {
      setError('Error al cerrar caja: ' + (e.response?.data || e.message))
    } finally {
      setCerrando(false)
    }
  }

  const agregarMovimiento = async (e) => {
    e.preventDefault()
    setGuardandoMov(true)
    try {
      await cajaService.agregarMovimiento(cajaData.caja.id, {
        tipo:       movForm.tipo,
        concepto:   movForm.concepto,
        monto:      parseFloat(movForm.monto),
        metodo:     movForm.metodo,
        referencia: movForm.referencia || null,
      })
      setShowMov(false)
      setMovForm({ tipo: 'entrada', concepto: '', monto: '', metodo: 'efectivo', referencia: '' })
      cargarHoy()
    } catch (e) {
      setError('Error al agregar movimiento: ' + (e.response?.data || e.message))
    } finally {
      setGuardandoMov(false)
    }
  }

  const caja = cajaData?.caja
  const movs = cajaData?.movimientos || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Caja</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {caja && caja.estado === 'abierta' && (
            <>
              <button onClick={() => setShowMov(true)}
                className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                + Movimiento
              </button>
              <button onClick={() => { setMontoCierre(''); setNotasCierre(''); setShowCierre(true) }}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium">
                Cerrar caja
              </button>
            </>
          )}
          {!caja && !loading && (
            <button onClick={() => setShowApertura(true)}
              className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium">
              Abrir caja del día
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
        {['hoy', 'historial'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${
              tab === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'hoy' ? 'Caja de hoy' : 'Historial'}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Cargando...</div>}

      {/* ── Tab HOY ───────────────────────────────────────────────────── */}
      {!loading && tab === 'hoy' && (
        <>
          {!caja ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-16">
              <p className="text-gray-400 text-sm mb-3">No hay caja abierta para hoy</p>
              <button onClick={() => setShowApertura(true)}
                className="bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 font-medium">
                Abrir caja
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Estado de la caja */}
              <div className={`border rounded-xl p-4 flex items-center justify-between ${
                caja.estado === 'abierta' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <div>
                  <span className={`text-sm font-semibold ${caja.estado === 'abierta' ? 'text-emerald-700' : 'text-gray-600'}`}>
                    {caja.estado === 'abierta' ? '🟢 Caja abierta' : '🔴 Caja cerrada'}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Apertura: Q{Number(caja.montoApertura).toFixed(2)} · Por: {caja.usuarioNombre}
                  </p>
                </div>
                {caja.estado === 'cerrada' && caja.montoCierre != null && (
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Cierre efectivo</p>
                    <p className="text-base font-bold text-gray-700">Q{Number(caja.montoCierre).toFixed(2)}</p>
                  </div>
                )}
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Efectivo',       value: cajaData.totalEfectivo,      color: 'text-green-600' },
                  { label: 'Transferencia',  value: cajaData.totalTransferencia, color: 'text-emerald-600'  },
                  { label: 'Tarjeta',        value: cajaData.totalTarjeta,       color: 'text-purple-600'},
                  { label: 'Salidas',        value: cajaData.totalSalidas,       color: 'text-red-500'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>Q{Number(value).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              {/* Saldo y ventas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Saldo esperado en caja</p>
                  <p className="text-2xl font-bold text-gray-900">Q{Number(cajaData.saldoEsperado).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Apertura + Efectivo entradas − Salidas
                  </p>
                </div>
                {resumenVentas && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 mb-2">Ventas del día</p>
                    <p className="text-2xl font-bold text-emerald-600">Q{Number(resumenVentas.totalCobrado).toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">{resumenVentas.totalVentas} venta{resumenVentas.totalVentas !== 1 ? 's' : ''} cobradas</p>
                  </div>
                )}
              </div>

              {/* Movimientos */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Movimientos del día</p>
                  <span className="text-xs text-gray-400">{movs.length} movimiento{movs.length !== 1 ? 's' : ''}</span>
                </div>
                {movs.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Sin movimientos registrados</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Hora', 'Tipo', 'Concepto', 'Método', 'Monto'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {movs.map((m, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{fmtHora(m.fecha)}</td>
                          <td className="px-4 py-2.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.tipo === 'venta'   ? 'bg-emerald-100 text-emerald-700' :
                              m.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {m.concepto}
                            {m.referencia && <span className="text-xs text-gray-400 ml-1">· {m.referencia}</span>}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs capitalize">{m.metodo}</td>
                          <td className={`px-4 py-2.5 font-semibold ${m.tipo === 'salida' ? 'text-red-500' : 'text-emerald-600'}`}>
                            {m.tipo === 'salida' ? '−' : '+'}Q{Number(m.monto).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </>
      )}

      {/* ── Tab HISTORIAL ─────────────────────────────────────────────── */}
      {tab === 'historial' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Fecha', 'Usuario', 'Apertura', 'Entradas', 'Salidas', 'Cierre', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historial.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Sin historial de cajas</td></tr>
              ) : historial.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{fmt(c.fecha)}</td>
                  <td className="px-4 py-3 text-gray-500">{c.usuarioNombre}</td>
                  <td className="px-4 py-3 text-gray-600">Q{Number(c.montoApertura).toFixed(2)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">Q{Number(c.totalEntradas).toFixed(2)}</td>
                  <td className="px-4 py-3 text-red-500">Q{Number(c.totalSalidas).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {c.montoCierre != null ? `Q${Number(c.montoCierre).toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.estado === 'abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>{c.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal apertura ───────────────────────────────────────────── */}
      {showApertura && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Abrir caja</h3>
            <form onSubmit={abrir} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Monto de apertura (Q) *</label>
                <input type="number" min="0" step="0.01" value={montoApertura}
                  onChange={e => setMontoApertura(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas</label>
                <textarea value={notasApertura} onChange={e => setNotasApertura(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={abriendo}
                  className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  {abriendo ? 'Abriendo...' : 'Abrir caja'}
                </button>
                <button type="button" onClick={() => setShowApertura(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal cierre ─────────────────────────────────────────────── */}
      {showCierre && caja && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Cerrar caja</h3>
            <p className="text-xs text-gray-500 mb-4">Saldo esperado: Q{Number(cajaData.saldoEsperado).toFixed(2)}</p>
            <form onSubmit={cerrar} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Efectivo contado en caja (Q) *</label>
                <input type="number" min="0" step="0.01" value={montoCierre}
                  onChange={e => setMontoCierre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required />
                {montoCierre && (
                  <p className={`text-xs mt-1 ${
                    Math.abs(parseFloat(montoCierre) - Number(cajaData.saldoEsperado)) < 1
                      ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    Diferencia: Q{(parseFloat(montoCierre) - Number(cajaData.saldoEsperado)).toFixed(2)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notas de cierre</label>
                <textarea value={notasCierre} onChange={e => setNotasCierre(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={cerrando}
                  className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50">
                  {cerrando ? 'Cerrando...' : 'Cerrar caja'}
                </button>
                <button type="button" onClick={() => setShowCierre(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal movimiento manual ───────────────────────────────────── */}
      {showMov && caja && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Registrar movimiento</h3>
            <form onSubmit={agregarMovimiento} className="space-y-3">
              <div className="flex gap-2">
                {['entrada', 'salida'].map(t => (
                  <button key={t} type="button" onClick={() => setMovForm({ ...movForm, tipo: t })}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition capitalize ${
                      movForm.tipo === t
                        ? t === 'entrada' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-red-600 text-white border-red-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {t === 'entrada' ? '↑ Entrada' : '↓ Salida'}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Concepto *</label>
                <input value={movForm.concepto} onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
                  placeholder="Ej: Pago de proveedor, fondo de caja..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Monto (Q) *</label>
                  <input type="number" min="0.01" step="0.01" value={movForm.monto}
                    onChange={e => setMovForm({ ...movForm, monto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Método</label>
                  <select value={movForm.metodo} onChange={e => setMovForm({ ...movForm, metodo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Referencia</label>
                <input value={movForm.referencia} onChange={e => setMovForm({ ...movForm, referencia: e.target.value })}
                  placeholder="Opcional..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={guardandoMov}
                  className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50">
                  {guardandoMov ? 'Guardando...' : 'Registrar'}
                </button>
                <button type="button" onClick={() => setShowMov(false)}
                  className="px-4 py-2.5 border border-gray-300 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
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
