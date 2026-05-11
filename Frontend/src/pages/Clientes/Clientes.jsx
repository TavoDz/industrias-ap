import { useEffect, useState } from 'react'
import { clientesService } from '../../services'

const formInicial = { nombre: '', telefono: '', email: '', direccion: '' }

export default function Clientes() {
  const [clientes, setClientes]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState(formInicial)

  const cargar = async () => {
    try {
      const res = await clientesService.obtenerTodos()
      setClientes(res.data)
    } catch { setError('Error al cargar clientes') }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setEditando(null); setForm(formInicial); setMostrarForm(true) }
  const abrirEditar = (c) => { setEditando(c.id); setForm({ nombre: c.nombre, telefono: c.telefono||'', email: c.email||'', direccion: c.direccion||'' }); setMostrarForm(true) }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      if (editando) await clientesService.actualizar(editando, form)
      else          await clientesService.crear(form)
      setMostrarForm(false); cargar()
    } catch { setError('Error al guardar cliente') }
  }

  const eliminar = async (id) => {
    if (!confirm('Eliminar este cliente?')) return
    try { await clientesService.eliminar(id); cargar() }
    catch { setError('Error al eliminar') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Clientes</h2>
        <button onClick={abrirNuevo} className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">+ Nuevo cliente</button>
      </div>
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded mb-4">{error}</div>}
      {mostrarForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <form onSubmit={guardar} className="grid grid-cols-2 gap-4">
            {[['Nombre','nombre',true],['Telefono','telefono'],['Email','email'],['Direccion','direccion']].map(([label,key,req]) => (
              <div key={key}>
                <label className="block text-sm text-gray-600 mb-1">{label}{req?' *':''}</label>
                <input value={form[key]} onChange={e => setForm({...form,[key]:e.target.value})}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required={!!req} />
              </div>
            ))}
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setMostrarForm(false)} className="text-sm px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="text-sm px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <p className="text-sm text-gray-500">Cargando...</p> : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Nombre','Telefono','Email','Direccion',''].map(h => <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.length===0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Sin clientes</td></tr>
              : clientes.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono||'—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email||'—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.direccion||'—'}</td>
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    <button onClick={() => abrirEditar(c)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => eliminar(c.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
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
