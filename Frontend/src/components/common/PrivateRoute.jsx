import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Layout from '../layout/Layout'

export default function PrivateRoute({ children, rol }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" replace />
  if (rol && usuario.rol !== rol) return <Navigate to="/dashboard" replace />
  return <Layout>{children}</Layout>
}
