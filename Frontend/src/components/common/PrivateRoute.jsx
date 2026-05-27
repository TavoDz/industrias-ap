import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../layout/Layout'

export default function PrivateRoute({ children, rol, roles }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  const allowed = roles || (rol ? [rol] : null)
  if (allowed && !allowed.includes(usuario.rol)) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}
