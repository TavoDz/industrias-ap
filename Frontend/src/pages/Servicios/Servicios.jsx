import { useEffect, useState } from 'react'
import { serviciosService } from '../../services'

const formInicial = { nombre: '', proveedor: '', costo: '' }

export default function Servicios() {
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [show,    setShow]    = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState(formInicial)
  const [buscar,  setBuscar]  = useState('')

  const cargar = async () => {
    try {
      const r = await serviciosService.obtenerTodos()
      setData(r.data)
    } catch {
      setError('Error al cargar servicios')
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

  const abrirEditar = (s) => {
    setEditId(s.id)
    setForm({ nombre: s.nombre, proveedor: s.proveedor || '', costo: s.costo })
    setShow(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = { ...form, costo: parseFloat(form.costo) }
      if (editId) await serviciosService.actualizar(editId, datos)
      else        await serviciosService.crear(datos)
      setShow(false)
      cargar()
    } catch {
      setError('Error al guardar')
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este servicio?')) return
    try {
      await serviciosService.eliminar(id)
      cargar()
    } catch {
      setError('Error al eliminar')
    }
  }

  const filtrados = data.filter(s =>
    s.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
    (s.proveedor || '').toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Servicios Externos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} registrados</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Nuevo servicio
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
      )}

      {show && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {editId ? 'Editar servicio' : 'Nuevo servicio'}
          </h3>
          <form onSubmit={guardar} className="grid grid-cols-3 gap-4">
            {[
              { label: 'Nombre *',    key: 'nombre',    req: true  },
              { label: 'Proveedor',   key: 'proveedor', req: false },
              { label: 'Costo Q *',   key: 'costo',     req: true  },
            ].map(({ label, key, req }) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  type={key === 'costo' ? 'number' : 'text'}
                  step={key === 'costo' ? '0.01' : undefined}
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
          placeholder="Buscar por nombre o proveedor..."
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
                {['Nombre', 'Proveedor', 'Costo', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    {buscar ? 'Sin resultados' : 'Sin servicios registrados'}
                  </td>
                </tr>
              ) : filtrados.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{s.proveedor || '—'}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">Q{Number(s.costo).toFixed(2)}</td>
                  <td className="px-4 py-3 flex gap-3 justify-end">
                    <button onClick={() => abrirEditar(s)}
                      className="text-xs text-emerald-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(s.id)}
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
