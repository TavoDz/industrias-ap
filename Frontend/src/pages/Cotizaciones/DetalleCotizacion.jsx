import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  cotizacionesService,
  piezasService,
  detalleHerrajesService,
  detalleServiciosService,
  materialesService,
  herrajesService,
  serviciosService
} from '../../services'

export default function DetalleCotizacion() {
  const { id }   = useParams()
  const navigate = useNavigate()

  const [cot,  setCot]  = useState(null)
  const [mats, setMats] = useState([])
  const [hers, setHers] = useState([])
  const [sers, setSers] = useState([])
  const [load, setLoad] = useState(true)
  const [err,  setErr]  = useState('')
  const [tab,  setTab]  = useState('piezas')

  const [fp, setFp] = useState({ nombrePieza: '', materialId: '', largo: '', ancho: '', cantidad: '', metroTapacanto: 0 })
  const [fh, setFh] = useState({ herrajeId: '', cantidad: '' })
  const [fs, setFs] = useState({ servicioId: '', cantidad: '' })

  const cargar = async () => {
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        cotizacionesService.obtenerCompleta(id),
        materialesService.obtenerTodos(),
        herrajesService.obtenerTodos(),
        serviciosService.obtenerTodos()
      ])
      setCot(r1.data)
      setMats(r2.data)
      setHers(r3.data)
      setSers(r4.data)
    } catch {
      setErr('Error al cargar')
    } finally {
      setLoad(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  const recalc = async () => {
    await cotizacionesService.recalcular(id)
    cargar()
  }

  const addPieza = async (e) => {
    e.preventDefault()
    try {
      await piezasService.crear({
        ...fp,
        cotizacionId:   parseInt(id),
        materialId:     parseInt(fp.materialId),
        largo:          parseFloat(fp.largo),
        ancho:          parseFloat(fp.ancho),
        cantidad:       parseInt(fp.cantidad),
        metroTapacanto: parseFloat(fp.metroTapacanto) || 0,
        costoMaterial:  0
      })
      setFp({ nombrePieza: '', materialId: '', largo: '', ancho: '', cantidad: '', metroTapacanto: 0 })
      await recalc()
    } catch {
      setErr('Error al agregar pieza')
    }
  }

  const addHerraje = async (e) => {
    e.preventDefault()
    try {
      await detalleHerrajesService.crear({
        cotizacionId:   parseInt(id),
        herrajeId:      parseInt(fh.herrajeId),
        cantidad:       parseInt(fh.cantidad),
        precioUnitario: 0,
        subtotal:       0
      })
      setFh({ herrajeId: '', cantidad: '' })
      cargar()
    } catch {
      setErr('Error al agregar herraje')
    }
  }

  const addServicio = async (e) => {
    e.preventDefault()
    try {
      await detalleServiciosService.crear({
        cotizacionId: parseInt(id),
        servicioId:   parseInt(fs.servicioId),
        cantidad:     parseInt(fs.cantidad),
        precio:       0,
        subtotal:     0
      })
      setFs({ servicioId: '', cantidad: '' })
      cargar()
    } catch {
      setErr('Error al agregar servicio')
    }
  }

  if (load) return <p className="text-sm text-gray-500 p-6">Cargando...</p>
  if (!cot) return <p className="text-sm text-red-500 p-6">Cotizacion no encontrada</p>

  return (
    <div>
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-3">
    <button onClick={() => navigate('/cotizaciones')} className="text-sm text-gray-500 hover:text-gray-700">
      &larr; Volver
    </button>
    <h2 className="text-xl font-semibold text-gray-800">Cotizacion #{cot.id}</h2>
    <span className="text-sm text-gray-500">— {cot.clienteNombre}</span>
  </div>
 <button onClick={() => navigate(`/cotizacion-pdf/${id}`)}
  className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition">
  Ver PDF
</button>
</div>

      {err && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{err}</div>}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['Materiales', cot.totalMateriales],
          ['Herrajes',   cot.totalHerrajes],
          ['Servicios',  cot.totalServicios],
          ['TOTAL',      cot.total]
        ].map(([l, v]) => (
          <div key={l} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{l}</p>
            <p className="text-lg font-semibold">Q{Number(v).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {['piezas', 'herrajes', 'servicios'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-medium capitalize transition ${
              tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'piezas' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={addPieza} className="grid grid-cols-6 gap-3 p-4 border-b bg-gray-50">
            {[['Pieza', 'nombrePieza'], ['Largo', 'largo'], ['Ancho', 'ancho'], ['Cant', 'cantidad']].map(([l, k]) => (
              <div key={k}>
                <label className="block text-xs text-gray-500 mb-1">{l}</label>
                <input value={fp[k]} onChange={e => setFp({ ...fp, [k]: e.target.value })}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Material</label>
              <select value={fp.materialId} onChange={e => setFp({ ...fp, materialId: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required>
                <option value="">...</option>
                {mats.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Pieza', 'Material', 'Largo', 'Ancho', 'Cant', 'Costo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!cot.piezas?.length
                ? <tr><td colSpan={7} className="text-center py-6 text-gray-400 text-sm">Sin piezas</td></tr>
                : cot.piezas.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{p.nombrePieza}</td>
                    <td className="px-4 py-2 text-gray-600">{p.materialNombre}</td>
                    <td className="px-4 py-2 text-gray-600">{p.largo}mm</td>
                    <td className="px-4 py-2 text-gray-600">{p.ancho}mm</td>
                    <td className="px-4 py-2 text-gray-600">{p.cantidad}</td>
                    <td className="px-4 py-2 font-medium">Q{Number(p.costoMaterial).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button onClick={async () => { await piezasService.eliminar(p.id); await recalc() }}
                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {tab === 'herrajes' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={addHerraje} className="grid grid-cols-3 gap-3 p-4 border-b bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Herraje</label>
              <select value={fh.herrajeId} onChange={e => setFh({ ...fh, herrajeId: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required>
                <option value="">...</option>
                {hers.map(h => <option key={h.id} value={h.id}>{h.nombre} — Q{h.precioUnitario}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={fh.cantidad} onChange={e => setFh({ ...fh, cantidad: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Herraje', 'Marca', 'Cantidad', 'Precio', 'Subtotal', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!cot.herrajes?.length
                ? <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Sin herrajes</td></tr>
                : cot.herrajes.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{h.herrajeNombre}</td>
                    <td className="px-4 py-2 text-gray-600">{h.herrajeMarca || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{h.cantidad}</td>
                    <td className="px-4 py-2 text-gray-600">Q{Number(h.precioUnitario).toFixed(2)}</td>
                    <td className="px-4 py-2 font-medium">Q{Number(h.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button onClick={async () => { await detalleHerrajesService.eliminar(h.id); cargar() }}
                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {tab === 'servicios' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <form onSubmit={addServicio} className="grid grid-cols-3 gap-3 p-4 border-b bg-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Servicio</label>
              <select value={fs.servicioId} onChange={e => setFs({ ...fs, servicioId: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required>
                <option value="">...</option>
                {sers.map(s => <option key={s.id} value={s.id}>{s.nombre} — Q{s.costo}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={fs.cantidad} onChange={e => setFs({ ...fs, cantidad: e.target.value })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-blue-600 text-white text-sm py-1.5 rounded">+ Agregar</button>
            </div>
          </form>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Servicio', 'Proveedor', 'Cantidad', 'Precio', 'Subtotal', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-gray-500 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!cot.servicios?.length
                ? <tr><td colSpan={6} className="text-center py-6 text-gray-400 text-sm">Sin servicios</td></tr>
                : cot.servicios.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{s.servicioNombre}</td>
                    <td className="px-4 py-2 text-gray-600">{s.servicioProveedor || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{s.cantidad}</td>
                    <td className="px-4 py-2 text-gray-600">Q{Number(s.precio).toFixed(2)}</td>
                    <td className="px-4 py-2 font-medium">Q{Number(s.subtotal).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <button onClick={async () => { await detalleServiciosService.eliminar(s.id); cargar() }}
                        className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
