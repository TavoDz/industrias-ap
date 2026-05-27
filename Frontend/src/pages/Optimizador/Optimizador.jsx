import { useEffect, useRef, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  materialesService, optimizacionesService,
  tapacantosService, clientesService,
  cotizacionesService, piezasService
} from '../../services'

const colores = [
  '#93c5fd', '#86efac', '#fcd34d', '#f9a8d4', '#a5b4fc',
  '#6ee7b7', '#fca5a5', '#c4b5fd', '#67e8f9', '#fdba74'
]

const PLANTILLAS = [
  {
    nombre: 'Closet 2 puertas',
    descripcion: 'Closet básico 1.20m × 2.0m',
    piezas: [
      { nombre: 'Lateral',       largo: 1800, ancho: 560,  cantidad: 2, tapaL1: false, tapaL2: false, tapaA1: true,  tapaA2: false, tapacantoId: '' },
      { nombre: 'Tope superior', largo: 1164, ancho: 560,  cantidad: 1, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Fondo',         largo: 1164, ancho: 1800, cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Entrepaño',     largo: 1164, ancho: 560,  cantidad: 2, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Puerta',        largo: 1900, ancho: 600,  cantidad: 2, tapaL1: true,  tapaL2: true,  tapaA1: true,  tapaA2: true,  tapacantoId: '' },
      { nombre: 'Base',          largo: 1200, ancho: 560,  cantidad: 1, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
    ],
  },
  {
    nombre: 'Cocina básica',
    descripcion: 'Mueble bajo de cocina 1.80m',
    piezas: [
      { nombre: 'Lateral',      largo: 720,  ancho: 560, cantidad: 2, tapaL1: false, tapaL2: false, tapaA1: true,  tapaA2: false, tapacantoId: '' },
      { nombre: 'Fondo',        largo: 1764, ancho: 720, cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Base',         largo: 1800, ancho: 560, cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Entrepaño',    largo: 1764, ancho: 560, cantidad: 1, tapaL1: false, tapaL2: true,  tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Frente cajón', largo: 440,  ancho: 180, cantidad: 4, tapaL1: true,  tapaL2: true,  tapaA1: true,  tapaA2: true,  tapacantoId: '' },
      { nombre: 'Puerta',       largo: 680,  ancho: 440, cantidad: 2, tapaL1: true,  tapaL2: true,  tapaA1: true,  tapaA2: true,  tapacantoId: '' },
    ],
  },
  {
    nombre: 'Ropero sencillo',
    descripcion: 'Ropero 90cm × 1.80m sin puertas',
    piezas: [
      { nombre: 'Lateral',   largo: 1800, ancho: 500,  cantidad: 2, tapaL1: false, tapaL2: false, tapaA1: true,  tapaA2: false, tapacantoId: '' },
      { nombre: 'Tope',      largo: 864,  ancho: 500,  cantidad: 1, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Base',      largo: 900,  ancho: 500,  cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Fondo',     largo: 864,  ancho: 1800, cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Entrepaño', largo: 864,  ancho: 500,  cantidad: 3, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
    ],
  },
  {
    nombre: 'Mueble TV',
    descripcion: 'Rack para TV 1.50m × 50cm',
    piezas: [
      { nombre: 'Lateral',     largo: 500,  ancho: 450, cantidad: 2, tapaL1: false, tapaL2: false, tapaA1: true,  tapaA2: false, tapacantoId: '' },
      { nombre: 'Tope/Base',   largo: 1464, ancho: 450, cantidad: 2, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Entrepaño',   largo: 1464, ancho: 450, cantidad: 1, tapaL1: true,  tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
      { nombre: 'Puerta peq.', largo: 460,  ancho: 320, cantidad: 2, tapaL1: true,  tapaL2: true,  tapaA1: true,  tapaA2: true,  tapacantoId: '' },
      { nombre: 'Fondo',       largo: 1464, ancho: 500, cantidad: 1, tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false, tapacantoId: '' },
    ],
  },
]

const piezaVacia = () => ({
  cantidad: 1, largo: '', ancho: '', nombre: '',
  tapaL1: false, tapaL2: false, tapaA1: false, tapaA2: false,
  girar: false, tapacantoId: ''
})

function TapacantoEditor({ pieza, onChange }) {
  const t = { top: pieza.tapaL1, bottom: pieza.tapaL2, left: pieza.tapaA1, right: pieza.tapaA2 }
  const toggle = (lado) => {
    const map = { top: 'tapaL1', bottom: 'tapaL2', left: 'tapaA1', right: 'tapaA2' }
    onChange(map[lado], !pieza[map[lado]])
  }
  const toggleAll = () => {
    const allOn = t.top && t.bottom && t.left && t.right
    onChange({ tapaL1: !allOn, tapaL2: !allOn, tapaA1: !allOn, tapaA2: !allOn })
  }
  return (
    <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: '14px 28px 14px', gridTemplateRows: '14px 28px 14px', width: 56, height: 56 }}>
      <div />
      <button onClick={() => toggle('top')} title="Canto Superior"
        className={`rounded-sm transition-colors cursor-pointer ${t.top ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <div />
      <button onClick={() => toggle('left')} title="Canto Izquierdo"
        className={`rounded-sm transition-colors cursor-pointer ${t.left ? 'bg-blue-500' : 'bg-gray-200 hover:bg-blue-200'}`} />
      <button onClick={toggleAll} title="Todos los cantos"
        className={`rounded-sm transition-colors cursor-pointer border flex items-center justify-center ${
          t.top && t.bottom && t.left && t.right
            ? 'bg-blue-100 border-blue-400 hover:bg-red-100'
            : 'bg-gray-100 border-gray-300 hover:bg-blue-100'
        }`}>
        <span style={{ fontSize: 8, lineHeight: 1, color: '#64748b', userSelect: 'none' }}>✦</span>
      </button>
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
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()

  const [materiales,    setMateriales]    = useState([])
  const [tapacantos,    setTapacantos]    = useState([])
  const [clientes,      setClientes]      = useState([])
  const [materialId,    setMaterialId]    = useState('')
  const [tapaEspesor,   setTapaEspesor]   = useState('2')
  const [piezas,        setPiezas]        = useState([piezaVacia()])
  const [resultado,     setResultado]     = useState(null)
  const [planchaActual, setPlanchaActual] = useState(0)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')
  const canvasRef          = useRef(null)
  const clienteDropdownRef = useRef(null)

  // Save / load state
  const [savedId,       setSavedId]       = useState(null)
  const [savedNombre,   setSavedNombre]   = useState('')
  const [showSaveForm,  setShowSaveForm]  = useState(false)
  const [saveNombre,    setSaveNombre]    = useState('')
  const [saveDesc,      setSaveDesc]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saveMsg,       setSaveMsg]       = useState('')

  // Load panel
  const [showLoadPanel, setShowLoadPanel] = useState(false)
  const [listaGuardadas, setListaGuardadas] = useState([])
  const [loadingLista,  setLoadingLista]  = useState(false)

  // Plantillas modal
  const [showPlantillas, setShowPlantillas] = useState(false)

  // Cotización modal
  const [showCotizModal,      setShowCotizModal]      = useState(false)
  const [cotizClienteId,      setCotizClienteId]      = useState('')
  const [cotizCreating,       setCotizCreating]       = useState(false)
  const [cotizMsg,            setCotizMsg]            = useState('')
  const [cotizError,          setCotizError]          = useState('')
  // Buscador de clientes
  const [clienteBusqueda,     setClienteBusqueda]     = useState('')
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)

  useEffect(() => {
    materialesService.obtenerTodos().then(r => setMateriales(r.data)).catch(() => {})
    tapacantosService.obtenerTodos().then(r => setTapacantos(r.data)).catch(() => {})
    clientesService.obtenerTodos().then(r => setClientes(r.data)).catch(() => {})
  }, [])

  // Cerrar dropdown de cliente al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target))
        setShowClienteDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-cargar si viene con ?load=ID
  useEffect(() => {
    const loadId = searchParams.get('load')
    if (loadId) cargarOptimizacion(parseInt(loadId))
  }, [])

  const cargarListaGuardadas = async () => {
    setLoadingLista(true)
    try {
      const res = await optimizacionesService.listar({})
      setListaGuardadas(res.data)
    } catch { /* silencioso */ }
    finally { setLoadingLista(false) }
  }

  const cargarOptimizacion = async (id) => {
    try {
      const res = await optimizacionesService.obtener(id)
      const data = res.data
      if (data.request) {
        const req = data.request
        setMaterialId(String(req.materialId || ''))
        setTapaEspesor(String(req.tapaEspesor || '2'))
        if (req.piezas) {
          setPiezas(req.piezas.map(p => ({
            cantidad: p.cantidad || 1,
            largo:    p.largo    || '',
            ancho:    p.ancho    || '',
            nombre:   p.nombre   || '',
            tapaL1:   p.tapacantoL1 || false,
            tapaL2:   p.tapacantoL2 || false,
            tapaA1:   p.tapacantoA1 || false,
            tapaA2:   p.tapacantoA2 || false,
            girar:    false,
            tapacantoId: p.tapacantoId || '',
          })))
        }
      }
      if (data.resultado) setResultado(data.resultado)
      setSavedId(id)
      setSavedNombre(data.nombre || '')
      setSaveNombre(data.nombre || '')
      setSaveDesc(data.descripcion || '')
      setShowLoadPanel(false)
      setPlanchaActual(0)
    } catch {
      setError('Error al cargar la optimización')
    }
  }

  const handleGuardar = async () => {
    if (!resultado) { setError('Primero ejecuta la optimización'); return }
    setSaving(true)
    setSaveMsg('')
    try {
      const mat = materiales.find(m => String(m.id) === String(materialId))
      const payload = {
        nombre:        saveNombre || 'Optimización sin nombre',
        descripcion:   saveDesc,
        materialId:    parseInt(materialId) || 0,
        materialNombre: mat?.nombre || '',
        resultado,
        request: {
          materialId: parseInt(materialId),
          tapaEspesor: parseFloat(tapaEspesor) || 2,
          permitirRotar: piezas.some(p => p.girar),
          piezas: piezas.filter(p => p.largo && p.ancho && p.nombre).map(p => ({
            nombre:      p.nombre,
            cantidad:    parseInt(p.cantidad) || 1,
            largo:       parseFloat(p.largo),
            ancho:       parseFloat(p.ancho),
            tapacantoL1: p.tapaL1,
            tapacantoL2: p.tapaL2,
            tapacantoA1: p.tapaA1,
            tapacantoA2: p.tapaA2,
            tapacantoId: p.tapacantoId || null,
          }))
        }
      }

      if (savedId) {
        await optimizacionesService.actualizar(savedId, payload)
        setSaveMsg('Actualizado correctamente')
      } else {
        const res = await optimizacionesService.guardar(payload)
        setSavedId(res.data.id)
        setSavedNombre(res.data.nombre)
        setSaveMsg('Guardado correctamente')
      }
      setShowSaveForm(false)
    } catch (e) {
      const msg = e.response?.data || e.message || 'Error desconocido'
      setError('Error al guardar: ' + (typeof msg === 'string' ? msg : JSON.stringify(msg)))
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  const crearCotizacion = async () => {
    if (!cotizClienteId) { setCotizError('Selecciona un cliente'); return }
    setCotizCreating(true)
    setCotizError('')
    try {
      // Calcular costo de material
      const mat          = materiales.find(m => String(m.id) === String(materialId))
      const precioTablero = parseFloat(mat?.precioTablero || 0)
      const areaTablero   = resultado ? resultado.planchaLargo * resultado.planchaAncho : 0
      const numTableros   = resultado ? resultado.totalPlanchas : 0
      const totalCostoMat = Math.round(numTableros * precioTablero * 100) / 100

      // 1. Crear encabezado de cotización con costo calculado
      const resCot = await cotizacionesService.crear({
        clienteId:       parseInt(cotizClienteId),
        usuarioId:       1,
        totalMateriales: totalCostoMat,
        totalHerrajes:   0,
        totalServicios:  0,
        total:           totalCostoMat,
        estado:          'pendiente'
      })
      const cotizId = resCot.data.id

      // 2. Agrupar piezas por nombre+largo+ancho para no duplicar
      const grupos = {}
      piezas.filter(p => p.largo && p.ancho && p.nombre).forEach(p => {
        const key = `${p.nombre}|${p.largo}|${p.ancho}`
        if (!grupos[key]) {
          grupos[key] = { ...p, cantidad: parseInt(p.cantidad) || 1 }
        } else {
          grupos[key].cantidad += parseInt(p.cantidad) || 1
        }
      })

      // Calcular área total de todas las piezas para distribución proporcional del costo
      const piezasArr  = Object.values(grupos)
      const areaTotal  = piezasArr.reduce((s, p) => s + parseFloat(p.largo) * parseFloat(p.ancho) * p.cantidad, 0)

      // 3. Insertar cada pieza con costo proporcional
      for (const p of piezasArr) {
        const ml = (
          (p.tapaL1 ? parseFloat(p.largo) : 0) +
          (p.tapaL2 ? parseFloat(p.largo) : 0) +
          (p.tapaA1 ? parseFloat(p.ancho) : 0) +
          (p.tapaA2 ? parseFloat(p.ancho) : 0)
        ) * p.cantidad / 1000

        const areaPieza    = parseFloat(p.largo) * parseFloat(p.ancho) * p.cantidad
        const costoMaterial = areaTotal > 0 && totalCostoMat > 0
          ? Math.round((areaPieza / areaTotal) * totalCostoMat * 100) / 100
          : 0

        await piezasService.crear({
          cotizacionId:   cotizId,
          nombrePieza:    p.nombre,
          materialId:     parseInt(materialId),
          largo:          parseFloat(p.largo),
          ancho:          parseFloat(p.ancho),
          cantidad:       p.cantidad,
          metroTapacanto: parseFloat(ml.toFixed(4)),
          costoMaterial
        })
      }

      // 4. Vincular optimización guardada a la cotización
      if (savedId) {
        const mat = materiales.find(m => String(m.id) === String(materialId))
        await optimizacionesService.actualizar(savedId, {
          nombre:        savedNombre,
          materialId:    parseInt(materialId),
          materialNombre: mat?.nombre || '',
          resultado,
          cotizacionId:  cotizId,
          request: {
            materialId: parseInt(materialId),
            permitirRotar: piezas.some(p => p.girar),
            piezas: piezas.filter(p => p.largo && p.ancho && p.nombre).map(p => ({
              nombre:      p.nombre,
              cantidad:    parseInt(p.cantidad) || 1,
              largo:       parseFloat(p.largo),
              ancho:       parseFloat(p.ancho),
              tapacantoL1: p.tapaL1,
              tapacantoL2: p.tapaL2,
              tapacantoA1: p.tapaA1,
              tapacantoA2: p.tapaA2,
              tapacantoId: p.tapacantoId || null,
            }))
          }
        })
      }

      // 5. Recalcular totales finales
      await cotizacionesService.recalcular(cotizId)

      // 6. Navegar a la cotización creada
      setShowCotizModal(false)
      setCotizClienteId('')
      setClienteBusqueda('')
      setClienteSeleccionado(null)
      navigate('/cotizaciones/' + cotizId)
    } catch (e) {
      setCotizError('Error al crear la cotización: ' + (e.response?.data || e.message))
    } finally {
      setCotizCreating(false)
    }
  }

  useEffect(() => {
    if (resultado) dibujarPlancha(planchaActual)
  }, [resultado, planchaActual])

  const set = (i, campo, valor) => {
    setPiezas(prev => {
      const n = [...prev]
      if (typeof campo === 'object') {
        n[i] = { ...n[i], ...campo }
      } else {
        n[i] = { ...n[i], [campo]: valor }
        if (campo === 'nombre' && valor.length === 1 && i === prev.length - 1) {
          return [...n, piezaVacia()]
        }
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

  const aplicarPlantilla = (plantilla) => {
    setPiezas([
      ...plantilla.piezas.map(p => ({
        cantidad: p.cantidad,
        largo:    String(p.largo),
        ancho:    String(p.ancho),
        nombre:   p.nombre,
        tapaL1:   p.tapaL1,
        tapaL2:   p.tapaL2,
        tapaA1:   p.tapaA1,
        tapaA2:   p.tapaA2,
        girar:    false,
        tapacantoId: '',
      })),
      piezaVacia(),
    ])
    setShowPlantillas(false)
    setSavedNombre(plantilla.nombre)
    setSaveNombre(plantilla.nombre)
  }

  const limpiar = () => {
    setPiezas([piezaVacia()])
    setResultado(null)
    setMaterialId('')
    setTapaEspesor('2')
    setError('')
    setSavedId(null)
    setSavedNombre('')
    setSaveNombre('')
    setSaveDesc('')
    setShowSaveForm(false)
    setShowLoadPanel(false)
  }

  const optimizar = async () => {
    if (!materialId) { setError('Selecciona un material'); return }
    const validas = piezas.filter(p => p.largo && p.ancho && p.nombre)
    if (validas.length === 0) { setError('Completa al menos una pieza con largo, ancho y nombre'); return }
    setLoading(true); setError('')
    try {
      const permitirRotar = validas.some(p => p.girar)
      const res = await optimizacionesService.optimizar({
        materialId: parseInt(materialId),
        permitirRotar,
        piezas: validas.map(p => ({
          nombre:      p.nombre,
          cantidad:    parseInt(p.cantidad) || 1,
          largo:       parseFloat(p.largo),
          ancho:       parseFloat(p.ancho),
          tapacantoL1: p.tapaL1,
          tapacantoL2: p.tapaL2,
          tapacantoA1: p.tapaA1,
          tapacantoA2: p.tapaA2,
          tapacantoId: p.tapacantoId || null,
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
    const plancha  = resultado.planchas[idx]
    const canvas   = canvasRef.current
    const ctx      = canvas.getContext('2d')
    const KERF     = 3
    const planchaW = resultado.planchaLargo
    const planchaH = resultado.planchaAncho

    // ── HiDPI: escala el canvas por devicePixelRatio ─────────────────────────
    const dpr  = window.devicePixelRatio || 1
    const cssW = canvas.parentElement?.clientWidth - 32 || 880
    const cssH = Math.max(300, Math.min(560, Math.round(cssW * planchaH / planchaW)))
    canvas.style.width  = cssW + 'px'
    canvas.style.height = cssH + 'px'
    canvas.width  = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    ctx.scale(dpr, dpr)

    const W = cssW, H = cssH
    const RULER = 30
    const pad   = RULER + 8
    const drawW = W - pad - 6
    const drawH = H - pad - 6
    const escX  = drawW / planchaW
    const escY  = drawH / planchaH

    // ── Fondo oscuro tipo industrial ─────────────────────────────────────────
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // ── Reglas (rulers) ───────────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, RULER, H)
    ctx.fillRect(0, 0, W, RULER)

    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(RULER, 0); ctx.lineTo(RULER, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, RULER); ctx.lineTo(W, RULER); ctx.stroke()

    const tickStep = planchaW <= 2500 ? 200 : 500
    ctx.fillStyle = '#94a3b8'; ctx.font = '8px monospace'

    for (let x = 0; x <= planchaW; x += tickStep) {
      const px = pad + x * escX
      ctx.fillStyle = '#475569'
      ctx.fillRect(px, RULER - 5, 1, 5)
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillText(x >= 1000 ? (x / 1000).toFixed(1) + 'm' : x + '', px, RULER - 6)
    }
    const tickStepY = planchaH <= 2500 ? 200 : 500
    for (let y = 0; y <= planchaH; y += tickStepY) {
      const py = pad + y * escY
      ctx.fillStyle = '#475569'
      ctx.fillRect(RULER - 5, py, 5, 1)
      ctx.save()
      ctx.translate(RULER - 7, py)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = '#94a3b8'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(y >= 1000 ? (y / 1000).toFixed(1) + 'm' : y + '', 0, 0)
      ctx.restore()
    }

    // ── Tablero: fondo melamina ───────────────────────────────────────────────
    ctx.fillStyle = '#fefce8'
    ctx.fillRect(pad, pad, drawW, drawH)

    // Vetas de madera (decorativo)
    ctx.save()
    ctx.strokeStyle = 'rgba(180,150,80,0.10)'
    ctx.lineWidth = 1.2
    for (let y = pad; y < pad + drawH; y += 9) {
      ctx.beginPath()
      ctx.moveTo(pad, y + Math.sin(y * 0.04) * 1.5)
      ctx.lineTo(pad + drawW, y + Math.sin((y + 120) * 0.04) * 1.5)
      ctx.stroke()
    }
    ctx.restore()

    // Grid cada 100mm
    ctx.save()
    ctx.strokeStyle = 'rgba(148,163,184,0.15)'
    ctx.lineWidth = 0.5
    for (let x = 100; x < planchaW; x += 100) {
      const px = pad + x * escX
      ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, pad + drawH); ctx.stroke()
    }
    for (let y = 100; y < planchaH; y += 100) {
      const py = pad + y * escY
      ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(pad + drawW, py); ctx.stroke()
    }
    ctx.restore()

    // Borde del tablero
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2
    ctx.strokeRect(pad, pad, drawW, drawH)

    // ── Sobrantes (hachuras) ──────────────────────────────────────────────────
    if (plancha.sobrantes) {
      plancha.sobrantes.forEach((s, si) => {
        const sx = pad + s.x * escX, sy2 = pad + s.y * escY
        const sw = s.largo * escX,   sh  = s.ancho * escY

        ctx.save()
        ctx.fillStyle = 'rgba(148,163,184,0.12)'
        ctx.fillRect(sx, sy2, sw, sh)

        ctx.strokeStyle = 'rgba(148,163,184,0.35)'
        ctx.lineWidth = 0.7
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        for (let d = -(Math.max(sw, sh)); d < Math.max(sw, sh) * 2; d += 10) {
          ctx.moveTo(sx + d, sy2)
          ctx.lineTo(sx + d + sh, sy2 + sh)
        }
        ctx.stroke()
        ctx.setLineDash([])

        ctx.strokeStyle = 'rgba(100,116,139,0.55)'
        ctx.lineWidth = 1
        ctx.setLineDash([3, 3])
        ctx.strokeRect(sx, sy2, sw, sh)
        ctx.setLineDash([])

        if (sw > 55 && sh > 24) {
          const fs = Math.max(8, Math.min(10, sw / 8))
          ctx.fillStyle = 'rgba(71,85,105,0.9)'
          ctx.font = `${fs}px monospace`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(`Sobrante ${s.largo}×${s.ancho}mm`, sx + sw / 2, sy2 + sh / 2)
        }
        ctx.restore()
      })
    }

    // ── Piezas ────────────────────────────────────────────────────────────────
    plancha.piezas.forEach((pieza, i) => {
      const x  = pad + pieza.x * escX
      const y  = pad + pieza.y * escY
      const w  = pieza.largo * escX
      const h  = pieza.ancho * escY
      const kx = KERF * escX
      const ky = KERF * escY
      const bc = colores[i % colores.length]

      // Relleno
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x, y, w, h)
      ctx.fillStyle = bc + 'cc'
      ctx.fillRect(x, y, w, h)

      // Borde
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)

      // Kerf (sierra)
      const drawKerf = (rx, ry, rw, rh) => {
        ctx.fillStyle = '#fca5a518'
        ctx.fillRect(rx, ry, rw, rh)
        ctx.save()
        ctx.setLineDash([2, 2])
        ctx.strokeStyle = '#ef444460'; ctx.lineWidth = 0.6
        ctx.strokeRect(rx, ry, rw, rh)
        ctx.setLineDash([])
        ctx.restore()
      }
      if (pieza.x + pieza.largo + KERF < planchaW) drawKerf(x + w, y, kx, h)
      if (pieza.y + pieza.ancho + KERF < planchaH) drawKerf(x, y + h, w, ky)

      // Tapacanto (líneas azules gruesas)
      const tw = Math.max(2.5, Math.min(4.5, Math.min(w, h) / 20))
      ctx.strokeStyle = '#2563eb'; ctx.lineWidth = tw
      if (pieza.tapacantoL1) { ctx.beginPath(); ctx.moveTo(x, y);     ctx.lineTo(x + w, y);     ctx.stroke() }
      if (pieza.tapacantoL2) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.stroke() }
      if (pieza.tapacantoA1) { ctx.beginPath(); ctx.moveTo(x, y);     ctx.lineTo(x, y + h);     ctx.stroke() }
      if (pieza.tapacantoA2) { ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.stroke() }

      // Etiqueta de pieza
      if (w > 28 && h > 18) {
        const fs   = Math.max(9, Math.min(13, Math.min(w / 6, h / 3)))
        const lbl  = (pieza.nombre.length > 15 ? pieza.nombre.substring(0, 14) + '…' : pieza.nombre) + (pieza.rotada ? ' ↺' : '')
        const dim  = `${pieza.largo}×${pieza.ancho}mm`
        const lblW = Math.min(w - 6, Math.max(ctx.measureText(lbl).width, ctx.measureText(dim).width) + 10)
        const lblH = fs * 2.8

        ctx.fillStyle = 'rgba(255,255,255,0.80)'
        ctx.fillRect(x + w / 2 - lblW / 2, y + h / 2 - lblH / 2, lblW, lblH)

        ctx.fillStyle = '#0f172a'
        ctx.font = `bold ${fs}px system-ui, sans-serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(lbl, x + w / 2, y + h / 2 - fs * 0.65)

        ctx.fillStyle = '#475569'
        ctx.font = `${Math.max(8, fs - 1.5)}px system-ui, sans-serif`
        ctx.fillText(dim, x + w / 2, y + h / 2 + fs * 0.75)
      }
    })

    // ── Líneas de corte ───────────────────────────────────────────────────────
    const CUT_COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f43f5e','#84cc16']
    if (plancha.lineasCorte) {
      plancha.lineasCorte.forEach((lc, i) => {
        const color = CUT_COLORS[i % CUT_COLORS.length]
        const isH   = lc.tipo === 'H'
        const pos   = isH ? pad + lc.posicion * escY : pad + lc.posicion * escX
        const desde = isH ? pad + lc.desde * escX    : pad + lc.desde * escY
        const hasta = isH ? pad + lc.hasta * escX    : pad + lc.hasta * escY

        ctx.save()
        ctx.shadowColor = color + '99'; ctx.shadowBlur = 4
        ctx.setLineDash([9, 4])
        ctx.strokeStyle = color; ctx.lineWidth = 1.8
        ctx.beginPath()
        if (isH) { ctx.moveTo(desde, pos); ctx.lineTo(hasta, pos) }
        else      { ctx.moveTo(pos, desde); ctx.lineTo(pos, hasta) }
        ctx.stroke()
        ctx.setLineDash([])
        ctx.shadowBlur = 0

        const r = 9
        const cx2 = isH ? desde - r - 3 : pos
        const cy2 = isH ? pos            : desde - r - 3
        ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(lc.orden), cx2, cy2)
        ctx.restore()
      })
    }

    // ── Cotas dimensionales ───────────────────────────────────────────────────
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${planchaW} mm`, pad + drawW / 2, RULER / 2)
    ctx.save()
    ctx.translate(RULER / 2, pad + drawH / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(`${planchaH} mm`, 0, 0)
    ctx.restore()
  }

  const get = (obj, ...keys) => {
    for (const k of keys) if (obj[k] !== undefined) return obj[k]
    return '—'
  }

  // ── Tapacanto name helper ────────────────────────────────────────────────────
  const tapaNombre = (tapacantoId) => {
    if (!tapacantoId) return ''
    const t = tapacantos.find(t => String(t.id) === String(tapacantoId))
    return t ? t.nombre : ''
  }

  const exportarPDF = async () => {
    if (!resultado) return

    const REFILADO  = 10
    const boardW    = resultado.planchaLargo
    const boardH    = resultado.planchaAncho
    const refiladoW = boardW - REFILADO * 2
    const refiladoH = boardH - REFILADO * 2
    const totalPags = resultado.planchas.length + 1

    const ahora   = new Date()
    const fecha   = ahora.toLocaleDateString('es-GT', { day:'2-digit', month:'2-digit', year:'2-digit' })
    const horaStr = ahora.toLocaleTimeString('es-GT', { hour:'2-digit', minute:'2-digit' })
    const material = resultado.materialNombre
    const nombre   = savedNombre || 'Optimización'
    const espesorTapa = tapaEspesor ? `${tapaEspesor} mm` : '2 mm'

    const getVal = (k1, k2) => resultado[k1] ?? resultado[k2] ?? 0

    // ── Paleta minimalista negro ─────────────────────────────────────────────
    const C_DARK    = '#000000'   // negro puro
    const C_MID     = '#222222'   // negro suave para secciones
    const C_LIGHT   = '#f2f2f2'   // gris muy claro para filas alternas
    const C_ACC     = '#333333'   // gris oscuro para detalles
    const C_GRAY    = '#111111'   // texto secundario casi negro
    const C_LINE    = '#bbbbbb'   // línea gris claro

    const mono = `font-family:Arial,Helvetica,sans-serif;`
    const sans = `font-family:Arial,Helvetica,sans-serif;`

    // ── Header de página ─────────────────────────────────────────────────────
    const pageHeader = (titulo, pagActual) => `
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;border-bottom:3px solid #000;">
        <tr>
          <td style="padding:6px 0 4px 0;">
            <span style="${sans}color:#000;font-size:20px;font-weight:900;letter-spacing:2px;">INDUSTRIAS AP</span>
            <span style="${sans}color:${C_GRAY};font-size:10px;margin-left:12px;">Sistema de Optimización de Corte</span>
          </td>
          <td style="text-align:right;vertical-align:bottom;padding-bottom:4px;">
            <span style="${mono}color:${C_GRAY};font-size:9px;">${fecha} ${horaStr} &nbsp;·&nbsp; Pág. ${pagActual}/${totalPags}</span>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:3px 0 6px 0;border-top:1px solid #ddd;">
            <span style="${mono}color:#000;font-size:11px;font-weight:bold;">${titulo}</span>
            <span style="${mono}color:${C_GRAY};font-size:9px;">
              &nbsp;·&nbsp; ${material} &nbsp;·&nbsp; ${boardW}×${boardH} mm
              &nbsp;·&nbsp; Refilado ${refiladoW}×${refiladoH} mm &nbsp;·&nbsp; Kerf 3 mm
            </span>
          </td>
        </tr>
      </table>`

    const pageFooter = (pagActual) => `
      <div style="${mono}font-size:9px;color:${C_GRAY};border-top:2px solid #000;margin-top:8px;padding-top:4px;
                   display:flex;justify-content:space-between;align-items:center;">
        <span>© Industrias AP — Optimización de Corte</span>
        <span style="color:${C_MID};font-weight:bold;">Pág. ${pagActual} de ${totalPags}</span>
      </div>`

    // ── SVG de cada tablero ──────────────────────────────────────────────────
    const SVG_W = 500
    const SVG_H = Math.round(SVG_W * boardH / boardW)
    const scX   = SVG_W / boardW
    const scY   = SVG_H / boardH

    const svgPlancha = (plancha) => {
      const ox = REFILADO * scX
      const oy = REFILADO * scY
      let c = ''

      c += `<rect x="0" y="0" width="${SVG_W}" height="${SVG_H}" fill="#e8e8e8" stroke="#000" stroke-width="2"/>`
      c += `<rect x="${ox.toFixed(1)}" y="${oy.toFixed(1)}"
              width="${(refiladoW * scX).toFixed(1)}" height="${(refiladoH * scY).toFixed(1)}"
              fill="#fff" stroke="#888" stroke-width="0.8" stroke-dasharray="5 3"/>`

      ;(plancha.sobrantes || []).forEach((s, si) => {
        const sx = ox + s.x * scX, sy2 = oy + s.y * scY
        const sw = s.largo * scX,  sh  = s.ancho * scY
        const label = `S${si + 1}`
        c += `<rect x="${sx.toFixed(1)}" y="${sy2.toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}"
                fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.6" stroke-dasharray="3 2"/>`
        if (sw > 18 && sh > 12) {
          const fs = Math.max(5, Math.min(9, sw / 7))
          c += `<text x="${(sx + sw/2).toFixed(1)}" y="${(sy2 + sh/2).toFixed(1)}"
                  font-size="${fs}" text-anchor="middle" dominant-baseline="middle"
                  font-family="Arial,Helvetica,sans-serif" fill="${C_GRAY}" font-weight="bold">${label}</text>`
          if (sw > 36 && sh > 22)
            c += `<text x="${(sx + sw/2).toFixed(1)}" y="${(sy2 + sh/2 + fs*1.3).toFixed(1)}"
                    font-size="${(fs * 0.8).toFixed(1)}" text-anchor="middle"
                    font-family="Arial,Helvetica,sans-serif" fill="#94a3b8">${s.largo}×${s.ancho}</text>`
        }
      })

      plancha.piezas.forEach((p, pi) => {
        const px = ox + p.x * scX, py2 = oy + p.y * scY
        const pw  = p.largo * scX, ph  = p.ancho * scY
        const cx  = px + pw / 2,   cy  = py2 + ph / 2
        const fs  = Math.max(5, Math.min(10, Math.min(pw, ph) / 5))
        const pieceColor = colores[pi % colores.length]

        c += `<rect x="${px.toFixed(1)}" y="${py2.toFixed(1)}" width="${pw.toFixed(1)}" height="${ph.toFixed(1)}"
                fill="${pieceColor}" fill-opacity="0.55" stroke="#000" stroke-width="0.9"/>`

        if (pw > 22 && ph > 14) {
          c += `<text x="${cx.toFixed(1)}" y="${(py2 + fs * 1.4).toFixed(1)}"
                  font-size="${(fs * 0.82).toFixed(1)}" text-anchor="middle"
                  font-family="Arial,Helvetica,sans-serif" fill="#222">${p.largo}×${p.ancho}</text>`
          c += `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}"
                  font-size="${fs.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
                  font-family="Arial,Helvetica,sans-serif" fill="#000" font-weight="bold">${p.nombre}</text>`
          if (p.rotada && pw > 30)
            c += `<text x="${(px + pw - 3).toFixed(1)}" y="${(py2 + fs + 2).toFixed(1)}"
                    font-size="${(fs * 0.75).toFixed(1)}" text-anchor="end"
                    font-family="Arial,Helvetica,sans-serif" fill="#555">↺</text>`
        }

        // Tapacanto — línea negra gruesa
        const TW = Math.max(2, Math.min(3.5, ph / 25))
        if (p.tapacantoL1) c += `<line x1="${px.toFixed(1)}" y1="${py2.toFixed(1)}" x2="${(px+pw).toFixed(1)}" y2="${py2.toFixed(1)}" stroke="#000" stroke-width="${TW}"/>`
        if (p.tapacantoL2) c += `<line x1="${px.toFixed(1)}" y1="${(py2+ph).toFixed(1)}" x2="${(px+pw).toFixed(1)}" y2="${(py2+ph).toFixed(1)}" stroke="#000" stroke-width="${TW}"/>`
        if (p.tapacantoA1) c += `<line x1="${px.toFixed(1)}" y1="${py2.toFixed(1)}" x2="${px.toFixed(1)}" y2="${(py2+ph).toFixed(1)}" stroke="#000" stroke-width="${TW}"/>`
        if (p.tapacantoA2) c += `<line x1="${(px+pw).toFixed(1)}" y1="${py2.toFixed(1)}" x2="${(px+pw).toFixed(1)}" y2="${(py2+ph).toFixed(1)}" stroke="#000" stroke-width="${TW}"/>`
      })

      const FS_COTA = 7
      c += `<text x="${(SVG_W/2).toFixed(1)}" y="${SVG_H - 2}"
              font-size="${FS_COTA}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" fill="${C_GRAY}">${boardW} mm</text>`
      c += `<text x="5" y="${(SVG_H/2).toFixed(1)}"
              font-size="${FS_COTA}" text-anchor="middle" dominant-baseline="middle"
              font-family="Arial,Helvetica,sans-serif" fill="${C_GRAY}" transform="rotate(-90,5,${SVG_H/2})">${boardH} mm</text>`

      // Líneas de corte en el SVG: colores, extensión real y círculo de orden
      const SVG_CUT = ['#e74c3c','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#e91e63','#1abc9c','#e53935','#7cb342']
      ;(plancha.lineasCorte || []).forEach((lc, i) => {
        const col  = SVG_CUT[i % SVG_CUT.length]
        const isH  = lc.tipo === 'H'
        const pos  = isH ? (oy + lc.posicion * scY) : (ox + lc.posicion * scX)
        const dsd  = isH ? (ox + lc.desde * scX)    : (oy + lc.desde * scY)
        const hst  = isH ? (ox + lc.hasta * scX)    : (oy + lc.hasta * scY)

        if (isH) {
          c += `<line x1="${dsd.toFixed(1)}" y1="${pos.toFixed(1)}" x2="${hst.toFixed(1)}" y2="${pos.toFixed(1)}" stroke="${col}" stroke-width="1.2" stroke-dasharray="6 3"/>`
          c += `<circle cx="${(dsd - 6).toFixed(1)}" cy="${pos.toFixed(1)}" r="5" fill="${col}"/>`
          c += `<text x="${(dsd - 6).toFixed(1)}" y="${pos.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="5.5" font-family="Arial,sans-serif" fill="white" font-weight="bold">${lc.orden}</text>`
        } else {
          c += `<line x1="${pos.toFixed(1)}" y1="${dsd.toFixed(1)}" x2="${pos.toFixed(1)}" y2="${hst.toFixed(1)}" stroke="${col}" stroke-width="1.2" stroke-dasharray="6 3"/>`
          c += `<circle cx="${pos.toFixed(1)}" cy="${(dsd - 6).toFixed(1)}" r="5" fill="${col}"/>`
          c += `<text x="${pos.toFixed(1)}" y="${(dsd - 6).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="5.5" font-family="Arial,sans-serif" fill="white" font-weight="bold">${lc.orden}</text>`
        }
      })

      return `<svg xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 ${SVG_W} ${SVG_H}"
                style="width:100%;height:auto;display:block;border:1.5px solid ${C_LINE};border-radius:3px;">${c}</svg>`
    }

    // ── Helpers de tabla ─────────────────────────────────────────────────────
    const TH  = `border:1px solid #aaa;border-bottom:2px solid #000;padding:5px 9px;font-size:11px;${mono}background:#e8e8e8;color:#000;font-weight:bold;text-align:center;`
    const TS  = `border:1px solid #ccc;padding:4px 9px;font-size:11px;${mono}color:#111;`
    const TSR = `${TS}text-align:right;`

    const sectionTitle = (txt) => `
      <div style="${sans}font-size:11px;font-weight:900;color:#000;border-bottom:2px solid #000;
                   padding:4px 0;margin:10px 0 5px 0;letter-spacing:1px;text-transform:uppercase;">
        ${txt}
      </div>`

    const tapaStr = (p) => {
      const s = [p.tapacantoL1&&'Sup', p.tapacantoL2&&'Inf', p.tapacantoA1&&'Izq', p.tapacantoA2&&'Der']
        .filter(Boolean)
      return s.length ? s.join('+') : '—'
    }

    // ── Cálculos generales ───────────────────────────────────────────────────
    const todasPiezas    = resultado.planchas.flatMap(pl => pl.piezas)
    const todosSobrantes = resultado.planchas.flatMap(pl => pl.sobrantes || [])

    const m2Tableros  = (resultado.totalPlanchas * boardW * boardH / 1_000_000).toFixed(4)
    const m2Piezas    = (todasPiezas.reduce((a, p) => a + p.largo * p.ancho, 0) / 1_000_000).toFixed(4)
    const m2Sobrantes = (todosSobrantes.reduce((a, s) => a + s.largo * s.ancho, 0) / 1_000_000).toFixed(4)
    const mlCorte     = getVal('metrosLinealesCorte',    'MetrosLinealesCorte')
    const mlTapacanto = getVal('metrosLinealesTapacanto','MetrosLinealesTapacanto')

    const grupoPiezas = {}
    todasPiezas.forEach(p => {
      const key = `${p.nombre}|${p.largo}|${p.ancho}|${tapaStr(p)}|${p.tapacantoId || ''}`
      if (!grupoPiezas[key])
        grupoPiezas[key] = { nombre: p.nombre, largo: p.largo, ancho: p.ancho, tapa: tapaStr(p), tapacantoId: p.tapacantoId, cant: 0 }
      grupoPiezas[key].cant++
    })

    // ── Páginas de layout ────────────────────────────────────────────────────
    const layoutPages = resultado.planchas.map((plancha, i) => `
      <div style="page-break-before:always;padding:10px 14px;">
        ${pageHeader(`TABLERO ${i + 1} DE ${resultado.totalPlanchas}  ·  Aprovechamiento: ${plancha.porcentajeUso}%`, i + 1)}

        <div style="margin:8px 0;box-shadow:0 1px 4px rgba(0,0,0,.12);">
          ${svgPlancha(plancha)}
        </div>

        <div style="${mono}font-size:8px;color:${C_GRAY};margin:4px 0 6px 0;">
          <span style="color:#000;font-weight:bold;">━━</span> Tapacanto &nbsp;·&nbsp;
          <span style="font-weight:bold;">①</span> Guía de corte (número = orden de ejecución) &nbsp;·&nbsp;
          <span style="background:#e2e8f0;padding:0 3px;">S#</span> Sobrante &nbsp;·&nbsp; ↺ Rotada
        </div>

        ${plancha.lineasCorte?.length ? `
        ${sectionTitle('SECUENCIA DE CORTES')}
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
          <thead><tr>
            <th style="${TH}width:40px;">ORDEN</th>
            <th style="${TH}width:50px;">TIPO</th>
            <th style="${TH}">POSICIÓN (mm)</th>
            <th style="${TH}">DESDE (mm)</th>
            <th style="${TH}">HASTA (mm)</th>
            <th style="${TH}">LONGITUD (mm)</th>
          </tr></thead>
          <tbody>
            ${(plancha.lineasCorte || []).map((lc, ci) => {
              const col = ['#e74c3c','#e67e22','#f1c40f','#27ae60','#2980b9','#8e44ad','#e91e63','#1abc9c'][ci % 8]
              const lon = Math.round(lc.hasta - lc.desde)
              return `<tr style="background:${ci%2===0?'#fff':C_LIGHT}">
                <td style="${TS}text-align:center;">
                  <span style="background:${col};color:#fff;border-radius:50%;padding:1px 5px;font-weight:bold;">${lc.orden}</span>
                </td>
                <td style="${TS}text-align:center;font-weight:bold;color:${col};">${lc.tipo === 'H' ? 'Horizontal' : 'Vertical'}</td>
                <td style="${TSR}">${lc.posicion}</td>
                <td style="${TSR}">${lc.desde}</td>
                <td style="${TSR}">${lc.hasta}</td>
                <td style="${TSR}font-weight:bold;">${lon}</td>
              </tr>`
            }).join('')}
          </tbody>
        </table>` : ''}

        ${sectionTitle('PIEZAS EN ESTE TABLERO')}
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="${TH}">ETIQUETA</th>
              <th style="${TH}">BASE mm</th>
              <th style="${TH}">ALTO mm</th>
              <th style="${TH}">ÁREA m²</th>
              <th style="${TH}">ROT.</th>
              <th style="${TH}">TAPACANTO</th>
            </tr>
          </thead>
          <tbody>
            ${plancha.piezas.map((p, ri) => `
              <tr style="background:${ri%2===0?'#fff':C_LIGHT}">
                <td style="${TS}font-weight:bold;color:${C_DARK};">${p.nombre}</td>
                <td style="${TSR}">${p.largo}</td>
                <td style="${TSR}">${p.ancho}</td>
                <td style="${TSR}">${(p.largo*p.ancho/1_000_000).toFixed(4)}</td>
                <td style="${TS}text-align:center;color:${C_ACC};">${p.rotada ? '↺' : '—'}</td>
                <td style="${TS}color:${C_MID};font-weight:bold;">${tapaStr(p)}${tapaNombre(p.tapacantoId) ? `<span style="color:#666;font-weight:normal;"> · ${tapaNombre(p.tapacantoId)}</span>` : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>

        ${plancha.sobrantes?.length ? `
          ${sectionTitle(`SOBRANTES APROVECHABLES (${plancha.sobrantes.length})`)}
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
              <th style="${TH}">REF</th>
              <th style="${TH}">BASE mm</th>
              <th style="${TH}">ALTO mm</th>
              <th style="${TH}">ÁREA m²</th>
            </tr></thead>
            <tbody>
              ${plancha.sobrantes.map((s, si) => `
                <tr style="background:${si%2===0?'#fff':C_LIGHT}">
                  <td style="${TS}font-weight:bold;color:${C_GRAY};">S${si+1}</td>
                  <td style="${TSR}">${s.largo}</td>
                  <td style="${TSR}">${s.ancho}</td>
                  <td style="${TSR}">${(s.largo*s.ancho/1_000_000).toFixed(4)}</td>
                </tr>`).join('')}
            </tbody>
          </table>` : ''}

        ${pageFooter(i + 1)}
      </div>`).join('')

    // ── Página de reporte final ──────────────────────────────────────────────
    const totalCortesPDF = resultado.totalCortes ?? resultado.planchas?.reduce((s, p) => s + (p.lineasCorte?.length || 0), 0) ?? 0
    const areaDesperdiciada = resultado.areaDesperdiciada ?? resultado.AreaDesperdiciada ?? (resultado.totalPlanchas * boardW * boardH - todasPiezas.reduce((a, p) => a + p.largo * p.ancho, 0))

    const metricCard = (label, value, highlight = false, accent = '#000') =>
      `<td style="border:1px solid #ccc;${highlight ? `border-top:3px solid ${accent};` : ''}padding:8px 12px;background:${highlight ? '#f9f9f9' : '#fff'};vertical-align:top;">
        <div style="${sans}font-size:9px;color:#555;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
        <div style="${mono}font-size:${highlight ? '18' : '15'}px;font-weight:bold;color:${highlight ? accent : '#000'};">${value}</div>
      </td>`

    const reportePage = `
      <div style="padding:10px 14px;">
        ${pageHeader('REPORTE TÉCNICO DE APROVECHAMIENTO', totalPags)}

        ${sectionTitle('DATOS DEL PROYECTO')}
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;border:1px solid #ddd;">
          <tr>
            <td style="${TS}width:20%;font-weight:bold;background:#f2f2f2;">Proyecto / Nombre</td>
            <td style="${TS}width:30%;">${nombre}</td>
            <td style="${TS}width:20%;font-weight:bold;background:#f2f2f2;">Material</td>
            <td style="${TS}">${material}</td>
          </tr>
          <tr>
            <td style="${TS}font-weight:bold;background:#f2f2f2;">Dimensiones tablero</td>
            <td style="${TS}">${boardW} × ${boardH} mm &nbsp;·&nbsp; Refilado: ${refiladoW}×${refiladoH} mm</td>
            <td style="${TS}font-weight:bold;background:#f2f2f2;">Corte / Tapacanto</td>
            <td style="${TS}">Kerf 3 mm &nbsp;·&nbsp; Tapacanto ${espesorTapa}</td>
          </tr>
          <tr>
            <td style="${TS}font-weight:bold;background:#f2f2f2;">Fecha y hora</td>
            <td style="${TS}">${fecha} — ${horaStr}</td>
            <td style="${TS}font-weight:bold;background:#f2f2f2;">Total piezas</td>
            <td style="${TS}">${todasPiezas.length} unidades (${Object.keys(grupoPiezas).length} tipos)</td>
          </tr>
        </table>

        ${sectionTitle('MÉTRICAS DE APROVECHAMIENTO')}
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <tr>
            ${metricCard('Total tableros', resultado.totalPlanchas + ' ud.', true, '#000')}
            ${metricCard('Aprovechamiento', resultado.porcentajeUso + '%', true, '#22863a')}
            ${metricCard('Desperdicio', resultado.porcentajeDesperdicio + '%', true, '#cb2431')}
            ${metricCard('Total cortes', totalCortesPDF + ' cortes', true, '#0550ae')}
          </tr>
          <tr>
            ${metricCard('Área tableros', m2Tableros + ' m²')}
            ${metricCard('Área piezas', m2Piezas + ' m²')}
            ${metricCard('Área sobrantes', m2Sobrantes + ' m²')}
            ${metricCard('Área desperdicio', (areaDesperdiciada / 1_000_000).toFixed(4) + ' m²')}
          </tr>
          <tr>
            ${metricCard('ML corte total', mlCorte + ' m')}
            ${metricCard('ML tapacanto', mlTapacanto + ' m')}
            ${metricCard('Sobrantes reutilizables', todosSobrantes.length + ' piezas')}
            ${metricCard('Kerf aplicado', '3 mm por corte')}
          </tr>
        </table>

        ${sectionTitle(`LISTADO DE PIEZAS CORTADAS (${todasPiezas.length} ud.)`)}
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          <thead>
            <tr>
              <th style="${TH}">CANT</th>
              <th style="${TH}">ETIQUETA</th>
              <th style="${TH}">BASE mm</th>
              <th style="${TH}">ALTO mm</th>
              <th style="${TH}">ÁREA m²</th>
              <th style="${TH}">TAPACANTO</th>
            </tr>
          </thead>
          <tbody>
            ${Object.values(grupoPiezas).map((p, ri) => `
              <tr style="background:${ri%2===0?'#fff':C_LIGHT}">
                <td style="${TSR}font-weight:bold;color:${C_MID};">${p.cant}</td>
                <td style="${TS}font-weight:bold;color:${C_DARK};">${p.nombre}</td>
                <td style="${TSR}">${p.largo}</td>
                <td style="${TSR}">${p.ancho}</td>
                <td style="${TSR}">${(p.largo*p.ancho/1_000_000).toFixed(4)}</td>
                <td style="${TS}color:${C_MID};font-weight:bold;">${p.tapa}${tapaNombre(p.tapacantoId) ? `<span style="color:#666;font-weight:normal;"> · ${tapaNombre(p.tapacantoId)}</span>` : ''}</td>
              </tr>`).join('')}
          </tbody>
        </table>

        ${todosSobrantes.length > 0 ? `
          ${sectionTitle(`SOBRANTES TOTALES (${todosSobrantes.length} ud.)`)}
          <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
            <thead><tr>
              <th style="${TH}">REF</th>
              <th style="${TH}">TABLERO</th>
              <th style="${TH}">BASE mm</th>
              <th style="${TH}">ALTO mm</th>
              <th style="${TH}">ÁREA m²</th>
            </tr></thead>
            <tbody>
              ${todosSobrantes.map((s, si) => {
                const tabIdx = resultado.planchas.findIndex(pl => (pl.sobrantes||[]).includes(s)) + 1
                return `<tr style="background:${si%2===0?'#fff':C_LIGHT}">
                  <td style="${TS}font-weight:bold;color:${C_GRAY};">S${si+1}</td>
                  <td style="${TSR}">${tabIdx || '—'}</td>
                  <td style="${TSR}">${s.largo}</td>
                  <td style="${TSR}">${s.ancho}</td>
                  <td style="${TSR}">${(s.largo*s.ancho/1_000_000).toFixed(4)}</td>
                </tr>`}).join('')}
            </tbody>
          </table>` : ''}

        ${pageFooter(totalPags)}
      </div>`

    // ── Render ───────────────────────────────────────────────────────────────
    const html2pdf = (await import('html2pdf.js')).default
    const wrap = document.createElement('div')
    wrap.innerHTML = `<div style="${mono}color:#000;font-size:10px;">${reportePage}${layoutPages}</div>`
    document.body.appendChild(wrap)

    await html2pdf().set({
      margin:      [8, 8, 8, 8],
      filename:    `Optimizacion-${nombre.replace(/\s+/g, '_')}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: ['css', 'legacy'] },
    }).from(wrap).save()

    document.body.removeChild(wrap)
  }


  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-gray-800">Optimizador de cortes</h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded hidden md:inline">MaxRects 2D · Kerf 3mm</span>
              </div>
              {savedId && (
                <p className="text-xs text-green-600 mt-0.5 truncate">
                  ✓ Guardado: <span className="font-medium">{savedNombre}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowPlantillas(true)}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              📐 Plantillas
            </button>
            <button onClick={() => { setShowLoadPanel(!showLoadPanel); if (!showLoadPanel) cargarListaGuardadas() }}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              📂 Cargar
            </button>
            <button onClick={limpiar}
              className="text-xs text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              Limpiar
            </button>
            <button onClick={toggleGirarTodo}
              className="text-xs text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
              ↺ Girar todo
            </button>
            {resultado && (
              <>
                <button onClick={() => {
                    setShowCotizModal(true)
                    setCotizError('')
                    setClienteBusqueda('')
                    setCotizClienteId('')
                    setClienteSeleccionado(null)
                  }}
                  className="text-xs bg-violet-600 text-white px-4 py-1.5 rounded-lg hover:bg-violet-700 transition font-medium">
                  📋 Cotización
                </button>
                <button onClick={() => setShowSaveForm(!showSaveForm)}
                  className={`text-xs px-4 py-1.5 rounded-lg transition font-medium ${
                    savedId
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}>
                  {savedId ? '💾 Actualizar' : '💾 Guardar'}
                </button>
                <button onClick={exportarPDF}
                  className="text-xs text-red-600 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-50 transition font-medium">
                  📄 PDF
                </button>
              </>
            )}
            <button onClick={optimizar} disabled={loading}
              className={`text-xs px-5 py-1.5 rounded-lg transition font-semibold shadow-sm ${
                loading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }`}>
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Calculando...
                </span>
              ) : '⚡ Optimizar'}
            </button>
          </div>
        </div>

        {/* Save msg */}
        {saveMsg && (
          <div className="mt-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
            ✓ {saveMsg}
          </div>
        )}

        {/* Form guardar */}
        {showSaveForm && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">
              {savedId ? 'Actualizar optimización guardada' : 'Guardar optimización'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                <input type="text" value={saveNombre} onChange={e => setSaveNombre(e.target.value)}
                  placeholder="Ej: Closet habitación principal"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Descripción (opcional)</label>
                <input type="text" value={saveDesc} onChange={e => setSaveDesc(e.target.value)}
                  placeholder="Notas adicionales..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={handleGuardar} disabled={saving}
                className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
                {saving ? 'Guardando...' : savedId ? 'Actualizar' : 'Guardar'}
              </button>
              {savedId && (
                <button onClick={() => { setSavedId(null); setSavedNombre(''); setShowSaveForm(false) }}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                  Guardar como nueva copia
                </button>
              )}
              <button onClick={() => setShowSaveForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Panel cargar */}
        {showLoadPanel && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-700">Optimizaciones guardadas</p>
              <button onClick={() => navigate('/optimizaciones')}
                className="text-xs text-blue-600 hover:underline">Ver todas →</button>
            </div>
            {loadingLista ? (
              <p className="text-xs text-gray-400 text-center py-4">Cargando...</p>
            ) : listaGuardadas.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No hay optimizaciones guardadas</p>
            ) : (
              <div className="space-y-2">
                {listaGuardadas.map(opt => (
                  <div key={opt.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 transition">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{opt.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {opt.materialNombre} ·{' '}
                        {opt.resumenResultado ? `${opt.resumenResultado.totalPlanchas} planchas · ${opt.resumenResultado.porcentajeUso}% uso` : ''}
                      </p>
                    </div>
                    <button onClick={() => cargarOptimizacion(opt.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition ml-3 shrink-0">
                      Cargar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal plantillas */}
      {showPlantillas && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Plantillas de muebles</h3>
                <p className="text-xs text-gray-500 mt-0.5">Selecciona una para cargar las piezas automáticamente</p>
              </div>
              <button onClick={() => setShowPlantillas(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              {PLANTILLAS.map(plantilla => (
                <button key={plantilla.nombre} onClick={() => aplicarPlantilla(plantilla)}
                  className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{plantilla.nombre}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{plantilla.descripcion}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {plantilla.piezas.length} piezas
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Las piezas actuales serán reemplazadas por las de la plantilla.</p>
          </div>
        </div>
      )}

      {/* Modal crear cotización */}
      {showCotizModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Crear cotización</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Se transferirán {piezas.filter(p => p.largo && p.ancho && p.nombre).length} pieza(s) a una nueva cotización
                </p>
              </div>
              <button onClick={() => setShowCotizModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Buscador de clientes */}
            <div className="mb-4 relative" ref={clienteDropdownRef}>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente *</label>
              <div className="relative">
                <input
                  type="text"
                  value={clienteBusqueda}
                  onChange={e => {
                    setClienteBusqueda(e.target.value)
                    setCotizClienteId('')
                    setClienteSeleccionado(null)
                    setShowClienteDropdown(true)
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  placeholder="Buscar por nombre, teléfono o email..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition pr-8 ${
                    cotizClienteId
                      ? 'border-violet-400 ring-1 ring-violet-300 bg-violet-50'
                      : 'border-gray-300 focus:ring-violet-400'
                  }`}
                />
                {cotizClienteId && (
                  <span className="absolute right-2.5 top-2.5 text-green-500 text-sm font-bold">✓</span>
                )}
              </div>

              {clienteSeleccionado && cotizClienteId && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-violet-700 bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5">
                  <span className="font-semibold">{clienteSeleccionado.nombre}</span>
                  {clienteSeleccionado.telefono && <span className="text-violet-400">· {clienteSeleccionado.telefono}</span>}
                  {clienteSeleccionado.email    && <span className="text-violet-400">· {clienteSeleccionado.email}</span>}
                  <button onClick={() => { setCotizClienteId(''); setClienteBusqueda(''); setClienteSeleccionado(null) }}
                    className="ml-auto text-violet-400 hover:text-red-500 transition">×</button>
                </div>
              )}

              {showClienteDropdown && !cotizClienteId && (() => {
                const q = clienteBusqueda.toLowerCase()
                const filtrados = clientes.filter(c =>
                  !q ||
                  (c.nombre  || '').toLowerCase().includes(q) ||
                  (c.telefono|| '').toLowerCase().includes(q) ||
                  (c.email   || '').toLowerCase().includes(q)
                ).slice(0, 8)
                return filtrados.length > 0 ? (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-52 overflow-y-auto">
                    {filtrados.map(c => (
                      <button key={c.id}
                        onMouseDown={() => {
                          setCotizClienteId(String(c.id))
                          setClienteSeleccionado(c)
                          setClienteBusqueda(c.nombre)
                          setShowClienteDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-violet-50 transition border-b border-gray-50 last:border-0">
                        <div className="text-sm font-semibold text-gray-800">{c.nombre}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {[c.telefono, c.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : clienteBusqueda ? (
                  <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-md mt-1 px-4 py-3 text-center">
                    <p className="text-xs text-gray-400">Sin resultados para "{clienteBusqueda}"</p>
                  </div>
                ) : null
              })()}
            </div>

            {/* Resumen de lo que se transfiere */}
            {resultado && (() => {
              const mat = materiales.find(m => String(m.id) === String(materialId))
              const costoMat = mat ? (resultado.totalPlanchas * parseFloat(mat.precioTablero || 0)).toFixed(2) : null
              const mlTapa = parseFloat(resultado.metrosLinealesTapacanto || resultado.MetrosLinealesTapacanto || 0)
              const totalCortes = resultado.totalCortes ?? resultado.planchas?.reduce((s, p) => s + (p.lineasCorte?.length || 0), 0) ?? 0
              return (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-4 space-y-3">
                  <p className="text-xs font-semibold text-violet-800">Se transferirá automáticamente:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-xs text-violet-500">Tableros</p>
                      <p className="text-sm font-bold text-violet-800">{resultado.totalPlanchas}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-xs text-violet-500">Cortes</p>
                      <p className="text-sm font-bold text-violet-800">{totalCortes}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center border border-violet-100">
                      <p className="text-xs text-violet-500">ML Tapacanto</p>
                      <p className="text-sm font-bold text-violet-800">{mlTapa.toFixed(2)}m</p>
                    </div>
                  </div>
                  {costoMat && parseFloat(costoMat) > 0 && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-emerald-700 font-medium">Costo material estimado:</span>
                      <span className="text-sm font-bold text-emerald-700">Q{costoMat}</span>
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="text-violet-600 cursor-pointer hover:text-violet-800 font-medium">
                      Ver piezas ({piezas.filter(p => p.largo && p.ancho && p.nombre).length} ítems)
                    </summary>
                    <ul className="mt-2 space-y-0.5 text-violet-600 pl-2">
                      {Object.entries(
                        piezas.filter(p => p.largo && p.ancho && p.nombre)
                          .reduce((acc, p) => {
                            const k = `${p.nombre}|${p.largo}|${p.ancho}`
                            acc[k] = (acc[k] || 0) + (parseInt(p.cantidad) || 1)
                            return acc
                          }, {})
                      ).map(([k, cnt]) => {
                        const [nombre, largo, ancho] = k.split('|')
                        return <li key={k}>· {cnt}× {nombre} ({largo}×{ancho} mm)</li>
                      })}
                    </ul>
                  </details>
                </div>
              )
            })()}

            {cotizError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">
                {cotizError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={crearCotizacion} disabled={cotizCreating}
                className="flex-1 bg-violet-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition">
                {cotizCreating ? 'Creando...' : 'Crear e ir a cotización →'}
              </button>
              <button onClick={() => setShowCotizModal(false)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded">
          {error}
        </div>
      )}

      <div className="p-6 space-y-4">

        {/* Material + Espesor tapacanto */}
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-6">
          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Material</label>
          <select value={materialId} onChange={e => setMaterialId(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-64">
            <option value="">Seleccionar material...</option>
            {materiales.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} ({m.largo}×{m.ancho} mm)</option>
            ))}
          </select>

          <div className="h-5 w-px bg-gray-200" />

          <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Espesor tapacanto</label>
          <select value={tapaEspesor} onChange={e => setTapaEspesor(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="0.4">0.4 mm</option>
            <option value="1">1 mm</option>
            <option value="2">2 mm</option>
            <option value="3">3 mm</option>
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
              {piezas.filter(p => p.nombre).length} pieza(s) — Kerf 3mm incluido · ✦ centro = todos los cantos
            </span>
          </div>
        </div>

        {/* Resultado */}
        {resultado && (
          <div className="space-y-4">

            {/* Stats */}
            {(() => {
              const mlTapa    = parseFloat(get(resultado, 'metrosLinealesTapacanto', 'MetrosLinealesTapacanto')) || 0
              const mlCorte   = parseFloat(get(resultado, 'metrosLinealesCorte', 'MetrosLinealesCorte')) || 0
              const totalCortes = resultado.totalCortes ?? resultado.planchas?.reduce((s, p) => s + (p.lineasCorte?.length || 0), 0) ?? 0
              const mat       = materiales.find(m => String(m.id) === String(materialId))
              const costoMat  = mat ? (resultado.totalPlanchas * parseFloat(mat.precioTablero || 0)).toFixed(2) : '—'
              const pct       = parseFloat(resultado.porcentajeUso)
              const pctColor  = pct >= 80 ? 'text-green-700' : pct >= 60 ? 'text-yellow-600' : 'text-orange-600'

              const stats = [
                { l: 'Tableros',     v: resultado.totalPlanchas + ' ud.',  cls: 'text-blue-700',    bg: 'bg-blue-50'   },
                { l: 'Aprovecha.',   v: resultado.porcentajeUso + '%',     cls: pctColor,            bg: 'bg-green-50'  },
                { l: 'Desperdicio',  v: resultado.porcentajeDesperdicio + '%', cls: 'text-orange-600', bg: 'bg-orange-50' },
                { l: 'Cortes tot.', v: totalCortes + ' cortes',            cls: 'text-red-600',     bg: 'bg-red-50'    },
                { l: 'ML Corte',     v: mlCorte.toFixed(2) + ' m',         cls: 'text-slate-700',   bg: 'bg-slate-50'  },
                { l: 'ML Tapacanto', v: mlTapa.toFixed(2) + ' m',          cls: 'text-purple-700',  bg: 'bg-purple-50' },
                { l: 'Mat. estimado',v: mat ? `Q${costoMat}` : '—',        cls: 'text-emerald-700', bg: 'bg-emerald-50'},
              ]
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {stats.map(({ l, v, cls, bg }) => (
                    <div key={l} className={`${bg} border border-gray-200 rounded-xl p-3 text-center`}>
                      <p className="text-xs text-gray-400 mb-1 font-medium">{l}</p>
                      <p className={`text-sm font-bold ${cls}`}>{v}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Canvas */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Header del tablero */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">Tablero</span>
                    <span className="text-sm font-bold text-white">{planchaActual + 1} / {resultado.totalPlanchas}</span>
                  </div>
                  <div className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    resultado.planchas[planchaActual].porcentajeUso >= 80
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : resultado.planchas[planchaActual].porcentajeUso >= 60
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}>
                    {resultado.planchas[planchaActual].porcentajeUso}% aprovechado
                  </div>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                    {resultado.planchaLargo}×{resultado.planchaAncho} mm
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {Array.from({ length: resultado.totalPlanchas }, (_, i) => (
                    <button key={i} onClick={() => setPlanchaActual(i)}
                      className={`w-7 h-7 text-xs rounded-lg border font-medium transition ${
                        i === planchaActual
                          ? 'bg-blue-500 text-white border-blue-400 shadow-sm shadow-blue-500/30'
                          : 'border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}>{i + 1}</button>
                  ))}
                </div>
              </div>

              {/* Canvas */}
              <div className="bg-slate-900 p-4">
                <canvas ref={canvasRef} className="w-full rounded block" style={{ display: 'block' }} />
              </div>

              {/* Leyenda */}
              <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-6 h-1 bg-blue-500 rounded"></span>
                  Tapacanto
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-2.5 bg-red-100 border border-dashed border-red-300 rounded-sm"></span>
                  Kerf sierra (3mm)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 border-t-2 border-dashed border-red-500"></span>
                  Guía de corte
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-sm border border-dashed border-slate-400" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#94a3b8 0,#94a3b8 1px,transparent 0,transparent 50%)', backgroundSize: '5px 5px', backgroundColor: 'transparent' }}></span>
                  Sobrante
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-slate-400">↺</span>
                  Pieza rotada
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-4 h-4 rounded-sm bg-amber-100 border border-amber-300"></span>
                  Melamina
                </span>
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
                        {tapaNombre(p.tapacantoId) && (
                          <span className="text-gray-400 ml-1 font-normal text-xs">· {tapaNombre(p.tapacantoId)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {!resultado && (
          <div className="bg-white border border-dashed border-gray-200 rounded-xl h-52 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-3 opacity-20">◼</div>
              <p className="text-gray-400 text-sm">Completa las piezas y haz clic en</p>
              <p className="text-blue-600 font-semibold mt-1 text-sm">⚡ Optimizar</p>
              <p className="text-gray-300 text-xs mt-3">
                Algoritmo MaxRects · 636 combinaciones · Kerf 3mm incluido
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
