import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { usuario } = useAuth()
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-1">Bienvenido, {usuario?.nombre}</h2>
      <p className="text-gray-500 text-sm mb-6">Panel de control</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clientes',     link: '/clientes' },
          { label: 'Cotizaciones', link: '/cotizaciones' },
          { label: 'Materiales',   link: '/materiales' },
          { label: 'Inventario',   link: '/inventario' },
          
        ].map(card => (
          <a key={card.label} href={card.link}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition text-center">
            <p className="text-sm font-medium text-gray-700">{card.label}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
