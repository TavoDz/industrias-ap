import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cotizacionesService } from '../../services'

export default function CotizacionPDF() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [cot, setCot]   = useState(null)
  const [load, setLoad] = useState(true)

  useEffect(() => {
    cotizacionesService.obtenerCompleta(id)
      .then(res => setCot(res.data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [id])

  const exportar = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const elemento = document.getElementById('cotizacion-pdf')
    html2pdf().set({
      margin:      10,
      filename:    `Cotizacion-${id}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(elemento).save()
  }

  if (load) return <p className="text-sm text-gray-500 p-6">Cargando...</p>
  if (!cot)  return <p className="text-sm text-red-500 p-6">Cotizacion no encontrada</p>

  return (
    <div>
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <button onClick={() => navigate('/cotizaciones/' + id)}
          className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Volver
        </button>
        <button onClick={exportar}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition">
          Exportar PDF
        </button>
      </div>

      <div id="cotizacion-pdf" style={{ fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#1a1a1a', padding: '20px' }}>

        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '2px solid #1d4ed8', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>Insutrias AP</h1>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }}>Sistema de Carpinteria</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>COTIZACION #{cot.id}</h2>
            <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '12px' }}>
              Fecha: {new Date(cot.fecha).toLocaleDateString('es-GT')}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px' }}>
              Estado: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{cot.estado}</span>
            </p>
          </div>
        </div>

        {/* Datos del cliente */}
        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px 16px', marginBottom: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Datos del cliente</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
            <p style={{ margin: 0 }}><span style={{ color: '#6b7280' }}>Nombre:</span> {cot.clienteNombre}</p>
            <p style={{ margin: 0 }}><span style={{ color: '#6b7280' }}>Telefono:</span> {cot.clienteTelefono || '—'}</p>
            <p style={{ margin: 0 }}><span style={{ color: '#6b7280' }}>Email:</span> {cot.clienteEmail || '—'}</p>
            <p style={{ margin: 0 }}><span style={{ color: '#6b7280' }}>Vendedor:</span> {cot.usuarioNombre}</p>
          </div>
        </div>

        {/* Piezas de corte */}
        {cot.piezas?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              Piezas de corte
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  {['Pieza', 'Material', 'Largo', 'Ancho', 'Cant', 'Costo'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cot.piezas.map((p, i) => (
                  <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '6px 8px' }}>{p.nombrePieza}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{p.materialNombre}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{p.largo} mm</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{p.ancho} mm</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{p.cantidad}</td>
                    <td style={{ padding: '6px 8px', fontWeight: '500' }}>Q{Number(p.costoMaterial).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Herrajes */}
        {cot.herrajes?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              Herrajes
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  {['Herraje', 'Marca', 'Cantidad', 'Precio unit.', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cot.herrajes.map((h, i) => (
                  <tr key={h.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '6px 8px' }}>{h.herrajeNombre}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{h.herrajeMarca || '—'}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{h.cantidad}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>Q{Number(h.precioUnitario).toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', fontWeight: '500' }}>Q{Number(h.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Servicios */}
        {cot.servicios?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
              Servicios externos
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  {['Servicio', 'Proveedor', 'Cantidad', 'Precio', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cot.servicios.map((s, i) => (
                  <tr key={s.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '6px 8px' }}>{s.servicioNombre}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.servicioProveedor || '—'}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.cantidad}</td>
                    <td style={{ padding: '6px 8px', color: '#6b7280' }}>Q{Number(s.precio).toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', fontWeight: '500' }}>Q{Number(s.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totales */}
        <div style={{ marginTop: '24px', borderTop: '2px solid #e2e8f0', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ fontSize: '13px', minWidth: '260px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', color: '#6b7280' }}>Subtotal materiales</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>Q{Number(cot.totalMateriales).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', color: '#6b7280' }}>Subtotal herrajes</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>Q{Number(cot.totalHerrajes).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 16px 4px 0', color: '#6b7280' }}>Subtotal servicios</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>Q{Number(cot.totalServicios).toFixed(2)}</td>
                </tr>
                <tr style={{ borderTop: '2px solid #1d4ed8' }}>
                  <td style={{ padding: '8px 16px 4px 0', fontWeight: 'bold', fontSize: '15px' }}>TOTAL</td>
                  <td style={{ padding: '8px 0 4px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: '#1d4ed8' }}>
                    Q{Number(cot.total).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de pagina */}
        <div style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Insutrias AP — Sistema de Carpinteria</p>
          <p style={{ margin: '2px 0 0' }}>Este documento es una cotizacion y no constituye una factura.</p>
        </div>

      </div>
    </div>
  )
}
