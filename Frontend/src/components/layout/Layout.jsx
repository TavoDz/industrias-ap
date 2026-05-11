import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menu = [
  { path: '/dashboard',    label: 'Dashboard' },
  { path: '/clientes',     label: 'Clientes' },
  { path: '/cotizaciones', label: 'Cotizaciones' },
  { path: '/materiales',   label: 'Materiales' },
  { path: '/herrajes',     label: 'Herrajes' },
  { path: '/servicios',    label: 'Servicios' },
  { path: '/inventario',   label: 'Inventario' },
  { path: '/usuarios',     label: 'Usuarios', rol: 'admin' },
  { path: '/optimizador', label: '🔧 Optimizador' }
]

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const location            = useLocation()
  const navigate            = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuFiltrado = menu.filter(item => !item.rol || item.rol === usuario?.rol)

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="font-bold text-base">Insutrias AP</h1>
          <p className="text-xs text-gray-400 mt-1">{usuario?.nombre}</p>
          <span className="text-xs bg-blue-700 px-2 py-0.5 rounded mt-1 inline-block">
            {usuario?.rol}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {menuFiltrado.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded text-sm transition ${
                location.pathname.startsWith(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-400 hover:text-white px-3 py-2 rounded hover:bg-gray-700 transition"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
