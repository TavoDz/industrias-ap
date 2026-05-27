import { useEffect, useState } from 'react'
import { materialesService } from '../../services'

const formInicial = { nombre: '', tipo: '', grosor: '', largo: '', ancho: '', precioTablero: '' }

export default function Materiales() {
  const [materiales,  setMateriales]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [form,        setForm]        = useState(formInicial)
  const [buscar,      setBuscar]      = useState('')
  const [unidadGrosor, setUnidadGrosor] = useState('mm')

  const cargar = async () => {
    try {
      const res = await materialesService.obtenerTodos()
      setMateriales(res.data)
      setError('')
    } catch (e) {
      setError('Error al cargar materiales: ' + (e.response?.status || e.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm(formInicial)
    setUnidadGrosor('mm')
    setMostrarForm(true)
  }

  const abrirEditar = (m) => {
    setEditando(m.id)
    setForm({
      nombre: m.nombre,
      tipo: m.tipo || '',
      grosor: m.grosor,
      largo: m.largo,
      ancho: m.ancho,
      precioTablero: m.precioTablero
    })
    setUnidadGrosor('mm')
    setMostrarForm(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const grosorMm = unidadGrosor === 'in'
        ? parseFloat(form.grosor) * 25.4
        : parseFloat(form.grosor)
      const datos = {
        ...form,
        grosor:        grosorMm,
        largo:         parseFloat(form.largo),
        ancho:         parseFloat(form.ancho),
        precioTablero: parseFloat(form.precioTablero)
      }
      if (editando) await materialesService.actualizar(editando, datos)
      else          await materialesService.crear(datos)
      setMostrarForm(false)
      cargar()
    } catch (e) {
      setError('Error al guardar: ' + (e.response?.data || e.message))
    }
  }

  const eliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await materialesService.eliminar(id)
      cargar()
    } catch (e) {
      setError('Error al eliminar: ' + (e.response?.data || e.message))
    }
  }

  const filtrados = materiales.filter(m =>
    m.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (m.tipo || '').toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Materiales</h2>
          <p className="text-sm text-gray-500 mt-0.5">{materiales.length} registrados</p>
        </div>
        <button
          onClick={abrirNuevo}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nuevo material
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">
            {editando ? 'Editar material' : 'Nuevo material'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
              <input
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Tipo</label>
              <input
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
                placeholder="melamina, MDF, plywood..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Grosor</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={form.grosor}
                  onChange={e => setForm({ ...form, grosor: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={unidadGrosor}
                  onChange={e => { setUnidadGrosor(e.target.value); setForm({ ...form, grosor: '' }) }}
                  className="border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="mm">mm</option>
                  <option value="in">pulg</option>
                </select>
              </div>
              {unidadGrosor === 'in' && form.grosor && (
                <p className="text-xs text-gray-400 mt-1">
                  = {(parseFloat(form.grosor) * 25.4).toFixed(2)} mm
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Largo (mm)</label>
              <input
                type="number"
                value={form.largo}
                onChange={e => setForm({ ...form, largo: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ancho (mm)</label>
              <input
                type="number"
                value={form.ancho}
                onChange={e => setForm({ ...form, ancho: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Precio tablero (Q)</label>
              <input
                type="number"
                step="0.01"
                value={form.precioTablero}
                onChange={e => setForm({ ...form, precioTablero: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Buscador */}
      <div className="mb-4 flex items-center gap-3">
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre o tipo..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {buscar && (
          <span className="text-xs text-gray-400">
            {filtrados.length} de {materiales.length} materiales
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
          Cargando...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Tipo', 'Grosor', 'Largo', 'Ancho', 'Precio tablero', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    {buscar ? (
                      <p className="text-gray-400 text-sm">Sin resultados para "{buscar}"</p>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">No hay materiales registrados</p>
                        <button onClick={abrirNuevo}
                          className="text-sm text-blue-600 hover:underline font-medium">
                          Agregar primer material →
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : filtrados.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{m.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{m.tipo || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {m.grosor} mm
                    <span className="text-gray-400 text-xs ml-1">({(m.grosor / 25.4).toFixed(3)}")</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.largo} mm</td>
                  <td className="px-4 py-3 text-gray-600">{m.ancho} mm</td>
                  <td className="px-4 py-3 font-medium text-gray-700">Q{Number(m.precioTablero).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-3 justify-end">
                    <button onClick={() => abrirEditar(m)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(m.id, m.nombre)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
