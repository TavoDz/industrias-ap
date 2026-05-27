import { useState, useRef, useEffect, useCallback } from 'react'

const API = 'http://localhost:5244/api'
const getToken = () => localStorage.getItem('token') ?? ''

// ── Canvas renderer ──────────────────────────────────────────────────────────

const PIECE_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#f97316','#eab308',
  '#06b6d4','#10b981','#f43f5e','#6366f1','#a855f7',
  '#14b8a6','#fb923c','#e879f9','#34d399','#60a5fa',
]

function BoardCanvas({ board, boardW, boardH, showFree, showCuts, showLabels }) {
  const canvasRef = useRef(null)
  const [zoom, setZoom]     = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(null)

  const BASE_W = 680
  const scale  = BASE_W / boardW

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const dpr  = window.devicePixelRatio || 1
    const W    = BASE_W
    const H    = Math.round(boardH * scale)

    canvas.width        = W * dpr
    canvas.height       = H * dpr
    canvas.style.width  = W + 'px'
    canvas.style.height = H + 'px'
    ctx.scale(dpr, dpr)

    // Apply zoom/pan transform
    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(zoom, zoom)

    const S = scale  // board → canvas pixels

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Grid (every 200mm)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let x = 0; x < boardW; x += 200) {
      ctx.beginPath(); ctx.moveTo(x*S, 0); ctx.lineTo(x*S, H); ctx.stroke()
    }
    for (let y = 0; y < boardH; y += 200) {
      ctx.beginPath(); ctx.moveTo(0, y*S); ctx.lineTo(W, y*S); ctx.stroke()
    }

    // Free spaces
    if (showFree) {
      board.freeSpaces?.forEach(fs => {
        ctx.fillStyle   = 'rgba(16, 185, 129, 0.12)'
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
        ctx.lineWidth   = 0.8
        ctx.fillRect(fs.x*S, fs.y*S, fs.width*S, fs.height*S)
        ctx.strokeRect(fs.x*S, fs.y*S, fs.width*S, fs.height*S)
        // Label free space size
        if (fs.width*S > 60 && fs.height*S > 25) {
          ctx.fillStyle = 'rgba(16,185,129,0.7)'
          ctx.font = `${Math.min(9, fs.width*S/12)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(`${Math.round(fs.width)}×${Math.round(fs.height)}`, fs.x*S + fs.width*S/2, fs.y*S + fs.height*S/2)
        }
      })
    }

    // Pieces
    board.pieces?.forEach((p, i) => {
      const color = PIECE_COLORS[i % PIECE_COLORS.length]
      const x = p.x*S, y = p.y*S, w = p.width*S, h = p.height*S

      // Shadow
      ctx.shadowColor   = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur    = 4
      ctx.shadowOffsetX = 1
      ctx.shadowOffsetY = 1

      // Fill with gradient
      const grad = ctx.createLinearGradient(x, y, x + w, y + h)
      grad.addColorStop(0, color + 'ee')
      grad.addColorStop(1, color + '99')
      ctx.fillStyle = grad
      ctx.fillRect(x, y, w, h)

      ctx.shadowColor = 'transparent'
      ctx.shadowBlur  = 0

      // Border
      ctx.strokeStyle = color
      ctx.lineWidth   = 1.5
      ctx.strokeRect(x, y, w, h)

      // Grain direction indicator (diagonal line)
      if (p.grain_direction || p.grainDirection) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.beginPath(); ctx.moveTo(x+4, y+4); ctx.lineTo(x+w-4, y+4); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x+4, y+h/2); ctx.lineTo(x+w-4, y+h/2); ctx.stroke()
        ctx.setLineDash([])
      }

      // Edge banding indicators
      ctx.lineWidth = 3
      if (p.edgeTop    || p.edge_top)    { ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.stroke() }
      if (p.edgeBottom || p.edge_bottom) { ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x,y+h); ctx.lineTo(x+w,y+h); ctx.stroke() }
      if (p.edgeLeft   || p.edge_left)   { ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+h); ctx.stroke() }
      if (p.edgeRight  || p.edge_right)  { ctx.strokeStyle = '#fbbf24'; ctx.beginPath(); ctx.moveTo(x+w,y); ctx.lineTo(x+w,y+h); ctx.stroke() }

      // Label
      if (showLabels && w > 28 && h > 16) {
        const fs = Math.min(10, w / 7, h / 3)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.font = `bold ${fs}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name
        ctx.fillText(label, x + w/2, y + h/2 - (fs > 7 ? 4 : 0))
        if (fs > 7) {
          ctx.font = `${fs - 2}px monospace`
          ctx.fillStyle = 'rgba(255,255,255,0.6)'
          ctx.fillText(`${Math.round(p.originalWidth||p.width)}×${Math.round(p.originalHeight||p.height)}`, x + w/2, y + h/2 + 5)
        }
      }

      // Rotation indicator
      if (p.rotated && w > 16 && h > 16) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font      = `${Math.min(9,w/5)}px sans-serif`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'top'
        ctx.fillText('↻', x + w - 2, y + 2)
      }
    })

    // Cut lines
    if (showCuts) {
      board.cutLines?.forEach(cl => {
        ctx.strokeStyle = cl.direction === 'H' ? 'rgba(239,68,68,0.6)' : 'rgba(251,146,60,0.6)'
        ctx.lineWidth = 0.7
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(cl.x1*S, cl.y1*S)
        ctx.lineTo(cl.x2*S, cl.y2*S)
        ctx.stroke()
        ctx.setLineDash([])
      })
    }

    // Board border
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, 0, W, H)

    // Rulers (mm ticks every 200mm)
    ctx.fillStyle = 'rgba(148,163,184,0.6)'
    ctx.font = '7px monospace'
    ctx.textAlign = 'center'
    for (let x = 0; x <= boardW; x += 200) {
      ctx.fillText(x, x*S, H - 2)
    }

    ctx.restore()
  }, [board, boardW, boardH, showFree, showCuts, showLabels, zoom, offset, scale])

  useEffect(() => { draw() }, [draw])

  const handleWheel = (e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.15 : 0.87
    setZoom(z => Math.min(Math.max(z * factor, 0.4), 6))
  }

  const handleMouseDown = (e) => {
    dragging.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
  }

  const handleMouseMove = (e) => {
    if (!dragging.current) return
    setOffset({ x: e.clientX - dragging.current.x, y: e.clientY - dragging.current.y })
  }

  const handleMouseUp = () => { dragging.current = null }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ cursor: 'grab', display: 'block' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-2 right-2 flex gap-1.5">
        <button onClick={() => { setZoom(1); setOffset({x:0,y:0}) }}
          className="bg-slate-800/80 text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-700">
          Reset
        </button>
        <button onClick={() => setZoom(z => Math.min(z*1.3, 6))}
          className="bg-slate-800/80 text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-700">+</button>
        <button onClick={() => setZoom(z => Math.max(z*0.77, 0.4))}
          className="bg-slate-800/80 text-slate-300 text-xs px-2 py-1 rounded hover:bg-slate-700">−</button>
      </div>
      <div className="absolute top-2 left-2 text-[10px] text-slate-500 pointer-events-none">
        {Math.round(boardW)}×{Math.round(boardH)}mm · Zoom {zoom.toFixed(1)}x
      </div>
    </div>
  )
}

// ── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = 'blue', big = false }) {
  const colors = {
    blue:   'border-blue-500/30 bg-blue-950/40 text-blue-300',
    green:  'border-green-500/30 bg-green-950/40 text-green-300',
    red:    'border-red-500/30 bg-red-950/40 text-red-300',
    yellow: 'border-yellow-500/30 bg-yellow-950/40 text-yellow-300',
    purple: 'border-purple-500/30 bg-purple-950/40 text-purple-300',
    slate:  'border-slate-600/30 bg-slate-800/40 text-slate-300',
  }
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">{label}</p>
      <p className={`font-bold ${big ? 'text-2xl' : 'text-xl'}`}>{value}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Edge banding selector ────────────────────────────────────────────────────

function EdgeBandingSelector({ value, onChange }) {
  const sides = [
    { key: 'top',    label: 'S', title: 'Superior' },
    { key: 'bottom', label: 'I', title: 'Inferior' },
    { key: 'left',   label: 'L', title: 'Izquierda' },
    { key: 'right',  label: 'R', title: 'Derecha' },
  ]
  return (
    <div className="flex gap-1">
      {sides.map(s => (
        <button
          key={s.key}
          title={s.title}
          type="button"
          onClick={() => onChange({ ...value, [s.key]: !value[s.key] })}
          className={`w-6 h-6 rounded text-xs font-bold border transition ${
            value[s.key]
              ? 'bg-yellow-500 text-black border-yellow-400'
              : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
          }`}>
          {s.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

const DEFAULT_BOARD = { w: 2440, h: 1220, kerf: 3, timeLimit: 45 }
const EMPTY_PIECE = { name: '', width: 600, height: 400, quantity: 1, canRotate: true, grainDirection: false, edge: { top: false, bottom: false, left: false, right: false } }

export default function OptimizadorAvanzado() {
  const [board, setBoard]   = useState(DEFAULT_BOARD)
  const [pieces, setPieces] = useState([{ ...EMPTY_PIECE, id: 1 }])
  const [nextId, setNextId] = useState(2)

  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')
  const [activeBoard, setActive] = useState(0)

  const [showFree,   setShowFree]   = useState(true)
  const [showCuts,   setShowCuts]   = useState(true)
  const [showLabels, setShowLabels] = useState(true)

  // ── Piece management ────────────────────────────────────────────────────────
  const addPiece = () => {
    setPieces(p => [...p, { ...EMPTY_PIECE, id: nextId }])
    setNextId(n => n + 1)
  }

  const removePiece = (id) => setPieces(p => p.filter(x => x.id !== id))

  const updatePiece = (id, field, val) =>
    setPieces(p => p.map(x => x.id === id ? { ...x, [field]: val } : x))

  const updateEdge = (id, edge) =>
    setPieces(p => p.map(x => x.id === id ? { ...x, edge } : x))

  // ── Lepton JSON import ──────────────────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        // Formato externo (placa + cortes)
        if (data.placa && data.cortes) {
          const hasGrain = data.placa.veta ?? false
          setBoard(b => ({
            ...b,
            w: data.placa.base ?? b.w,
            h: data.placa.altura ?? b.h,
          }))
          const imported = data.cortes.map((c, i) => {
            const flags = c.tapacantos ?? 0
            return {
              id: Date.now() + i,
              name: c.descripcion || `Pieza ${i+1}`,
              width: c.base,
              height: c.altura,
              quantity: c.cantidad ?? 1,
              canRotate: !hasGrain,
              grainDirection: hasGrain,
              edge: {
                top:    Boolean(flags & 1),
                bottom: Boolean(flags & 2),
                left:   Boolean(flags & 4),
                right:  Boolean(flags & 8),
              }
            }
          })
          setPieces(imported)
        // Formato Lepton interno (settings + parts)
        } else if (data.settings && data.parts) {
          setBoard(b => ({
            ...b,
            kerf: data.settings.blade_thickness ?? b.kerf,
          }))
          const imported = data.parts.map((p, i) => {
            const flags = p.edge_banding ?? 0
            return {
              id: Date.now() + i,
              name: p.label || p.name || `Pieza ${i+1}`,
              width: p.width,
              height: p.height,
              quantity: p.quantity ?? 1,
              canRotate: p.can_rotate ?? true,
              grainDirection: p.grain_direction ?? false,
              edge: {
                top:    Boolean(flags & 1),
                bottom: Boolean(flags & 2),
                left:   Boolean(flags & 4),
                right:  Boolean(flags & 8),
              }
            }
          })
          setPieces(imported)
          if (data.materials?.[0]) {
            setBoard(b => ({
              ...b,
              w: data.materials[0].width ?? b.w,
              h: data.materials[0].height ?? b.h,
            }))
          }
        } else {
          setError('Formato JSON no reconocido.')
        }
      } catch {
        setError('Error al parsear el archivo JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  // ── Export result JSON ──────────────────────────────────────────────────────
  const handleExport = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `optimizacion_avanzada_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Run optimization ────────────────────────────────────────────────────────
  const handleRun = async () => {
    setError('')
    setResult(null)
    setRunning(true)
    setActive(0)

    const reqPieces = pieces.map(p => ({
      id: String(p.id),
      name: p.name || 'Sin nombre',
      width: Number(p.width),
      height: Number(p.height),
      quantity: Number(p.quantity),
      canRotate: p.canRotate,
      grainDirection: p.grainDirection,
      edgeTop: p.edge.top,
      edgeBottom: p.edge.bottom,
      edgeLeft: p.edge.left,
      edgeRight: p.edge.right,
      edgeFlags: 0,
    }))

    try {
      const res = await fetch(`${API}/AdvancedOptimizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          boardW: Number(board.w),
          boardH: Number(board.h),
          kerf: Number(board.kerf),
          timeLimit: Number(board.timeLimit),
          pieces: reqPieces,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || data.detail || `Error ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const currentBoard = result?.boards?.[activeBoard]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Optimizador Avanzado</h1>
            <p className="text-xs text-slate-500">Motor industrial · 13 algoritmos · GA + Compaction · Lepton compatible</p>
          </div>
          <div className="ml-auto flex gap-2">
            <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition">
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              Importar JSON
            </label>
            {result && (
              <button onClick={handleExport}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition">
                Exportar JSON
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* ── Left panel: Config ─────────────────────────────────────────────── */}
        <div className="w-80 shrink-0 space-y-4">

          {/* Board config */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Tablero</h2>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Largo (mm)</label>
                <input type="number" value={board.w}
                  onChange={e => setBoard(b => ({ ...b, w: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Ancho (mm)</label>
                <input type="number" value={board.h}
                  onChange={e => setBoard(b => ({ ...b, h: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Kerf (mm)</label>
                <input type="number" step="0.5" value={board.kerf}
                  onChange={e => setBoard(b => ({ ...b, kerf: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Tiempo límite (s)</label>
                <input type="number" min="10" max="180" value={board.timeLimit}
                  onChange={e => setBoard(b => ({ ...b, timeLimit: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Pieces */}
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Piezas ({pieces.length})</h2>
              <button onClick={addPiece}
                className="text-xs px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition">
                + Agregar
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {pieces.map((p, idx) => (
                <div key={p.id} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                    <button onClick={() => removePiece(p.id)}
                      className="text-slate-600 hover:text-red-400 text-xs transition">✕</button>
                  </div>

                  <input
                    type="text" placeholder="Nombre de la pieza"
                    value={p.name}
                    onChange={e => updatePiece(p.id, 'name', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 mb-2 focus:outline-none focus:border-blue-500"
                  />

                  <div className="grid grid-cols-3 gap-1.5 mb-2">
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Largo</label>
                      <input type="number" value={p.width}
                        onChange={e => updatePiece(p.id, 'width', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Ancho</label>
                      <input type="number" value={p.height}
                        onChange={e => updatePiece(p.id, 'height', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 block mb-0.5">Cant.</label>
                      <input type="number" min="1" value={p.quantity}
                        onChange={e => updatePiece(p.id, 'quantity', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={p.canRotate}
                        onChange={e => updatePiece(p.id, 'canRotate', e.target.checked)}
                        className="rounded" />
                      Rotar
                    </label>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
                      <input type="checkbox" checked={p.grainDirection}
                        onChange={e => updatePiece(p.id, 'grainDirection', e.target.checked)}
                        className="rounded" />
                      Veta
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500">Tapac.</span>
                    <EdgeBandingSelector value={p.edge} onChange={edge => updateEdge(p.id, edge)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={handleRun}
            disabled={running || pieces.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg">
            {running
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10"/>
                  </svg>
                  Optimizando…
                </span>
              : 'Optimizar'}
          </button>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-3 text-xs text-red-300">
              {error}
            </div>
          )}
        </div>

        {/* ── Right panel: Results ──────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {!result && !running && (
            <div className="h-full flex items-center justify-center text-slate-600">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
                <p className="text-sm">Configura tus piezas y ejecuta la optimización</p>
                <p className="text-xs mt-1 opacity-60">13 algoritmos · Algoritmo genético · Compactación de tableros</p>
              </div>
            </div>
          )}

          {running && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"/>
                  <div className="absolute inset-0 border-4 border-transparent border-t-violet-500 rounded-full animate-spin"/>
                  <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection:'reverse',animationDuration:'0.7s'}}/>
                </div>
                <p className="text-slate-300 font-medium">Ejecutando motor industrial…</p>
                <p className="text-xs text-slate-500 mt-1">MaxRects · Guillotine · Skyline · Shelf · GA · Compaction</p>
                <p className="text-xs text-slate-600 mt-0.5">Esto puede tomar hasta {board.timeLimit}s</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
                <MetricCard label="Tableros" value={result.boardsUsed} color="purple" big />
                <MetricCard label="Eficiencia" value={`${result.efficiencyPercent}%`} color="green" />
                <MetricCard label="Desperdicio" value={`${result.wastePercent}%`} color="red" />
                <MetricCard label="Cortes" value={result.totalCuts} sub={`${result.cutMeters}m lineales`} color="yellow" />
                <MetricCard label="Sobrantes" value={result.reusableOffcuts} sub="reutilizables" color="blue" />
                <MetricCard label="Score" value={result.score?.toFixed(4)} sub={`${result.passesRun} pasadas`} color="slate" />
              </div>

              {/* Algorithm badge */}
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Algoritmo usado</p>
                  <p className="text-xs text-slate-300 font-mono truncate">{result.algorithm}</p>
                </div>
                <div className="ml-auto shrink-0 text-right">
                  <p className="text-[10px] text-slate-500">Tiempo</p>
                  <p className="text-sm font-bold text-slate-200">{result.timeMs}ms</p>
                </div>
              </div>

              {/* Board tabs */}
              {result.boards.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                  {result.boards.map((b, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        activeBoard === i
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}>
                      Tablero {b.number}
                      <span className="ml-1.5 opacity-70">{b.efficiency?.toFixed(1)}%</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Canvas */}
              {currentBoard && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">
                      Tablero {currentBoard.number} — {currentBoard.efficiency?.toFixed(1)}% eficiencia · {currentBoard.pieces.length} piezas
                    </span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={showFree} onChange={e => setShowFree(e.target.checked)} />
                        Sobrantes
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={showCuts} onChange={e => setShowCuts(e.target.checked)} />
                        Cortes
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={showLabels} onChange={e => setShowLabels(e.target.checked)} />
                        Etiquetas
                      </label>
                    </div>
                  </div>
                  <div className="p-3">
                    <BoardCanvas
                      board={currentBoard}
                      boardW={Number(board.w)}
                      boardH={Number(board.h)}
                      showFree={showFree}
                      showCuts={showCuts}
                      showLabels={showLabels}
                    />
                  </div>
                  {/* Legend */}
                  <div className="px-4 pb-3 flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block"/>Corte H</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block"/>Corte V</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500/20 border border-green-500/40 inline-block rounded-sm"/>Sobrante</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block"/>Tapacanto</span>
                    <span className="flex items-center gap-1">↻ Rotada</span>
                  </div>
                </div>
              )}

              {/* Cut lines table */}
              {currentBoard?.cutLines?.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">
                      Secuencia de cortes — {currentBoard.cutLines.length} cortes
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-52 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-800 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-1.5 text-slate-400 font-medium">#</th>
                          <th className="text-left px-3 py-1.5 text-slate-400 font-medium">Dir</th>
                          <th className="text-left px-3 py-1.5 text-slate-400 font-medium">Desde</th>
                          <th className="text-left px-3 py-1.5 text-slate-400 font-medium">Hasta</th>
                          <th className="text-right px-3 py-1.5 text-slate-400 font-medium">Long (mm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBoard.cutLines.map(cl => (
                          <tr key={cl.sequence} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-3 py-1 text-slate-500 font-mono">{cl.sequence}</td>
                            <td className="px-3 py-1">
                              <span className={`font-bold ${cl.direction === 'H' ? 'text-red-400' : 'text-orange-400'}`}>
                                {cl.direction === 'H' ? '— H' : '| V'}
                              </span>
                            </td>
                            <td className="px-3 py-1 text-slate-400 font-mono">
                              {Math.round(cl.x1)},{Math.round(cl.y1)}
                            </td>
                            <td className="px-3 py-1 text-slate-400 font-mono">
                              {Math.round(cl.x2)},{Math.round(cl.y2)}
                            </td>
                            <td className="px-3 py-1 text-right text-slate-300 font-mono">{Math.round(cl.length)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Free spaces */}
              {currentBoard?.freeSpaces?.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="px-4 py-2 border-b border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">
                      Sobrantes reutilizables — {currentBoard.freeSpaces.length} espacios
                    </span>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {currentBoard.freeSpaces.map((fs, i) => (
                      <div key={i} className="bg-green-950/30 border border-green-800/30 rounded-lg p-2 text-center">
                        <p className="text-xs font-bold text-green-300">
                          {Math.round(fs.width)} × {Math.round(fs.height)}
                        </p>
                        <p className="text-[10px] text-green-700 mt-0.5">
                          {(fs.area / 1000000).toFixed(4)} m²
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
