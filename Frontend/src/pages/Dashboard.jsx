import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { clientesService, cotizacionesService, optimizacionesService, inventarioService } from '../services'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const ESTADO_COLORS = {
  pendiente: '#f59e0b',
  aprobada:  '#22c55e',
  rechazada: '#ef4444',
  cancelada: '#94a3b8',
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function StatCard({ label, value, sub, color = 'blue', onClick }) {
  const ring = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    amber:  'bg-amber-50 text-amber-700 border-amber-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    red:    'bg-red-50 text-red-600 border-red-100',
  }
  return (
    <button onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md transition shadow-sm w-full">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-base mb-3 border font-bold ${ring[color]}`}>
        {value}
      </div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </button>
  )
}

// Tooltip personalizado para moneda
function TooltipMoneda({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name.includes('Q') || p.name === 'Ingresos'
            ? `Q${Number(p.value).toFixed(2)}`
            : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()

  const [cotizaciones,   setCotizaciones]   = useState([])
  const [stats,          setStats]          = useState({ clientes: 0, cotizaciones: 0, pendientes: 0, optimizaciones: 0 })
  const [stockAlertas,   setStockAlertas]   = useState([])
  const [loadingStats,   setLoadingStats]   = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [rCli, rCot, rOpt, rInv] = await Promise.all([
          clientesService.obtenerTodos(),
          cotizacionesService.obtenerTodos(),
          optimizacionesService.listar({}),
          inventarioService.obtenerTodos().catch(() => ({ data: [] })),
        ])
        const cots = rCot.data || []
        setCotizaciones(cots)
        setStats({
          clientes:      (rCli.data || []).length,
          cotizaciones:  cots.length,
          pendientes:    cots.filter(c => c.estado === 'pendiente').length,
          optimizaciones: (rOpt.data || []).length,
        })
        setStockAlertas((rInv.data || []).filter(i => i.cantidad <= i.minimo))
      } catch {
        // silencioso
      } finally {
        setLoadingStats(false)
      }
    }
    cargar()
  }, [])

  // ── Datos para gráficas ──────────────────────────────────────────────────
  // Cotizaciones y monto por mes (últimos 6 meses)
  const dataMeses = (() => {
    const ahora  = new Date()
    const result = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const mes = MESES[d.getMonth()]
      const enMes = cotizaciones.filter(c => {
        const f = new Date(c.fecha)
        return f.getMonth() === d.getMonth() && f.getFullYear() === d.getFullYear()
      })
      result.push({
        mes,
        Cotizaciones: enMes.length,
        Ingresos:     enMes.filter(c => c.estado === 'aprobada').reduce((s, c) => s + Number(c.total), 0),
      })
    }
    return result
  })()

  // Distribución por estado
  const dataEstados = Object.entries(
    cotizaciones.reduce((acc, c) => {
      acc[c.estado] = (acc[c.estado] || 0) + 1
      return acc
    }, {})
  ).map(([estado, value]) => ({ name: estado, value }))

  // Ingresos acumulados aprobados por mes
  const totalAprobado = cotizaciones
    .filter(c => c.estado === 'aprobada')
    .reduce((s, c) => s + Number(c.total), 0)

  const hora    = new Date().getHours()
  const saludo  = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">{saludo}, {usuario?.nombre?.split(' ')[0]}</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('es-GT', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Alerta de stock */}
      {stockAlertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-amber-500 text-lg">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {stockAlertas.length} item{stockAlertas.length > 1 ? 's' : ''} con stock bajo
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {stockAlertas.map(i => i.itemId).join(', ')} — ve a Inventario para revisar
            </p>
          </div>
          <button onClick={() => navigate('/inventario')}
            className="ml-auto text-xs text-amber-700 border border-amber-300 px-3 py-1 rounded-lg hover:bg-amber-100 transition">
            Ver inventario →
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Clientes"         value={loadingStats ? '…' : stats.clientes}       sub="registrados"    color="blue"   onClick={() => navigate('/clientes')} />
        <StatCard label="Cotizaciones"     value={loadingStats ? '…' : stats.cotizaciones}   sub="en total"       color="green"  onClick={() => navigate('/cotizaciones')} />
        <StatCard label="Pendientes"       value={loadingStats ? '…' : stats.pendientes}     sub="por aprobar"    color="amber"  onClick={() => navigate('/cotizaciones')} />
        <StatCard label="Cortes guardados" value={loadingStats ? '…' : stats.optimizaciones} sub="optimizaciones" color="purple" onClick={() => navigate('/optimizaciones')} />
      </div>

      {/* KPI rápido */}
      {!loadingStats && cotizaciones.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Ingresos aprobados',    value: `Q${totalAprobado.toFixed(2)}`,                                         color: 'text-emerald-600' },
            { label: 'Tasa de aprobación',    value: `${Math.round((cotizaciones.filter(c=>c.estado==='aprobada').length / cotizaciones.length)*100)}%`, color: 'text-blue-600' },
            { label: 'Ticket promedio',       value: `Q${(totalAprobado / Math.max(1, cotizaciones.filter(c=>c.estado==='aprobada').length)).toFixed(2)}`, color: 'text-violet-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Gráficas */}
      {!loadingStats && cotizaciones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Cotizaciones por mes */}
          <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Cotizaciones — últimos 6 meses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataMeses} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<TooltipMoneda />} />
                <Bar dataKey="Cotizaciones" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por estado */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Por estado</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={dataEstados} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                  dataKey="value" paddingAngle={3}>
                  {dataEstados.map(entry => (
                    <Cell key={entry.name} fill={ESTADO_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
              {dataEstados.map(e => (
                <div key={e.name} className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full" style={{ background: ESTADO_COLORS[e.name] }} />
                  {e.name} ({e.value})
                </div>
              ))}
            </div>
          </div>

          {/* Ingresos aprobados por mes */}
          <div className="md:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Ingresos aprobados — últimos 6 meses (Q)</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dataMeses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={55}
                  tickFormatter={v => `Q${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
                <Tooltip content={<TooltipMoneda />} />
                <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Accesos rápidos</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '+ Nueva cotización', path: '/cotizaciones',   color: 'bg-blue-600 text-white hover:bg-blue-700' },
            { label: '⚡ Nuevo corte',     path: '/optimizador',    color: 'bg-slate-800 text-white hover:bg-slate-700' },
            { label: '+ Nuevo cliente',    path: '/clientes',       color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
            { label: '📂 Historial',       path: '/optimizaciones', color: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`${item.color} rounded-xl px-4 py-3 text-sm font-medium transition shadow-sm text-center`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cotizaciones recientes */}
      {cotizaciones.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-600">Cotizaciones recientes</h3>
            <button onClick={() => navigate('/cotizaciones')} className="text-xs text-blue-600 hover:underline">
              Ver todas →
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['#','Cliente','Fecha','Total','Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cotizaciones.slice(0, 5).map(c => (
                  <tr key={c.id} onClick={() => navigate(`/cotizaciones/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition">
                    <td className="px-4 py-2.5 text-gray-400 text-xs">#{c.id}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{c.clienteNombre || `Cliente #${c.clienteId}`}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(c.fecha).toLocaleDateString('es-GT')}</td>
                    <td className="px-4 py-2.5 font-semibold text-gray-800">Q{Number(c.total).toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        { pendiente:'bg-amber-100 text-amber-700', aprobada:'bg-green-100 text-green-700',
                          rechazada:'bg-red-100 text-red-600', cancelada:'bg-gray-100 text-gray-500' }[c.estado] || 'bg-gray-100'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
