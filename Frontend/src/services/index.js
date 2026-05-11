import api from './api'

export const clientesService = {
  obtenerTodos:  ()            => api.get('/Clientes'),
  obtenerPorId:  (id)          => api.get(`/Clientes/${id}`),
  crear:         (datos)       => api.post('/Clientes', datos),
  actualizar:    (id, datos)   => api.put(`/Clientes/${id}`, datos),
  eliminar:      (id)          => api.delete(`/Clientes/${id}`)
}

export const materialesService = {
  obtenerTodos:  ()            => api.get('/Materiales'),
  obtenerPorId:  (id)          => api.get(`/Materiales/${id}`),
  crear:         (datos)       => api.post('/Materiales', datos),
  actualizar:    (id, datos)   => api.put(`/Materiales/${id}`, datos),
  eliminar:      (id)          => api.delete(`/Materiales/${id}`)
}

export const herrajesService = {
  obtenerTodos:  ()            => api.get('/Herrajes'),
  obtenerPorId:  (id)          => api.get(`/Herrajes/${id}`),
  crear:         (datos)       => api.post('/Herrajes', datos),
  actualizar:    (id, datos)   => api.put(`/Herrajes/${id}`, datos),
  eliminar:      (id)          => api.delete(`/Herrajes/${id}`)
}

export const serviciosService = {
  obtenerTodos:  ()            => api.get('/ServiciosExternos'),
  obtenerPorId:  (id)          => api.get(`/ServiciosExternos/${id}`),
  crear:         (datos)       => api.post('/ServiciosExternos', datos),
  actualizar:    (id, datos)   => api.put(`/ServiciosExternos/${id}`, datos),
  eliminar:      (id)          => api.delete(`/ServiciosExternos/${id}`)
}

export const tapacantosService = {
  obtenerTodos:  ()            => api.get('/Tapacantos'),
  crear:         (datos)       => api.post('/Tapacantos', datos),
  actualizar:    (id, datos)   => api.put(`/Tapacantos/${id}`, datos),
  eliminar:      (id)          => api.delete(`/Tapacantos/${id}`)
}

export const inventarioService = {
  obtenerTodos:  ()            => api.get('/Inventario'),
  crear:         (datos)       => api.post('/Inventario', datos),
  actualizar:    (id, datos)   => api.put(`/Inventario/${id}`, datos),
  eliminar:      (id)          => api.delete(`/Inventario/${id}`)
}

export const cotizacionesService = {
  obtenerTodos:      ()            => api.get('/Cotizaciones'),
  obtenerPorId:      (id)          => api.get(`/Cotizaciones/${id}`),
  obtenerPorCliente: (clienteId)   => api.get(`/Cotizaciones/cliente/${clienteId}`),
  obtenerCompleta:   (id)          => api.get(`/CotizacionCompleta/${id}`),
  crear:             (datos)       => api.post('/Cotizaciones', datos),
  actualizarEstado:  (id, estado)  => api.put(`/Cotizaciones/${id}/estado`, JSON.stringify(estado), { headers: { 'Content-Type': 'application/json' }}),
  recalcular:        (id)          => api.put(`/Cotizaciones/${id}/recalcular`),
  eliminar:          (id)          => api.delete(`/Cotizaciones/${id}`)
}

export const piezasService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/PiezasCorte/cotizacion/${cotizacionId}`),
  crear:                (datos)        => api.post('/PiezasCorte', datos),
  actualizar:           (id, datos)    => api.put(`/PiezasCorte/${id}`, datos),
  eliminar:             (id)           => api.delete(`/PiezasCorte/${id}`)
}

export const detalleHerrajesService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/DetalleHerrajes/cotizacion/${cotizacionId}`),
  crear:                (datos)        => api.post('/DetalleHerrajes', datos),
  actualizar:           (id, datos)    => api.put(`/DetalleHerrajes/${id}`, datos),
  eliminar:             (id)           => api.delete(`/DetalleHerrajes/${id}`)
}

export const detalleServiciosService = {
  obtenerPorCotizacion: (cotizacionId) => api.get(`/DetalleServicios/cotizacion/${cotizacionId}`),
  crear:                (datos)        => api.post('/DetalleServicios', datos),
  actualizar:           (id, datos)    => api.put(`/DetalleServicios/${id}`, datos),
  eliminar:             (id)           => api.delete(`/DetalleServicios/${id}`)
}

export const usuariosService = {
  obtenerTodos:    ()            => api.get('/Usuarios'),
  obtenerPorId:    (id)          => api.get(`/Usuarios/${id}`),
  crear:           (datos)       => api.post('/Usuarios', datos),
  actualizar:      (id, datos)   => api.put(`/Usuarios/${id}`, datos),
  cambiarPassword: (id, datos)   => api.put(`/Usuarios/${id}/password`, datos),
  eliminar:        (id)          => api.delete(`/Usuarios/${id}`)
}

export const authService = {
  login: (datos) => api.post('/Auth/login', datos)
}
