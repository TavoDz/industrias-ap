import { useEffect, useState } from 'react'
import { herrajesService } from '../../services'

const formInicial = { nombre: '', marca: '', precioUnitario: '' }

export default function Herrajes() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [show,    setShow]    = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState(formInicial)
  const [buscar,  setBuscar]  = useState('')

  const cargar = async () => {
    try {
      const r = await herrajesService.obtenerTodos()
      setData(r.data)
    } catch {
      setError('Error al cargar herrajes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditId(null)
    setForm(formInicial)
    setShow(true)
  }

  const abrirEditar = (h) => {
    setEditId(h.id)
    setForm({ nombre: h.nombre, marca: h.marca || '', precioUnitario: h.precioUnitario })
    setShow(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = { ...form, precioUnitario: parseFloat(form.precioUnitario) }
      if (editId) await herrajesService.actualizar(editId, datos)
      else        await herrajesService.crear(datos)
      setShow(false)
      cargar()
    } catch {
      setError('Error al guardar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este herraje?')) return
    try {
      await herrajesService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  const filtrados = data.filter(h =>
    h.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (h.marca || '').toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Herrajes</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} registrados</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Nuevo herraje
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {show && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar herraje' : 'Nuevo herraje'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Nombre *', key: 'nombre',         req: true  },
              { label: 'Marca',    key: 'marca',          req: false },
              { label: 'Precio Q', key: 'precioUnitario', req: true  },
            ].map(({ label, key, req }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  type={key === 'precioUnitario' ? 'number' : 'text'}
                  step={key === 'precioUnitario' ? '0.01' : undefined}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required={req}
                />
              </div>
            ))}
            <div className="col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={() => setShow(false)}
                className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit"
                className="text-sm px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          placeholder="Buscar por nombre o marca..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Nombre', 'Marca', 'Precio unitario', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    {buscar ? 'Sin resultados' : 'Sin herrajes registrados'}
                  </td>
                </tr>
              ) : filtrados.map(h => (
                <tr key={h.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{h.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{h.marca || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">Q{Number(h.precioUnitario).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-3 justify-end">
                    <button onClick={() => abrirEditar(h)}
                      className="text-xs text-emerald-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(h.id)}
                      className="text-xs text-red-500 hover:underline">Eliminar</button>
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
