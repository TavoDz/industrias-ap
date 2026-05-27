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
  obtenerTodos:     ()            => api.get('/Inventario'),
  obtenerDisponible:()            => api.get('/Inventario/disponible'),
  crear:            (datos)       => api.post('/Inventario', datos),
  actualizar:       (id, datos)   => api.put(`/Inventario/${id}`, datos),
  eliminar:         (id)          => api.delete(`/Inventario/${id}`)
}

export const cotizacionesService = {
  obtenerTodos:      ()            => api.get('/Cotizaciones'),
  obtenerPorId:      (id)          => api.get(`/Cotizaciones/${id}`),
  obtenerPorCliente: (clienteId)   => api.get(`/Cotizaciones/cliente/${clienteId}`),
  obtenerCompleta:   (id)          => api.get(`/CotizacionCompleta/${id}`),
  crear:             (datos)       => api.post('/Cotizaciones', datos),
  actualizarEstado:  (id, estado)  => api.put(`/Cotizaciones/${id}/estado`, JSON.stringify(estado), { headers: { 'Content-Type': 'application/json' }}),
  actualizarInfo:    (id, datos)   => api.put(`/Cotizaciones/${id}/info`, datos),
  actualizarGanancia: (id, datos)  => api.put(`/Cotizaciones/${id}/ganancia`, datos),
  actualizarDescuento:(id, datos)  => api.put(`/Cotizaciones/${id}/descuento`, datos),
  recalcular:         (id)         => api.put(`/Cotizaciones/${id}/recalcular`),
  eliminar:          (id)          => api.delete(`/Cotizaciones/${id}`)
}

export const cotizacionMaterialesService = {
  obtenerPorCotizacion: (cotizacionId)           => api.get(`/Cotizaciones/${cotizacionId}/materiales`),
  agregar:              (cotizacionId, datos)     => api.post(`/Cotizaciones/${cotizacionId}/materiales`, datos),
  actualizar:           (cotizacionId, id, datos) => api.put(`/Cotizaciones/${cotizacionId}/materiales/${id}`, datos),
  eliminar:             (cotizacionId, id)        => api.delete(`/Cotizaciones/${cotizacionId}/materiales/${id}`),
}

export const cotizacionManoObraService = {
  obtenerPorCotizacion: (cotizacionId)       => api.get(`/Cotizaciones/${cotizacionId}/mano-obra`),
  agregar:              (cotizacionId, datos) => api.post(`/Cotizaciones/${cotizacionId}/mano-obra`, datos),
  eliminar:             (cotizacionId, id)    => api.delete(`/Cotizaciones/${cotizacionId}/mano-obra/${id}`),
}

export const parametrosService = {
  obtenerTodos: ()             => api.get('/Parametros'),
  actualizar:   (clave, valor) => api.put(`/Parametros/${clave}`, JSON.stringify(valor), { headers: { 'Content-Type': 'application/json' }}),
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

export const optimizacionesService = {
  listar:    (params)       => api.get('/Optimizer', { params }),
  obtener:   (id)           => api.get(`/Optimizer/${id}`),
  guardar:   (datos)        => api.post('/Optimizer/guardar', datos),
  actualizar:(id, datos)    => api.put(`/Optimizer/${id}`, datos),
  eliminar:  (id)           => api.delete(`/Optimizer/${id}`),
  reejecutar:(id)           => api.post(`/Optimizer/${id}/ejecutar`),
  optimizar: (request)      => api.post('/Optimizer', request),
}

export const proyectosService = {
  obtenerTodos:         (params)    => api.get('/Proyectos', { params }),
  obtenerPorId:         (id)        => api.get(`/Proyectos/${id}`),
  existePorCotizacion:  (cotId)     => api.get(`/Proyectos/cotizacion/${cotId}/existe`),
  crear:                (datos)     => api.post('/Proyectos', datos),
  actualizar:           (id, datos) => api.put(`/Proyectos/${id}`, datos),
  eliminar:             (id)        => api.delete(`/Proyectos/${id}`),
}

export const comentariosService = {
  obtenerPorCotizacion: (cotId)  => api.get(`/Comentarios/cotizacion/${cotId}`),
  agregar:              (datos)  => api.post('/Comentarios', datos),
  eliminar:             (id)     => api.delete(`/Comentarios/${id}`),
}

export const ventasService = {
  obtenerTodos:  (params)    => api.get('/Ventas', { params }),
  obtenerPorId:  (id)        => api.get(`/Ventas/${id}`),
  resumenDia:    (fecha)     => api.get('/Ventas/resumen-dia', { params: { fecha } }),
  crear:         (datos)     => api.post('/Ventas', datos),
  agregarPago:   (id, datos) => api.post(`/Ventas/${id}/pagos`, datos),
  anular:        (id)        => api.put(`/Ventas/${id}/anular`),
}

export const cajaService = {
  hoy:              ()           => api.get('/Caja/hoy'),
  porFecha:         (fecha)      => api.get('/Caja', { params: { fecha } }),
  historial:        (limite)     => api.get('/Caja/historial', { params: { limite } }),
  abrir:            (datos)      => api.post('/Caja/abrir', datos),
  cerrar:           (id, datos)  => api.put(`/Caja/${id}/cerrar`, datos),
  agregarMovimiento:(id, datos)  => api.post(`/Caja/${id}/movimientos`, datos),
}
