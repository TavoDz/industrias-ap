import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute    from './components/common/PrivateRoute'
import Login           from './pages/Login/Login'
import Dashboard       from './pages/Dashboard'
import Clientes        from './pages/Clientes/Clientes'
import Materiales      from './pages/Materiales/Materiales'
import Herrajes        from './pages/Herrajes/Herrajes'
import Servicios       from './pages/Servicios/Servicios'
import Cotizaciones    from './pages/Cotizaciones/Cotizaciones'
import DetalleCotizacion from './pages/Cotizaciones/DetalleCotizacion'
import Usuarios          from './pages/Usuarios/Usuarios'
import Inventario from './pages/Inventario/Inventario'
import CotizacionPDF from './pages/Cotizaciones/CotizacionPDF'
import Optimizador from './pages/Optimizador/Optimizador'
import Optimizaciones from './pages/Optimizaciones/Optimizaciones'
import OptimizadorAvanzado from './pages/OptimizadorAvanzado/OptimizadorAvanzado'
import Proyectos from './pages/Proyectos/Proyectos'
import Ventas    from './pages/Ventas/Ventas'
import Caja      from './pages/Caja/Caja'

const Placeholder = ({ titulo }) => (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-2">{titulo}</h2>
    <p className="text-gray-500 text-sm">Esta sección está en construcción.</p>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/clientes"  element={<PrivateRoute><Clientes /></PrivateRoute>} />
          <Route path="/materiales" element={<PrivateRoute><Materiales /></PrivateRoute>} />
          <Route path="/herrajes"   element={<PrivateRoute><Herrajes /></PrivateRoute>} />
          <Route path="/servicios"  element={<PrivateRoute><Servicios /></PrivateRoute>} />
          <Route path="/inventario" element={<PrivateRoute><Inventario/></PrivateRoute>}/>
          <Route path="/cotizaciones"    element={<PrivateRoute><Cotizaciones /></PrivateRoute>} />
          <Route path="/cotizacion-pdf/:id" element={<PrivateRoute><CotizacionPDF /></PrivateRoute>} />
          <Route path="/cotizaciones/:id" element={<PrivateRoute><DetalleCotizacion /></PrivateRoute>} />
         <Route path="/usuarios"      element={<PrivateRoute rol="admin"><Usuarios/></PrivateRoute>}/>
         <Route path="/optimizador" element={<PrivateRoute><Optimizador /></PrivateRoute>} />
         <Route path="/optimizaciones" element={<PrivateRoute><Optimizaciones /></PrivateRoute>} />
         <Route path="/optimizador-avanzado" element={<PrivateRoute><OptimizadorAvanzado /></PrivateRoute>} />
         <Route path="/proyectos" element={<PrivateRoute roles={['admin','produccion']}><Proyectos /></PrivateRoute>} />
         <Route path="/ventas"   element={<PrivateRoute><Ventas /></PrivateRoute>} />
         <Route path="/caja"     element={<PrivateRoute><Caja /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
