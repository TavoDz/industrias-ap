import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { cotizacionesService } from '../../services'

export default function CotizacionPDF() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const [cot,  setCot]  = useState(null)
  const [load, setLoad] = useState(true)

  useEffect(() => {
    cotizacionesService.obtenerCompleta(id)
      .then(res => setCot(res.data))
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [id])

  const exportar = async () => {
    const html2pdf = (await import('html2pdf.js')).default
    const el = document.getElementById('pdf-doc')
    html2pdf().set({
      margin:      [10, 10, 10, 10],
      filename:    `Cotizacion-AP-${String(id).padStart(4,'0')}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2.5, useCORS: true, logging: false },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save()
  }

  if (load) return <p className="text-sm text-gray-500 p-6">Cargando...</p>
  if (!cot)  return <p className="text-sm text-red-500 p-6">Cotización no encontrada</p>

  const fechaFormateada   = new Date(cot.fecha).toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
  const fechaVencimiento  = (() => {
    const d = new Date(cot.fecha)
    d.setDate(d.getDate() + 15)
    return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })
  })()

  // Nombres de materiales únicos para mostrar en PDF
  const nombresMateriales = [...new Set((cot.materiales || []).map(m => m.materialNombre).filter(Boolean))]
  const nombresServicios  = [...new Set((cot.servicios  || []).map(s => s.servicioNombre).filter(Boolean))]
  const tipoAcabadoLabel  = { basico: 'Básico', normal: 'Normal', premium: 'Premium', manual: 'Personalizado' }[cot.tipoAcabado] || 'Normal'

  const S = {                // estilos inline reutilizables
    label:  { color: '#94a3b8', fontSize: '10px' },
    value:  { color: '#1e293b', fontSize: '11px' },
    accent: '#1e3a5f',
  }

  return (
    <div className="max-w-3xl mx-auto py-6">

      {/* Barra de acciones */}
      <div className="flex items-center gap-3 mb-5 print:hidden">
        <button onClick={() => navigate('/cotizaciones/' + id)}
          className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 transition">
          ← Volver a cotización
        </button>
        <div className="flex-1" />
        <button onClick={exportar}
          className="bg-blue-600 text-white text-sm px-5 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium">
          ⬇ Exportar PDF
        </button>
      </div>

      {/* ── DOCUMENTO ── */}
      <div id="pdf-doc" style={{
        fontFamily: "'Segoe UI', Arial, sans-serif",
        fontSize: '12px',
        color: '#1e293b',
        backgroundColor: '#ffffff',
        padding: '36px 40px',
        maxWidth: '760px',
        margin: '0 auto',
        lineHeight: '1.5',
      }}>

        {/* ── Encabezado ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <tbody>
            <tr>
              {/* Logo / empresa */}
              <td style={{ verticalAlign: 'top', width: '50%' }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  background: S.accent, borderRadius: '10px',
                  padding: '12px 18px', marginBottom: '12px'
                }}>
                  <div style={{
                    width: '36px', height: '36px', background: '#3b82f6',
                    borderRadius: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '18px'
                  }}>A</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px', letterSpacing: '-0.3px' }}>Industrias AP</div>
                    <div style={{ color: '#93c5fd', fontSize: '10px', marginTop: '1px' }}>Carpintería & Mobiliario</div>
                  </div>
                </div>
                <div style={{ color: '#64748b', fontSize: '11px', lineHeight: '1.8' }}>
                  <div>Guatemala, C.A.</div>
                  <div>Tel: +502 0000-0000</div>
                  <div>info@industriasap.com</div>
                </div>
              </td>

              {/* Número y fechas */}
              <td style={{ verticalAlign: 'top', textAlign: 'right', width: '50%' }}>
                <div style={{
                  display: 'inline-block', background: '#f8fafc',
                  border: '1px solid #e2e8f0', borderRadius: '12px',
                  padding: '16px 20px', textAlign: 'left', minWidth: '210px'
                }}>
                  <div style={{ ...S.label, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Cotización</div>
                  <div style={{ fontSize: '26px', fontWeight: '800', color: S.accent, letterSpacing: '-1px' }}>
                    #{String(cot.id).padStart(4, '0')}
                  </div>
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '10px' }}>
                    <Row label="Fecha:"    value={fechaFormateada} />
                    <Row label="Válida hasta:" value={fechaVencimiento} />
                    <div style={{ marginTop: '6px' }}>
                      <StatusBadge estado={cot.estado} />
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Datos del cliente + vendedor ── */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: '10px', padding: '16px 20px', marginBottom: '24px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', paddingBottom: '4px' }}>
                  <div style={S.label}>Cliente</div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>{cot.clienteNombre}</div>
                </td>
                <td style={{ width: '25%', paddingBottom: '4px' }}>
                  <div style={S.label}>Teléfono</div>
                  <div style={{ ...S.value, marginTop: '2px' }}>{cot.clienteTelefono || '—'}</div>
                </td>
                <td style={{ width: '25%', paddingBottom: '4px' }}>
                  <div style={S.label}>Email</div>
                  <div style={{ ...S.value, marginTop: '2px' }}>{cot.clienteEmail || '—'}</div>
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <div style={S.label}>Elaborado por</div>
                  <div style={{ ...S.value, marginTop: '2px' }}>{cot.usuarioNombre}</div>
                </td>
                {cot.tiempoEstimadoDias && (
                  <td>
                    <div style={S.label}>Tiempo estimado</div>
                    <div style={{ ...S.value, marginTop: '2px', fontWeight: '600' }}>{cot.tiempoEstimadoDias} días hábiles</div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Descripci��n del proyecto ── */}
        {cot.descripcionGeneral && (
          <div style={{ marginBottom: '22px' }}>
            <SectionTitle title="Descripción del proyecto" />
            <div style={{
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '14px 16px',
              fontSize: '12px', color: '#334155', lineHeight: '1.7'
            }}>
              {cot.descripcionGeneral}
            </div>
          </div>
        )}

        {/* ── Materiales y tipo de acabado ── */}
        {(nombresMateriales.length > 0 || cot.tipoAcabado) && (
          <div style={{ marginBottom: '22px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {nombresMateriales.length > 0 && (
                    <td style={{ verticalAlign: 'top', paddingRight: '16px', width: '60%' }}>
                      <SectionTitle title="Materiales incluidos" />
                      <div style={{
                        background: '#fafafa', border: '1px solid #e2e8f0',
                        borderRadius: '8px', padding: '12px 16px'
                      }}>
                        {nombresMateriales.map((n, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            paddingBottom: i < nombresMateriales.length - 1 ? '6px' : '0',
                            marginBottom: i < nombresMateriales.length - 1 ? '6px' : '0',
                            borderBottom: i < nombresMateriales.length - 1 ? '1px solid #f1f5f9' : 'none',
                          }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', color: '#334155' }}>{n}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  )}
                  <td style={{ verticalAlign: 'top', width: '40%' }}>
                    <SectionTitle title="Tipo de acabado" />
                    <div style={{
                      background: S.accent, borderRadius: '8px',
                      padding: '14px 16px', textAlign: 'center'
                    }}>
                      <div style={{ color: '#93c5fd', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                        Acabado seleccionado
                      </div>
                      <div style={{ color: '#fff', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>
                        {tipoAcabadoLabel}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Servicios incluidos ── */}
        {nombresServicios.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <SectionTitle title="Servicios incluidos" />
            <div style={{
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '12px 16px',
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px'
            }}>
              {nombresServicios.map((n, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '9px', flexShrink: 0
                  }}>✓</div>
                  <span style={{ fontSize: '11px', color: '#334155' }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Total ── */}
        <div style={{
          background: `linear-gradient(135deg, ${S.accent} 0%, #1e4080 100%)`,
          borderRadius: '12px', padding: '20px 24px', marginBottom: '22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ color: '#93c5fd', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Precio total
            </div>
            <div style={{ color: '#fff', fontSize: '32px', fontWeight: '800', letterSpacing: '-1px' }}>
              Q{Number(cot.total || 0).toFixed(2)}
            </div>
            {cot.tiempoEstimadoDias && (
              <div style={{ color: '#93c5fd', fontSize: '11px', marginTop: '4px' }}>
                Entrega estimada: {cot.tiempoEstimadoDias} días hábiles
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', color: '#93c5fd', fontSize: '11px' }}>
            <div style={{ marginBottom: '3px' }}>Este precio es válido por 15 días</div>
            <div>a partir de la fecha de emisión</div>
          </div>
        </div>

        {/* ── Observaciones ── */}
        {cot.observaciones && (
          <div style={{ marginBottom: '20px' }}>
            <SectionTitle title="Observaciones" />
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: '8px', padding: '12px 16px',
              fontSize: '11px', color: '#78350f', lineHeight: '1.7'
            }}>
              {cot.observaciones}
            </div>
          </div>
        )}

        {/* ── Términos ── */}
        {cot.terminos && (
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle title="Términos y condiciones" />
            <div style={{
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '12px 16px',
              fontSize: '11px', color: '#64748b', lineHeight: '1.7'
            }}>
              {cot.terminos}
            </div>
          </div>
        )}

        {/* ── Firma ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <tbody>
            <tr>
              <td style={{ width: '45%', paddingTop: '40px', paddingRight: '20px' }}>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}>
                  <div style={{ ...S.label, textAlign: 'center' }}>Firma y nombre del cliente</div>
                  <div style={{ ...S.label, textAlign: 'center', marginTop: '2px' }}>{cot.clienteNombre}</div>
                </div>
              </td>
              <td style={{ width: '10%' }} />
              <td style={{ width: '45%', paddingTop: '40px', paddingLeft: '20px' }}>
                <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '8px' }}>
                  <div style={{ ...S.label, textAlign: 'center' }}>Autorizado por</div>
                  <div style={{ ...S.label, textAlign: 'center', marginTop: '2px' }}>Industrias AP</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Pie ── */}
        <div style={{
          borderTop: '1px solid #e2e8f0', paddingTop: '14px',
          textAlign: 'center', fontSize: '10px', color: '#94a3b8'
        }}>
          <div style={{ fontWeight: '600', color: '#64748b', marginBottom: '3px' }}>
            Industrias AP — Carpintería &amp; Mobiliario de Calidad
          </div>
          <div>
            Este documento es una cotización y no constituye una factura. •{' '}
            Generado el {new Date().toLocaleDateString('es-GT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Helpers de render ───────────────────────────────────────────────────────

function SectionTitle({ title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <div style={{ width: '3px', height: '14px', background: '#3b82f6', borderRadius: '2px', flexShrink: 0 }} />
      <span style={{ fontWeight: '700', fontSize: '11px', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </span>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ color: '#94a3b8', fontSize: '10px' }}>{label}</span>
      <span style={{ color: '#334155', fontSize: '11px', fontWeight: '500' }}>{value}</span>
    </div>
  )
}

function StatusBadge({ estado }) {
  const cfg = {
    pendiente: { bg: '#fef9c3', color: '#854d0e', label: 'Pendiente' },
    aprobada:  { bg: '#dcfce7', color: '#166534', label: 'Aprobada'  },
    rechazada: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' },
    cancelada: { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelada' },
  }[estado] || { bg: '#f3f4f6', color: '#6b7280', label: estado }

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '10px', fontWeight: '600', display: 'inline-block'
    }}>
      {cfg.label}
    </span>
  )
}
