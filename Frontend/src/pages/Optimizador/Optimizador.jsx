import { useEffect, useRef, useState } from 'react'
import { materialesService } from '../../services'
import api from '../../services/api'
import jsPDF from 'jspdf'

const colores = [
  '#93c5fd', '#86efac', '#fcd34d', '#f9a8d4', '#a5b4fc',
  '#6ee7b7', '#fca5a5', '#c4b5fd', '#67e8f9', '#fdba74'
]

const piezaVacia = () => ({
  cantidad: 1, largo: '', ancho: '', nombre: '',
  tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false,
  girar: false
})

function TapacantoEditor({ pieza, onChange }) {
  const t = { top: pieza.tapaL1, bottom: pieza.tapaL2, left: pieza.tapaA1, right: pieza.tapaA2 }
  const toggle = (lado) => {
    const map = { top: 'tapaL1', bottom: 'tapaL2', left: 'tapaA1', right: 'tapaA2' }
    onChange(map[lado], !pieza[map[lado]])
  }
  return (
    <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: '14px 28px 14px', gridTemplateRows: '14px 28px 14px', width: 56, height: 56 }}>
      <div />
      <button onClick={() => toggle('top')} title="Canto Superior"
        className={`rounded-sm transition-colors cursor-pointer ${t.top ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <div />
      <button onClick={() => toggle('left')} title="Canto Izquierdo"
        className={`rounded-sm transition-colors cursor-pointer ${t.left ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <div className="bg-gray-100 border border-gray-300 rounded-sm flex items-center justify-center">
        <span className="text-gray-400" style={{ fontSize: 7 }}>pieza</span>
      </div>
      <button onClick={() => toggle('right')} title="Canto Derecho"
        className={`rounded-sm transition-colors cursor-pointer ${t.right ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <div />
      <button onClick={() => toggle('bottom')} title="Canto Inferior"
        className={`rounded-sm transition-colors cursor-pointer ${t.bottom ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <div />
    </div>
  )
}

export default function Optimizador() {
  const [materiales, setMateriales] = useState([])
  const [materialId, setMaterialId] = useState('')
  const [piezas, setPiezas] = useState([piezaVacia()])
  const [resultado, setResultado] = useState(null)
  const [planchaActual, setPlanchaActual] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    materialesService.obtenerTodos().then(r => setMateriales(r.data)).catch(() => { })
  }, [])

  useEffect(() => {
    if (resultado) dibujarPlancha(planchaActual)
  }, [resultado, planchaActual])

  const set = (i, campo, valor) => {
    setPiezas(prev => {
      const n = [...prev]
      n[i] = { ...n[i], [campo]: valor }
      if (campo === 'nombre' && valor.length === 1 && i === prev.length - 1) {
        return [...n, piezaVacia()]
      }
      return n
    })
  }

  const eliminarFila = (i) => {
    if (piezas.length === 1) return
    setPiezas(piezas.filter((_, idx) => idx !== i))
  }

  const toggleGirarTodo = () => {
    const alguno = piezas.some(p => p.girar)
    setPiezas(piezas.map(p => ({ ...p, girar: !alguno })))
  }

  const limpiar = () => {
    setPiezas([piezaVacia()])
    setResultado(null)
    setMaterialId('')
    setError('')
  }

  const optimizar = async () => {
    if (!materialId) { setError('Selecciona un material'); return }
    const validas = piezas.filter(p => p.largo && p.ancho && p.nombre)
    if (validas.length === 0) { setError('Completa al menos una pieza con largo, ancho y nombre'); return }
    setLoading(true); setError('')
    try {
      const permitirRotar = validas.some(p => p.girar)
      const res = await api.post('/Optimizer', {
        materialId: parseInt(materialId),
        permitirRotar,
        piezas: validas.map(p => ({
          nombre: p.nombre,
          cantidad: parseInt(p.cantidad) || 1,
          largo: parseFloat(p.largo),
          ancho: parseFloat(p.ancho),
          tapacantoL1: p.tapaL1,
          tapacantoL2: p.tapaL2,
          tapacantoA1: p.tapaA1,
          tapacantoA2: p.tapaA2
        }))
      })
      setResultado(res.data)
      setPlanchaActual(0)
    } catch (e) {
      setError('Error al optimizar: ' + (e.response?.data || e.message))
    } finally {
      setLoading(false)
    }
  }

  const dibujarPlancha = (idx) => {
    if (!resultado || !canvasRef.current) return
    const plancha = resultado.planchas[idx]
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height, pad = 40
    const KERF = 3

    const planchaW = resultado.planchaLargo
    const planchaH = resultado.planchaAncho
    const escX = (W - pad * 2) / planchaW
    const escY = (H - pad * 2) / planchaH

    ctx.clearRect(0, 0, W, H)

    // Fondo con patrón rayado (sobrante)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2)
    ctx.save()
    ctx.beginPath()
    ctx.rect(pad, pad, W - pad * 2, H - pad * 2)
    ctx.clip()
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1
    for (let s = -H; s < W + H; s += 12) {
      ctx.beginPath(); ctx.moveTo(pad + s, pad); ctx.lineTo(pad + s + H, pad + H); ctx.stroke()
    }
    ctx.restore()

    // Borde plancha
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2
    ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2)

    // Piezas
    plancha.piezas.forEach((pieza, i) => {
      const x = pad + pieza.x * escX
      const y = pad + pieza.y * escY
      const w = pieza.largo * escX
      const h = pieza.ancho * escY
      const kerfX = KERF * escX
      const kerfY = KERF * escY

      // Fondo blanco (tapa rayado)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, w, h)

      // Color pieza
      ctx.fillStyle = colores[i % colores.length] + 'bb'
      ctx.fillRect(x, y, w, h)

      // Borde
      ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
      ctx.strokeRect(x, y, w, h)

      // Kerf derecho
      if (pieza.x + pieza.largo + KERF < planchaW) {
        ctx.fillStyle = '#fecaca99'
        ctx.fillRect(x + w, y, kerfX, h)
        ctx.setLineDash([3, 2])
        ctx.strokeStyle = '#f87171'; ctx.lineWidth = 0.8
        ctx.strokeRect(x + w, y, kerfX, h)
        ctx.setLineDash([])
      }

      // Kerf inferior
      if (pieza.y + pieza.ancho + KERF < planchaH) {
        ctx.fillStyle = '#fecaca99'
        ctx.fillRect(x, y + h, w, kerfY)
        ctx.setLineDash([3, 2])
        ctx.strokeStyle = '#f87171'; ctx.lineWidth = 0.8
        ctx.strokeRect(x, y + h, w, kerfY)
        ctx.setLineDash([])
      }

      // Tapacantos azul
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 3
      if (pieza.tapacantoL1) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke() }
      if (pieza.tapacantoL2) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke() }
      if (pieza.tapacantoA1) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke() }
      if (pieza.tapacantoA2) { ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke() }

      // Texto
      if (w > 30 && h > 20) {
        ctx.fillStyle = '#1e293b'
        ctx.font = `bold ${Math.max(9, Math.min(12, w / 7))}px monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(pieza.nombre + (pieza.rotada ? ' ↺' : ''), x + w / 2, y + h / 2 - 7)
        ctx.font = `${Math.max(8, Math.min(10, w / 8))}px monospace`
        ctx.fillStyle = '#64748b'
        ctx.fillText(`${pieza.largo}×${pieza.ancho}`, x + w / 2, y + h / 2 + 8)
      }
    })

    // Sobrantes — etiqueta con medidas
    if (plancha.sobrantes) {
      plancha.sobrantes.forEach(s => {
        const sx = pad + s.x * escX
        const sy = pad + s.y * escY
        const sw = s.largo * escX
        const sh = s.ancho * escY
        if (sw > 40 && sh > 14) {
          ctx.fillStyle = '#94a3b8cc'
          ctx.font = `italic 9px monospace`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`Sobrante ${s.largo}×${s.ancho}mm`, sx + sw / 2, sy + sh / 2)
        }
      })
    }

    // Dimensiones plancha
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
    ctx.fillText(`${planchaW} mm`, W / 2, pad - 10)
    ctx.save()
    ctx.translate(pad - 16, H / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${planchaH} mm`, 0, 0)
    ctx.restore()
  }

  const get = (obj, ...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return obj[k]
    return '—'
  }

  const exportarPDF = async () => {
    if (!resultado) return

    const pdf = new jsPDF('p', 'mm', 'a4')

    // HEADER
    pdf.setFontSize(16)
    pdf.text('Optimización de Corte', 10, 10)

    pdf.setFontSize(10)
    pdf.text(`Material: ${resultado.materialNombre}`, 10, 16)
    pdf.text(`Planchas: ${resultado.totalPlanchas}`, 10, 21)
    pdf.text(`Uso: ${resultado.porcentajeUso}%`, 10, 26)

    let y = 35

    // LISTADO
    resultado.planchas.forEach((plancha, idx) => {
      pdf.setFontSize(12)
      pdf.text(`Plancha ${idx + 1}`, 10, y)
      y += 5

      pdf.setFontSize(8)

      plancha.piezas.forEach(p => {
        pdf.text(`${p.nombre} ${p.largo}x${p.ancho}`, 10, y)
        y += 4

        if (y > 270) {
          pdf.addPage()
          y = 10
        }
      })

      y += 4
    })

    // VISUALES — una página por plancha con su imagen y sobrantes
    for (let i = 0; i < resultado.planchas.length; i++) {
      setPlanchaActual(i)
      await new Promise(r => setTimeout(r, 300))

      const canvas = canvasRef.current
      const img = canvas.toDataURL('image/png')

      pdf.addPage()
      pdf.setFontSize(10)
      pdf.text(`Plancha ${i + 1}`, 10, 10)
      pdf.addImage(img, 'PNG', 10, 20, 190, 110)

      const sobrantes = resultado.planchas[i].sobrantes || []

      let y2 = 140
      pdf.text('Sobrantes:', 10, y2)
      y2 += 5

      sobrantes.forEach(s => {
        pdf.text(`${s.largo}x${s.ancho} mm`, 10, y2)
        y2 += 4
      })
    }

    pdf.save('optimizacion.pdf')
  }

  const guardarOptimizacion = async () => {
    if (!resultado) {
      alert('Primero optimiza');
      return;
    }

    try {
      const payload = {
        nombre: "Optimización",
        materialNombre: materiales.find(m => m.id == materialId)?.nombre || "Material",
        resultado: resultado
      };

      console.log("ENVIANDO:", payload); // 🔍 debug

      const res = await api.post('/optimizer/guardar', payload);

      alert("Guardado ID: " + res.data.id);
    } catch (err) {
      console.error("ERROR COMPLETO:", err.response?.data || err.message);
      alert("Error al guardar");
    }
  };

  const cargarOptimizacion = async (id) => {
    const res = await api.get('/optimizer/' + id);
    setResultado(res.data.resultado);
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-800">Optimizador de cortes</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Guillotine 2D · Kerf 3mm</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={limpiar}
            className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition">
            Limpiar
          </button>
          <button onClick={toggleGirarTodo}
            className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 transition">
            ↺ Girar todo
          </button>
          {resultado && (
            <>
              <button onClick={guardarOptimizacion}
                className="text-xs bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 transition font-medium">
                💾 Guardar
              </button>
              <button onClick={exportarPDF}
                className="text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded hover:bg-red-50 transition font-medium">
                📄 Exportar PDF
              </button>
            </>
          )}
          <button onClick={optimizar} disabled={loading}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {loading ? 'Calculando...' : '⚡ Optimizar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="p-6 space-y-4">

        {/* Material */}
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-6">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Material</label>
          <select value={materialId} onChange={e => setMaterialId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64">
            <option value="">Seleccionar material...</option>
            {materiales.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} ({m.largo}×{m.ancho} mm)</option>
            ))}
          </select>
          <div className="ml-auto flex items-center gap-5 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><span className="inline-block w-6 h-0.5 bg-blue-500"></span> Tapacanto</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-2 bg-red-200 border border-red-300 rounded-sm"></span> Kerf (3mm)</span>
            <span>↺ = rotada</span>
          </div>
        </div>

        {/* Tabla piezas */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 w-8">#</th>
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-20">Cantidad</th>
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-24">Largo (mm)</th>
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-24">Ancho (mm)</th>
                <th className="text-left px-2 py-2 text-xs font-medium text-gray-500">Descripción</th>
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-16">
                  <button onClick={toggleGirarTodo} title="Activar/desactivar girar en todas"
                    className="hover:text-blue-600 transition">Girar ↺</button>
                </th>
                <th className="text-center px-2 py-2 text-xs font-medium text-gray-500 w-20">Tapacanto</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {piezas.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-1.5 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-2 py-1.5">
                    <input type="number" min="1" value={p.cantidad}
                      onChange={e => set(i, 'cantidad', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={p.largo} placeholder="0"
                      onChange={e => set(i, 'largo', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={p.ancho} placeholder="0"
                      onChange={e => set(i, 'ancho', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="text" value={p.nombre} placeholder="Ej: frente de cajón"
                      onChange={e => set(i, 'nombre', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <input type="checkbox" checked={p.girar}
                      onChange={e => set(i, 'girar', e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-2 py-1.5 flex justify-center">
                    <TapacantoEditor pieza={p} onChange={(campo, val) => set(i, campo, val)} />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {piezas.length > 1 && (
                      <button onClick={() => eliminarFila(i)}
                        className="text-gray-300 hover:text-red-500 transition text-lg leading-none">×</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button onClick={() => setPiezas([...piezas, piezaVacia()])}
              className="text-xs text-blue-600 hover:underline font-medium">+ Agregar fila</button>
            <span className="text-xs text-gray-400">
              {piezas.filter(p => p.nombre).length} pieza(s) — Kerf 3mm incluido en cada corte
            </span>
          </div>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-6 gap-3">
              {[
                ['Planchas', resultado.totalPlanchas, 'text-blue-700'],
                ['Uso', resultado.porcentajeUso + '%', 'text-green-700'],
                ['Desperdicio', resultado.porcentajeDesperdicio + '%', 'text-orange-600'],
                ['ML Corte', get(resultado, 'metrosLinealesCorte', 'MetrosLinealesCorte') + ' m', 'text-gray-700'],
                ['ML Tapacanto', get(resultado, 'metrosLinealesTapacanto', 'MetrosLinealesTapacanto') + ' m', 'text-purple-700'],
                ['Material', resultado.materialNombre, 'text-gray-600'],
              ].map(([l, v, cls]) => (
                <div key={l} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-400 mb-1">{l}</p>
                  <p className={`text-base font-bold ${cls}`}>{v}</p>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Plancha {planchaActual + 1} / {resultado.totalPlanchas}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    {resultado.planchas[planchaActual].porcentajeUso}% usado
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: resultado.totalPlanchas }, (_, i) => (
                    <button key={i} onClick={() => setPlanchaActual(i)}
                      className={`w-7 h-7 text-xs rounded border transition ${i === planchaActual
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}>{i + 1}</button>
                  ))}
                </div>
              </div>
              <canvas ref={canvasRef} width={920} height={500}
                className="w-full border border-gray-100 rounded bg-gray-50" />
              <div className="mt-2 flex items-center gap-5 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="inline-block w-6 h-0.5 bg-blue-500"></span> Tapacanto</span>
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-2 bg-red-200 border border-dashed border-red-300 rounded-sm"></span> Kerf sierra</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#e2e8f0 0,#e2e8f0 1px,transparent 0,transparent 50%)', backgroundSize: '6px 6px', backgroundColor: '#f8fafc' }}></span> Sobrante
                </span>
                <span>↺ = rotada</span>
              </div>
            </div>

            {/* Sobrantes */}
            {resultado.planchas[planchaActual].sobrantes?.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 border-b border-amber-100 bg-amber-50">
                  <p className="text-xs font-medium text-amber-700">Sobrantes — Plancha {planchaActual + 1}</p>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['#', 'Largo (mm)', 'Ancho (mm)', 'Área (mm²)', 'Área (m²)'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultado.planchas[planchaActual].sobrantes.map((s, i) => (
                      <tr key={i} className="hover:bg-amber-50">
                        <td className="px-4 py-1.5 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-1.5 font-medium">{s.largo}</td>
                        <td className="px-4 py-1.5 font-medium">{s.ancho}</td>
                        <td className="px-4 py-1.5 text-gray-500">{(s.largo * s.ancho).toLocaleString()}</td>
                        <td className="px-4 py-1.5 text-gray-500">{((s.largo * s.ancho) / 1_000_000).toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Detalle piezas */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-medium text-gray-600">Detalle — Plancha {planchaActual + 1}</p>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['', 'Nombre', 'Largo', 'Ancho', 'Pos. X', 'Pos. Y', 'Rotada', 'Tapacanto'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {resultado.planchas[planchaActual].piezas.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5">
                        <span className="inline-block w-3 h-3 rounded-sm border border-gray-200"
                          style={{ backgroundColor: colores[i % colores.length] }} />
                      </td>
                      <td className="px-3 py-1.5 font-medium text-gray-800">{p.nombre}</td>
                      <td className="px-3 py-1.5 text-gray-500">{p.largo} mm</td>
                      <td className="px-3 py-1.5 text-gray-500">{p.ancho} mm</td>
                      <td className="px-3 py-1.5 text-gray-400">{p.x}</td>
                      <td className="px-3 py-1.5 text-gray-400">{p.y}</td>
                      <td className="px-3 py-1.5">{p.rotada ? <span className="text-blue-600">↺ Sí</span> : <span className="text-gray-400">No</span>}</td>
                      <td className="px-3 py-1.5 text-blue-600 font-medium">
                        {[p.tapacantoL1 && '▲', p.tapacantoL2 && '▼', p.tapacantoA1 && '◄', p.tapacantoA2 && '►'].filter(Boolean).join(' ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {!resultado && (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Completa la tabla y haz clic en</p>
              <p className="text-gray-600 font-medium mt-1">⚡ Optimizar</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
