import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  cotizacionesService,
  cotizacionMaterialesService,
  cotizacionManoObraService,
  detalleHerrajesService,
  detalleServiciosService,
  materialesService,
  herrajesService,
  serviciosService,
  parametrosService,
  proyectosService,
  comentariosService,
} from '../../services'

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESTADO_STYLES = {
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  aprobada:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  rechazada: 'bg-red-100 text-red-600 border-red-200',
  cancelada: 'bg-gray-100 text-gray-500 border-gray-200',
}

const TABS = [
  { key: 'info',      label: 'Info',      icon: '📋' },
  { key: 'materiales', label: 'Materiales', icon: '🪵' },
  { key: 'herrajes',  label: 'Herrajes',  icon: '🔩' },
  { key: 'servicios', label: 'Servicios', icon: '⚙️' },
  { key: 'manoObra',  label: 'Mano Obra', icon: '👷' },
  { key: 'resumen',   label: 'Resumen',   icon: '💰' },
]

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Toast({ msg, type }) {
  if (!msg) return null
  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${
      type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'
    }`}>
      {type === 'error' ? '✕' : '✓'} {msg}
    </div>
  )
}

function SectionHeader({ count, label, onAdd, addLabel = '+ Agregar' }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
      <p className="text-xs text-gray-500 font-medium">{count} {label}</p>
      {onAdd && (
        <button onClick={onAdd}
          className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium">
          {addLabel}
        </button>
      )}
    </div>
  )
}

function EmptyRow({ cols, text }) {
  return (
    <tr>
      <td colSpan={cols} className="text-center py-12 text-gray-400 text-sm">
        {text}
      </td>
    </tr>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DetalleCotizacion() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  // Datos principales
  const [cot,    setCot]    = useState(null)
  const [allMats, setAllMats] = useState([])   // todos los materiales disponibles
  const [allHers, setAllHers] = useState([])   // todos los herrajes disponibles
  const [allSers, setAllSers] = useState([])   // todos los servicios disponibles
  const [params,  setParams]  = useState({})   // parámetros de ganancia
  const [load,    setLoad]    = useState(true)
  const [tab,     setTab]     = useState('info')
  const [toast,   setToast]   = useState({ msg: '', type: 'success' })

  // Comentarios
  const [comentarios,     setComentarios]     = useState([])
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [enviandoComent,  setEnviandoComent]  = useState(false)

  // Proyecto
  const [proyecto,         setProyecto]         = useState(null)
  const [showProyectoForm, setShowProyectoForm] = useState(false)
  const [proyectoForm,     setProyectoForm]     = useState({ nombre: '', fechaEntrega: '', notas: '' })
  const [creandoProyecto,  setCreandoProyecto]  = useState(false)

  // Tab Info
  const [infoForm,   setInfoForm]   = useState({ descripcionGeneral: '', tiempoEstimadoDias: '', observaciones: '', terminos: '' })
  const [savingInfo, setSavingInfo] = useState(false)

  // Tab Materiales
  const [matSearch,  setMatSearch]  = useState('')
  const [matSelect,  setMatSelect]  = useState(null)
  const [fmat,       setFmat]       = useState({ cantidadPlanchas: 1 })
  const [savingMat,  setSavingMat]  = useState(false)
  const [editMat,    setEditMat]    = useState({})    // { id: cantidadPlanchas }

  // Descuento
  const [descuentoInput, setDescuentoInput] = useState('')
  const [savingDesc,     setSavingDesc]     = useState(false)

  // Tab Herrajes
  const [herSearch,  setHerSearch]  = useState('')
  const [fh,         setFh]         = useState({ herrajeId: '', cantidad: 1 })
  const [showFormH,  setShowFormH]  = useState(false)
  const [editQtyH,   setEditQtyH]   = useState({})

  // Tab Servicios
  const [fs,         setFs]         = useState({ servicioId: '', cantidad: 1 })
  const [showFormS,  setShowFormS]  = useState(false)
  const [editQtyS,   setEditQtyS]   = useState({})

  // Tab Mano de Obra
  const [fmao,       setFmao]       = useState({ descripcion: '', costo: '' })
  const [savingMao,  setSavingMao]  = useState(false)

  const notify = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  // ── Carga inicial ─────────────────────────────────────────────────────────

  const cargar = async () => {
    try {
      const [r1, r2, r3, r4, r5, r6, r7] = await Promise.all([
        cotizacionesService.obtenerCompleta(id),
        materialesService.obtenerTodos(),
        herrajesService.obtenerTodos(),
        serviciosService.obtenerTodos(),
        parametrosService.obtenerTodos(),
        comentariosService.obtenerPorCotizacion(id),
        proyectosService.existePorCotizacion(id),
      ])

      const cotData = r1.data
      setCot(cotData)
      setAllMats(r2.data)
      setAllHers(r3.data)
      setAllSers(r4.data)

      // Convertir lista de params a objeto { clave: valor }
      const paramsObj = {}
      if (Array.isArray(r5.data)) r5.data.forEach(p => { paramsObj[p.clave] = p.valor })
      setParams(paramsObj)

      setComentarios(r6.data)

      // Inicializar form de info desde datos de cotización
      setInfoForm({
        descripcionGeneral:  cotData.descripcionGeneral  || '',
        tiempoEstimadoDias:  cotData.tiempoEstimadoDias  || '',
        observaciones:       cotData.observaciones       || '',
        terminos:            cotData.terminos            || '',
      })
      setDescuentoInput(cotData.descuento > 0 ? String(cotData.descuento) : '')

      if (r7.data.existe) {
        const todos = await proyectosService.obtenerTodos({})
        const proy = todos.data.find(p => String(p.cotizacionId) === String(id))
        setProyecto(proy || null)
      }
    } catch {
      notify('Error al cargar la cotización', 'error')
    } finally {
      setLoad(false)
    }
  }

  useEffect(() => { cargar() }, [id])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const recalcYRecargar = async () => {
    const r = await cotizacionesService.recalcular(id)
    // recalcular retorna la cotización simple (sin listas)
    // cargamos la completa para tener listas actualizadas
    const r2 = await cotizacionesService.obtenerCompleta(id)
    setCot(r2.data)
  }

  const cambiarEstado = async (estado) => {
    await cotizacionesService.actualizarEstado(id, estado)
    setCot(prev => ({ ...prev, estado }))
    notify('Estado actualizado')
  }

  // ── Tab Info ──────────────────────────────────────────────────────────────

  const guardarInfo = async (e) => {
    e.preventDefault()
    setSavingInfo(true)
    try {
      await cotizacionesService.actualizarInfo(id, {
        descripcionGeneral:  infoForm.descripcionGeneral || null,
        tiempoEstimadoDias:  infoForm.tiempoEstimadoDias ? parseInt(infoForm.tiempoEstimadoDias) : null,
        observaciones:       infoForm.observaciones || null,
        terminos:            infoForm.terminos || null,
      })
      setCot(prev => ({ ...prev, ...infoForm, tiempoEstimadoDias: infoForm.tiempoEstimadoDias ? parseInt(infoForm.tiempoEstimadoDias) : null }))
      notify('Información guardada')
    } catch {
      notify('Error al guardar', 'error')
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Tab Materiales ────────────────────────────────────────────────────────

  const matsFiltrados = allMats.filter(m =>
    m.estado !== 0 &&
    (!matSearch.trim() || m.nombre.toLowerCase().includes(matSearch.toLowerCase()))
  ).slice(0, 10)

  const seleccionarMaterial = (m) => {
    setMatSelect(m)
    setMatSearch(m.nombre)
    setFmat({ cantidadPlanchas: 1 })
  }

  const agregarMaterial = async () => {
    if (!matSelect) return
    setSavingMat(true)
    try {
      const r = await cotizacionMaterialesService.agregar(id, {
        materialId:       matSelect.id,
        descripcion:      null,
        cantidadPlanchas: parseFloat(fmat.cantidadPlanchas) || 1,
      })
      // El backend retorna { id, cotizacion: CotizacionSimple }
      const r2 = await cotizacionesService.obtenerCompleta(id)
      setCot(r2.data)
      setMatSelect(null)
      setMatSearch('')
      setFmat({ cantidadPlanchas: 1 })
      notify('Material agregado')
    } catch {
      notify('Error al agregar material', 'error')
    } finally {
      setSavingMat(false)
    }
  }

  const eliminarMaterial = async (itemId) => {
    if (!confirm('¿Eliminar este material?')) return
    await cotizacionMaterialesService.eliminar(id, itemId)
    const r = await cotizacionesService.obtenerCompleta(id)
    setCot(r.data)
    notify('Material eliminado')
  }

  const actualizarCantidadMat = async (item) => {
    const cant = editMat[item.id]
    if (cant === undefined) return
    await cotizacionMaterialesService.actualizar(id, item.id, {
      cantidadPlanchas: parseFloat(cant),
      descripcion:      null,
    })
    const r = await cotizacionesService.obtenerCompleta(id)
    setCot(r.data)
    setEditMat(prev => { const n = { ...prev }; delete n[item.id]; return n })
  }

  const previewMat = () => {
    if (!matSelect) return null
    const cant = parseFloat(fmat.cantidadPlanchas) || 0
    const sub  = (matSelect.precioTablero || 0) * cant
    return isNaN(sub) ? null : sub
  }

  const aplicarDescuento = async () => {
    setSavingDesc(true)
    try {
      await cotizacionesService.actualizarDescuento(id, { descuento: parseFloat(descuentoInput) || 0 })
      const r = await cotizacionesService.obtenerCompleta(id)
      setCot(r.data)
      notify('Descuento aplicado')
    } catch {
      notify('Error al aplicar descuento', 'error')
    } finally {
      setSavingDesc(false)
    }
  }

  // ── Tab Herrajes ──────────────────────────────────────────────────────────

  const hersFiltrados = allHers.filter(h =>
    !herSearch.trim() || h.nombre.toLowerCase().includes(herSearch.toLowerCase())
  )

  const addHerraje = async (e) => {
    e.preventDefault()
    try {
      await detalleHerrajesService.crear({
        cotizacionId:   parseInt(id),
        herrajeId:      parseInt(fh.herrajeId),
        cantidad:       parseInt(fh.cantidad),
        precioUnitario: 0,
        subtotal:       0,
      })
      setFh({ herrajeId: '', cantidad: 1 })
      setShowFormH(false)
      await recalcYRecargar()
      notify('Herraje agregado')
    } catch {
      notify('Error al agregar herraje', 'error')
    }
  }

  const delHerraje = async (hid) => {
    if (!confirm('¿Eliminar este herraje?')) return
    await detalleHerrajesService.eliminar(hid)
    await recalcYRecargar()
    notify('Herraje eliminado')
  }

  const editarCantHerraje = async (h, cant) => {
    if (!cant || cant < 1) return
    await detalleHerrajesService.actualizar(h.id, {
      herrajeId: h.herrajeId, cantidad: parseInt(cant),
      precioUnitario: h.precioUnitario,
      subtotal: parseInt(cant) * h.precioUnitario,
    })
    await recalcYRecargar()
  }

  // ── Tab Servicios ─────────────────────────────────────────────────────────

  const addServicio = async (e) => {
    e.preventDefault()
    try {
      await detalleServiciosService.crear({
        cotizacionId: parseInt(id),
        servicioId:   parseInt(fs.servicioId),
        cantidad:     parseInt(fs.cantidad),
        precio: 0, subtotal: 0,
      })
      setFs({ servicioId: '', cantidad: 1 })
      setShowFormS(false)
      await recalcYRecargar()
      notify('Servicio agregado')
    } catch {
      notify('Error al agregar servicio', 'error')
    }
  }

  const delServicio = async (sid) => {
    if (!confirm('¿Eliminar este servicio?')) return
    await detalleServiciosService.eliminar(sid)
    await recalcYRecargar()
    notify('Servicio eliminado')
  }

  const editarCantServicio = async (s, cant) => {
    if (!cant || cant < 1) return
    await detalleServiciosService.actualizar(s.id, {
      servicioId: s.servicioId, cantidad: parseInt(cant),
      precio: s.precio, subtotal: parseInt(cant) * s.precio,
    })
    await recalcYRecargar()
  }

  // ── Tab Mano de Obra ──────────────────────────────────────────────────────

  const addManoObra = async (e) => {
    e.preventDefault()
    if (!fmao.descripcion.trim() || !fmao.costo) return
    setSavingMao(true)
    try {
      await cotizacionManoObraService.agregar(id, {
        descripcion: fmao.descripcion.trim(),
        costo:       parseFloat(fmao.costo),
      })
      setFmao({ descripcion: '', costo: '' })
      const r = await cotizacionesService.obtenerCompleta(id)
      setCot(r.data)
      notify('Ítem de mano de obra agregado')
    } catch {
      notify('Error al agregar', 'error')
    } finally {
      setSavingMao(false)
    }
  }

  const delManoObra = async (itemId) => {
    if (!confirm('¿Eliminar este ítem?')) return
    await cotizacionManoObraService.eliminar(id, itemId)
    const r = await cotizacionesService.obtenerCompleta(id)
    setCot(r.data)
    notify('Eliminado')
  }

  // ── Tab Resumen — Ganancia ────────────────────────────────────────────────

  const cambiarGanancia = async (tipo, porcentajeManual) => {
    try {
      const r = await cotizacionesService.actualizarGanancia(id, {
        tipo,
        porcentaje: porcentajeManual !== undefined ? parseFloat(porcentajeManual) : undefined,
      })
      // Backend retorna cotización simple; recargamos completa
      const r2 = await cotizacionesService.obtenerCompleta(id)
      setCot(r2.data)
      notify('Ganancia actualizada')
    } catch {
      notify('Error al actualizar ganancia', 'error')
    }
  }

  // ── Comentarios ───────────────────────────────────────────────────────────

  const agregarComentario = async (e) => {
    e.preventDefault()
    if (!nuevoComentario.trim()) return
    setEnviandoComent(true)
    try {
      await comentariosService.agregar({
        cotizacionId:  parseInt(id),
        usuarioId:     usuario?.id || 1,
        usuarioNombre: usuario?.nombre || 'Usuario',
        comentario:    nuevoComentario.trim(),
      })
      setNuevoComentario('')
      const r = await comentariosService.obtenerPorCotizacion(id)
      setComentarios(r.data)
    } catch {
      notify('Error al agregar comentario', 'error')
    } finally {
      setEnviandoComent(false)
    }
  }

  const eliminarComentario = async (comentId) => {
    if (!confirm('¿Eliminar este comentario?')) return
    try {
      await comentariosService.eliminar(comentId)
      setComentarios(prev => prev.filter(c => c.id !== comentId))
    } catch {
      notify('Error', 'error')
    }
  }

  // ── Proyecto ──────────────────────────────────────────────────────────────

  const crearProyecto = async (e) => {
    e.preventDefault()
    setCreandoProyecto(true)
    try {
      await proyectosService.crear({
        cotizacionId: parseInt(id),
        nombre:       proyectoForm.nombre || `Cotización #${id} — ${cot.clienteNombre}`,
        notas:        proyectoForm.notas || null,
        fechaEntrega: proyectoForm.fechaEntrega || null,
      })
      setShowProyectoForm(false)
      notify('Proyecto creado')
      cargar()
    } catch (err) {
      notify(err.response?.data || 'Error al crear proyecto', 'error')
    } finally {
      setCreandoProyecto(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (load) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Cargando cotización...</p>
    </div>
  )
  if (!cot) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-red-500">Cotización no encontrada</p>
    </div>
  )

  const tabCounts = {
    materiales: cot.materiales?.length  || 0,
    herrajes:   cot.herrajes?.length    || 0,
    servicios:  cot.servicios?.length   || 0,
    manoObra:   cot.manoObra?.length    || 0,
  }

  const fmt = (n) => `Q${Number(n || 0).toFixed(2)}`

  return (
    <div className="min-h-screen bg-gray-50 -m-6 p-6">
      <Toast msg={toast.msg} type={toast.type} />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/cotizaciones')}
            className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1 transition">
            ← Cotizaciones
          </button>
          <span className="text-gray-300">/</span>
          <h2 className="text-lg font-semibold text-gray-800">
            COT-{String(cot.id).padStart(3, '0')}
            {cot.descripcionGeneral && (
              <span className="text-sm font-normal text-gray-500 ml-2 truncate max-w-xs inline-block align-middle">
                {cot.descripcionGeneral}
              </span>
            )}
          </h2>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ESTADO_STYLES[cot.estado] || ''}`}>
            {cot.estado}
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/cotizacion-pdf/${id}`)}
            className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium">
            📄 Ver PDF
          </button>
        </div>
      </div>

      <div className="flex gap-5 items-start">

        {/* ── Área principal ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Tabs */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition flex items-center gap-1.5 ${
                    tab === t.key
                      ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {tabCounts[t.key] > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      tab === t.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>{tabCounts[t.key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ─── TAB INFO ─── */}
            {tab === 'info' && (
              <form onSubmit={guardarInfo} className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Descripción del proyecto</label>
                    <textarea
                      value={infoForm.descripcionGeneral}
                      onChange={e => setInfoForm({ ...infoForm, descripcionGeneral: e.target.value })}
                      rows={3}
                      placeholder="Ej: Mueble de cocina en roble, 3 módulos superiores + isla central..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tiempo estimado (días)</label>
                    <input
                      type="number" min="1"
                      value={infoForm.tiempoEstimadoDias}
                      onChange={e => setInfoForm({ ...infoForm, tiempoEstimadoDias: e.target.value })}
                      placeholder="Ej: 15"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div />
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                    <textarea
                      value={infoForm.observaciones}
                      onChange={e => setInfoForm({ ...infoForm, observaciones: e.target.value })}
                      rows={2}
                      placeholder="Notas adicionales para el cliente..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Términos y condiciones</label>
                    <textarea
                      value={infoForm.terminos}
                      onChange={e => setInfoForm({ ...infoForm, terminos: e.target.value })}
                      rows={2}
                      placeholder="Ej: 50% de anticipo para iniciar producción. Saldo contra entrega."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={savingInfo}
                    className="text-sm bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition">
                    {savingInfo ? 'Guardando...' : 'Guardar información'}
                  </button>
                </div>

                {/* Comentarios dentro del tab info */}
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Notas internas</p>
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {comentarios.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-4">Sin notas</p>
                    ) : comentarios.map(c => (
                      <div key={c.id} className="bg-gray-50 rounded-xl px-4 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-700">{c.usuarioNombre}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(c.createdAt).toLocaleDateString('es-GT', { day:'2-digit', month:'short' })}
                              {' '}
                              {new Date(c.createdAt).toLocaleTimeString('es-GT', { hour:'2-digit', minute:'2-digit' })}
                            </span>
                            <button onClick={() => eliminarComentario(c.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition">✕</button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comentario}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={nuevoComentario}
                      onChange={e => setNuevoComentario(e.target.value)}
                      placeholder="Agregar nota interna..."
                      rows={2}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                    <button type="button" onClick={agregarComentario}
                      disabled={enviandoComent || !nuevoComentario.trim()}
                      className="self-end text-sm bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition">
                      {enviandoComent ? '...' : 'Añadir'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ─── TAB MATERIALES ─── */}
            {tab === 'materiales' && (
              <div>
                {/* Buscador */}
                <div className="p-4 border-b border-gray-100 bg-emerald-50/40">
                  <div className="relative">
                    <input
                      type="text"
                      value={matSearch}
                      onChange={e => { setMatSearch(e.target.value); setMatSelect(null) }}
                      placeholder="Buscar material... Ej: MDF 18mm, Plywood, Melamina"
                      className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
                  </div>

                  {/* Resultados del buscador */}
                  {matSearch && !matSelect && matsFiltrados.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      {matsFiltrados.map(m => (
                        <button key={m.id} type="button"
                          onClick={() => seleccionarMaterial(m)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition flex items-center justify-between border-b border-gray-50 last:border-0">
                          <div>
                            <span className="font-medium text-gray-800">{m.nombre}</span>
                            <span className="text-xs text-gray-400 ml-2">{m.tipo} · {m.grosor}mm</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Q{Number(m.precioTablero).toFixed(2)}/plancha
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Form de cantidad una vez seleccionado el material */}
                  {matSelect && (
                    <div className="mt-3 bg-white border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-gray-800">{matSelect.nombre}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Q{Number(matSelect.precioTablero).toFixed(2)}/plancha
                        </span>
                        <button type="button" onClick={() => { setMatSelect(null); setMatSearch('') }}
                          className="ml-auto text-xs text-gray-400 hover:text-gray-600">✕</button>
                      </div>
                      <div className="flex items-end gap-3 mb-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Cantidad de planchas</label>
                          <input type="number" step="0.5" min="0.1"
                            value={fmat.cantidadPlanchas}
                            onChange={e => setFmat({ ...fmat, cantidadPlanchas: e.target.value })}
                            className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        {previewMat() !== null && (
                          <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg font-medium">
                            Subtotal: Q{previewMat().toFixed(2)}
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={agregarMaterial} disabled={savingMat}
                        className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition">
                        {savingMat ? 'Agregando...' : '+ Agregar material'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Tabla de materiales agregados */}
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Material', 'Planchas', 'P. Unit.', 'Subtotal', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!cot.materiales?.length ? (
                      <EmptyRow cols={5} text="Sin materiales — busca y agrega el primero" />
                    ) : cot.materiales.map(m => {
                      const ed = editMat[m.id] || {}
                      return (
                        <tr key={m.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-800">{m.materialNombre}</td>
                          <td className="px-4 py-3">
                            <input type="number" step="0.5" min="0.1"
                              value={editMat[m.id] ?? m.cantidadPlanchas}
                              onChange={e => setEditMat({ ...editMat, [m.id]: e.target.value })}
                              onBlur={() => actualizarCantidadMat(m)}
                              className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmt(m.precioUnitario)}</td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{fmt(m.subtotal)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => eliminarMaterial(m.id)}
                              className="text-xs text-red-400 hover:text-red-600 transition">Quitar</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {cot.materiales?.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={3} className="px-4 py-2.5 text-xs text-gray-500 text-right font-medium">Total materiales</td>
                        <td className="px-4 py-2.5 font-bold text-gray-800">{fmt(cot.totalMateriales)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ─── TAB HERRAJES ─── */}
            {tab === 'herrajes' && (
              <div>
                <SectionHeader
                  count={tabCounts.herrajes} label={`herraje${tabCounts.herrajes !== 1 ? 's' : ''}`}
                  onAdd={() => setShowFormH(!showFormH)}
                />

                {showFormH && (
                  <form onSubmit={addHerraje} className="p-4 bg-emerald-50/50 border-b border-emerald-100">
                    <div className="mb-2">
                      <label className="block text-xs text-gray-500 mb-1">Buscar herraje</label>
                      <input type="text" value={herSearch} onChange={e => setHerSearch(e.target.value)}
                        placeholder="Bisagra, corredera, jalador..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
                      />
                      <select value={fh.herrajeId} onChange={e => setFh({ ...fh, herrajeId: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required size={Math.min(hersFiltrados.length + 1, 5)}>
                        <option value="">— Seleccionar —</option>
                        {hersFiltrados.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.nombre}{h.marca ? ` (${h.marca})` : ''} — Q{Number(h.precioUnitario).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-3 mt-2">
                      <div className="w-28">
                        <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
                        <input type="number" min="1" value={fh.cantidad} onChange={e => setFh({ ...fh, cantidad: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required />
                      </div>
                      {fh.herrajeId && fh.cantidad && (
                        <p className="text-xs text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg font-medium">
                          Sub: Q{((allHers.find(h => String(h.id) === String(fh.herrajeId))?.precioUnitario || 0) * parseInt(fh.cantidad || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="submit"
                        className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
                        Agregar
                      </button>
                      <button type="button" onClick={() => { setShowFormH(false); setFh({ herrajeId: '', cantidad: 1 }); setHerSearch('') }}
                        className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Herraje', 'Marca', 'Cant.', 'P. Unit.', 'Subtotal', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!cot.herrajes?.length ? (
                      <EmptyRow cols={6} text="Sin herrajes" />
                    ) : cot.herrajes.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">{h.herrajeNombre}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{h.herrajeMarca || '—'}</td>
                        <td className="px-4 py-3">
                          <input type="number" min="1"
                            value={editQtyH[`h${h.id}`] ?? h.cantidad}
                            onChange={e => setEditQtyH({ ...editQtyH, [`h${h.id}`]: e.target.value })}
                            onBlur={e => { if (String(e.target.value) !== String(h.cantidad)) editarCantHerraje(h, e.target.value) }}
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(h.precioUnitario)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{fmt(h.subtotal)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => delHerraje(h.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition">Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {cot.herrajes?.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={4} className="px-4 py-2.5 text-xs text-gray-500 text-right font-medium">Total herrajes</td>
                        <td className="px-4 py-2.5 font-bold text-gray-800">{fmt(cot.totalHerrajes)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ─── TAB SERVICIOS ─── */}
            {tab === 'servicios' && (
              <div>
                <SectionHeader
                  count={tabCounts.servicios} label={`servicio${tabCounts.servicios !== 1 ? 's' : ''}`}
                  onAdd={() => setShowFormS(!showFormS)}
                />

                {showFormS && (
                  <form onSubmit={addServicio} className="p-4 bg-emerald-50/50 border-b border-emerald-100">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Servicio *</label>
                        <select value={fs.servicioId} onChange={e => setFs({ ...fs, servicioId: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required>
                          <option value="">Seleccionar...</option>
                          {allSers.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.nombre}{s.proveedor ? ` (${s.proveedor})` : ''} — Q{Number(s.costo).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cantidad *</label>
                        <input type="number" min="1" value={fs.cantidad} onChange={e => setFs({ ...fs, cantidad: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required />
                      </div>
                    </div>
                    {fs.servicioId && (
                      <p className="text-xs text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg mb-3 font-medium">
                        Sub: Q{((allSers.find(s => String(s.id) === String(fs.servicioId))?.costo || 0) * parseInt(fs.cantidad || 1)).toFixed(2)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button type="submit" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">Agregar</button>
                      <button type="button" onClick={() => { setShowFormS(false); setFs({ servicioId: '', cantidad: 1 }) }}
                        className="text-sm border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600">Cancelar</button>
                    </div>
                  </form>
                )}

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Servicio', 'Proveedor', 'Cant.', 'Precio', 'Subtotal', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!cot.servicios?.length ? (
                      <EmptyRow cols={6} text="Sin servicios" />
                    ) : cot.servicios.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">{s.servicioNombre}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{s.servicioProveedor || '—'}</td>
                        <td className="px-4 py-3">
                          <input type="number" min="1"
                            value={editQtyS[`s${s.id}`] ?? s.cantidad}
                            onChange={e => setEditQtyS({ ...editQtyS, [`s${s.id}`]: e.target.value })}
                            onBlur={e => { if (String(e.target.value) !== String(s.cantidad)) editarCantServicio(s, e.target.value) }}
                            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(s.precio)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{fmt(s.subtotal)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => delServicio(s.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition">Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {cot.servicios?.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={4} className="px-4 py-2.5 text-xs text-gray-500 text-right font-medium">Total servicios</td>
                        <td className="px-4 py-2.5 font-bold text-gray-800">{fmt(cot.totalServicios)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ─── TAB MANO DE OBRA ─── */}
            {tab === 'manoObra' && (
              <div>
                <SectionHeader count={tabCounts.manoObra} label="ítem(s)" />

                {/* Formulario de ingreso rápido */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <form onSubmit={addManoObra} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Descripción *</label>
                      <input value={fmao.descripcion} onChange={e => setFmao({ ...fmao, descripcion: e.target.value })}
                        placeholder="Ej: Corte y enchapado, Armado e instalación..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required />
                    </div>
                    <div className="w-36">
                      <label className="block text-xs text-gray-500 mb-1">Costo (Q) *</label>
                      <input type="number" step="0.01" min="0"
                        value={fmao.costo} onChange={e => setFmao({ ...fmao, costo: e.target.value })}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required />
                    </div>
                    <button type="submit" disabled={savingMao}
                      className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition">
                      {savingMao ? '...' : '+ Agregar'}
                    </button>
                  </form>
                </div>

                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Descripción', 'Costo', ''].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!cot.manoObra?.length ? (
                      <EmptyRow cols={3} text="Sin ítems de mano de obra" />
                    ) : cot.manoObra.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-medium text-gray-800">{m.descripcion}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{fmt(m.costo)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => delManoObra(m.id)}
                            className="text-xs text-red-400 hover:text-red-600 transition">Quitar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {cot.manoObra?.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td className="px-4 py-2.5 text-xs text-gray-500 text-right font-medium">Total mano de obra</td>
                        <td className="px-4 py-2.5 font-bold text-gray-800">{fmt(cot.totalManoObra)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* ─── TAB RESUMEN ─── */}
            {tab === 'resumen' && (
              <div className="p-5">
                {/* Desglose de costos (interno) */}
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Costos internos (no aparecen en el PDF del cliente)
                  </p>
                  <div className="space-y-2">
                    {[
                      ['Materiales',   cot.totalMateriales],
                      ['Herrajes',     cot.totalHerrajes],
                      ['Servicios',    cot.totalServicios],
                      ['Mano de obra', cot.totalManoObra],
                    ].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{l}</span>
                        <span className="text-sm font-medium text-gray-800">{fmt(v)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 pt-2 mt-1 flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Subtotal costos</span>
                      <span className="text-sm font-bold text-gray-900">{fmt(cot.subtotalCostos)}</span>
                    </div>
                  </div>
                </div>

                {/* Selector de ganancia */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Tipo de acabado / Ganancia</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                    {[
                      { tipo: 'basico',   label: 'Básico',   pct: params.ganancia_basico  || '20' },
                      { tipo: 'normal',   label: 'Normal',   pct: params.ganancia_normal  || '35' },
                      { tipo: 'premium',  label: 'Premium',  pct: params.ganancia_premium || '55' },
                    ].map(opt => (
                      <button key={opt.tipo} type="button"
                        onClick={() => cambiarGanancia(opt.tipo)}
                        className={`py-3 px-4 rounded-xl border-2 text-left transition ${
                          cot.tipoAcabado === opt.tipo
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.pct}% ganancia</p>
                      </button>
                    ))}
                    <div className={`py-3 px-4 rounded-xl border-2 transition ${
                      cot.tipoAcabado === 'manual' ? 'border-emerald-600 bg-emerald-50' : 'border-gray-200'
                    }`}>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Manual</p>
                      <div className="flex items-center gap-1">
                        <input type="number" min="0" max="999" step="1"
                          defaultValue={cot.tipoAcabado === 'manual' ? cot.porcentajeGanancia : ''}
                          placeholder="0"
                          id="inputGananciaManual"
                          className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                        <span className="text-xs text-gray-500">%</span>
                        <button type="button"
                          onClick={() => {
                            const v = document.getElementById('inputGananciaManual').value
                            if (v) cambiarGanancia('manual', v)
                          }}
                          className="text-xs bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700 transition">
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descuento */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Descuento (opcional)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Q</span>
                    <input type="number" step="0.01" min="0"
                      value={descuentoInput}
                      onChange={e => setDescuentoInput(e.target.value)}
                      placeholder="0.00"
                      className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button type="button" onClick={aplicarDescuento} disabled={savingDesc}
                      className="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 font-medium transition">
                      {savingDesc ? '...' : 'Aplicar'}
                    </button>
                    {cot.descuento > 0 && (
                      <span className="text-xs text-emerald-600 font-medium">Descuento activo: {fmt(cot.descuento)}</span>
                    )}
                  </div>
                </div>

                {/* Total final */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">Subtotal costos</span>
                    <span className="text-sm text-slate-300">{fmt(cot.subtotalCostos)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-300">
                      Ganancia ({Number(cot.porcentajeGanancia).toFixed(0)}% · {cot.tipoAcabado})
                    </span>
                    <span className="text-sm text-slate-300">+ {fmt(cot.montoGanancia)}</span>
                  </div>
                  {cot.descuento > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-emerald-300">Descuento</span>
                      <span className="text-sm text-emerald-300">- {fmt(cot.descuento)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">PRECIO TOTAL AL CLIENTE</span>
                    <span className="text-3xl font-bold text-white">{fmt(cot.total)}</span>
                  </div>
                  {cot.tiempoEstimadoDias && (
                    <p className="text-xs text-slate-400 mt-2">
                      Tiempo estimado: {cot.tiempoEstimadoDias} días hábiles
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Panel lateral ── */}
        <div className="w-68 shrink-0 space-y-4" style={{ width: '272px' }}>

          {/* Cliente */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cliente</p>
            <p className="font-semibold text-gray-800 text-sm">{cot.clienteNombre}</p>
            {cot.clienteTelefono && <p className="text-xs text-gray-500 mt-1">📞 {cot.clienteTelefono}</p>}
            {cot.clienteEmail    && <p className="text-xs text-gray-500 mt-0.5">✉ {cot.clienteEmail}</p>}
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 space-y-0.5">
              <p>Fecha: {new Date(cot.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p>Vendedor: {cot.usuarioNombre || '—'}</p>
            </div>
          </div>

          {/* Estado */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estado</p>
            <div className="grid grid-cols-2 gap-2">
              {['pendiente', 'aprobada', 'rechazada', 'cancelada'].map(e => (
                <button key={e} onClick={() => cambiarEstado(e)}
                  className={`text-xs py-2 rounded-lg border font-medium capitalize transition ${
                    cot.estado === e
                      ? ESTADO_STYLES[e] + ' ring-2 ring-offset-1 ring-current'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de precios */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Precio cotización</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Materiales</span>
                <span>{fmt(cot.totalMateriales)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Herrajes</span>
                <span>{fmt(cot.totalHerrajes)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Servicios</span>
                <span>{fmt(cot.totalServicios)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Mano de obra</span>
                <span>{fmt(cot.totalManoObra)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 italic">
                <span>Ganancia ({Number(cot.porcentajeGanancia).toFixed(0)}%)</span>
                <span>+ {fmt(cot.montoGanancia)}</span>
              </div>
              {cot.descuento > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                  <span>Descuento</span>
                  <span>- {fmt(cot.descuento)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Total cliente</span>
                <span className="text-xl font-bold text-gray-900">{fmt(cot.total)}</span>
              </div>
            </div>
          </div>

          {/* Proyecto */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Producción</p>
            {proyecto ? (
              <div>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium inline-block mb-2 ${
                  proyecto.estado === 'finalizado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  proyecto.estado === 'en_proceso' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {proyecto.estado === 'en_proceso' ? 'En proceso' :
                   proyecto.estado === 'finalizado' ? 'Finalizado' : 'Pendiente'}
                </span>
                <p className="text-sm font-medium text-gray-700 truncate">{proyecto.nombre}</p>
                <button onClick={() => navigate('/proyectos')}
                  className="mt-2 w-full text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 font-medium">
                  Ver en Proyectos →
                </button>
              </div>
            ) : cot.estado === 'aprobada' ? (
              <div>
                {!showProyectoForm ? (
                  <button onClick={() => {
                    setProyectoForm({ nombre: `Cotización #${id} — ${cot.clienteNombre}`, fechaEntrega: '', notas: '' })
                    setShowProyectoForm(true)
                  }}
                    className="w-full text-xs bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-medium">
                    + Crear proyecto
                  </button>
                ) : (
                  <form onSubmit={crearProyecto} className="space-y-2">
                    <input value={proyectoForm.nombre}
                      onChange={e => setProyectoForm({ ...proyectoForm, nombre: e.target.value })}
                      placeholder="Nombre del proyecto"
                      className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required />
                    <input type="date" value={proyectoForm.fechaEntrega}
                      onChange={e => setProyectoForm({ ...proyectoForm, fechaEntrega: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    <div className="flex gap-2">
                      <button type="submit" disabled={creandoProyecto}
                        className="flex-1 text-xs bg-emerald-600 text-white py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium">
                        {creandoProyecto ? '...' : 'Crear'}
                      </button>
                      <button type="button" onClick={() => setShowProyectoForm(false)}
                        className="text-xs border border-gray-300 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                        X
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Solo disponible para cotizaciones aprobadas</p>
            )}
          </div>

          {/* Acciones */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
            <button onClick={() => navigate(`/cotizacion-pdf/${id}`)}
              className="w-full bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 font-medium">
              📄 Generar PDF
            </button>
            <button onClick={() => navigate('/optimizador')}
              className="w-full border border-gray-200 text-gray-700 text-sm py-2.5 rounded-lg hover:bg-gray-50 font-medium">
              ⚡ Optimizador de cortes
            </button>
            {cot.estado === 'aprobada' && (
              <button onClick={() => navigate(`/ventas?cotizacion=${id}`)}
                className="w-full bg-emerald-600 text-white text-sm py-2.5 rounded-lg hover:bg-emerald-700 font-medium">
                💰 Registrar venta
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
