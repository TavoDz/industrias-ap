import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  dashboard:      'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  clientes:       'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  cotizaciones:   'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  materiales:     'M2 20h20M5 20V8l7-5 7 5v12M9 20v-5h6v5',
  herrajes:       'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  servicios:      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  inventario:     'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
  usuarios:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  optimizador:    'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  optimizaciones: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 0-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4z',
  proyectos:      'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',
  ventas:         'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-8 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  caja:           'M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2zm7-5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
  logout:         'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

const menu = [
  { path: '/dashboard',    label: 'Dashboard',    icon: 'dashboard' },
  { path: '/clientes',     label: 'Clientes',     icon: 'clientes' },
  { path: '/cotizaciones', label: 'Cotizaciones', icon: 'cotizaciones' },
  { path: '/materiales',   label: 'Materiales',   icon: 'materiales' },
  { path: '/herrajes',     label: 'Herrajes',     icon: 'herrajes' },
  { path: '/servicios',    label: 'Servicios',    icon: 'servicios' },
  { path: '/inventario',   label: 'Inventario',   icon: 'inventario' },
  { path: '/usuarios',     label: 'Usuarios',     icon: 'usuarios',  roles: ['admin'] },
]

const menuOptimizador = [
  { path: '/optimizador',           label: 'Nuevo corte', icon: 'optimizador' },
  { path: '/optimizaciones',        label: 'Historial',   icon: 'optimizaciones' },
  { path: '/optimizador-avanzado',  label: 'Avanzado',    icon: 'optimizador' },
]

const menuProduccion = [
  { path: '/proyectos', label: 'Proyectos', icon: 'proyectos', roles: ['admin', 'produccion'] },
]

const menuVentas = [
  { path: '/ventas', label: 'Ventas',  icon: 'ventas' },
  { path: '/caja',   label: 'Caja',    icon: 'caja'   },
]

function NavItem({ item, active }) {
  return (
    <Link
      to={item.path}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
      }`}>
      <span className="shrink-0 opacity-80">
        <Icon d={icons[item.icon]} />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export default function Layout({ children }) {
  const { usuario, logout } = useAuth()
  const location            = useLocation()
  const navigate            = useNavigate()

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => { logout(); navigate('/login') }

  const puedeVer = (item) => {
    if (item.roles) return item.roles.includes(usuario?.rol)
    if (item.rol)   return item.rol === usuario?.rol
    return true
  }
  const menuFiltrado      = menu.filter(puedeVer)
  const menuProdFiltrado  = menuProduccion.filter(puedeVer)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 flex flex-col shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22" fill="none" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-white text-sm leading-none">Industrias AP</h1>
              <p className="text-xs text-slate-500 mt-0.5">Sistema de Carpintería</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
              {usuario?.nombre?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{usuario?.nombre}</p>
              <span className="text-[10px] text-slate-500 capitalize">{usuario?.rol}</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuFiltrado.map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}

          {/* Separador optimizador */}
          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Optimizador
            </p>
          </div>
          {menuOptimizador.map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}

          {/* Separador ventas */}
          <div className="pt-3 pb-1 px-3">
            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
              Ventas
            </p>
          </div>
          {menuVentas.map(item => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}

          {/* Separador producción */}
          {menuProdFiltrado.length > 0 && (
            <>
              <div className="pt-3 pb-1 px-3">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                  Producción
                </p>
              </div>
              {menuProdFiltrado.map(item => (
                <NavItem key={item.path} item={item} active={isActive(item.path)} />
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition">
            <span className="shrink-0"><Icon d={icons.logout} /></span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-screen-xl mx-auto">{children}</div>
      </main>

    </div>
  )
}
