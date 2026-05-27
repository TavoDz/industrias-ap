import html2pdf from 'html2pdf.js'

const Q   = (n) => `Q ${Number(n).toFixed(2)}`
const fmt = (d) => new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const pad = (n) => String(n).padStart(4, '0')

// ── Datos de empresa ── actualizar con información real ───────────────────
const EMPRESA = {
  nombre:   'INDUSTRIAS AP',
  rubro:    'Carpintería · Fabricación de Muebles',
  ciudad:   'Ciudad de Guatemala, Guatemala',
  nit:      'NIT: CF',
  tel:      '+502 5555-0000',
  email:    'ventas@industriasap.com',
}

const ESTADO = {
  pagada:         { label: 'Pagada',            bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  pendiente_pago: { label: 'Pendiente de pago', bg: '#FFFBEB', color: '#B45309', border: '#FCD34D' },
  anulada:        { label: 'Anulada',           bg: '#F4F4F5', color: '#71717A', border: '#D4D4D8' },
}

export async function generarComprobanteVenta(ventaData) {
  const { venta, clienteNombre, detalle, pagos } = ventaData

  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0)
  const pendiente   = Math.max(0, Number(venta.total) - totalPagado)
  const estado      = ESTADO[venta.estado] ?? { label: venta.estado, bg: '#F4F4F5', color: '#52525B', border: '#D4D4D8' }
  const tipoTexto   = venta.tipo === 'cotizacion' ? `Cotización #${venta.cotizacionId}` : 'Venta directa'

  // ── Filas de ítems ────────────────────────────────────────────────────────
  const filasItems = detalle.length > 0
    ? detalle.map((d, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#FAFAFA'};">
          <td style="padding:10px 14px;font-size:8.5px;color:#18181B;border-bottom:1px solid #F4F4F5;line-height:1.5;">${d.descripcion}</td>
          <td style="padding:10px 14px;font-size:8.5px;color:#71717A;text-align:center;border-bottom:1px solid #F4F4F5;">${Number(d.cantidad)}</td>
          <td style="padding:10px 14px;font-size:8.5px;color:#71717A;text-align:right;border-bottom:1px solid #F4F4F5;">${Q(d.precioUnitario)}</td>
          <td style="padding:10px 14px;font-size:8.5px;color:#18181B;font-weight:600;text-align:right;border-bottom:1px solid #F4F4F5;">${Q(d.subtotal)}</td>
        </tr>`).join('')
    : `<tr>
        <td colspan="4" style="padding:18px 14px;font-size:8.5px;color:#A1A1AA;font-style:italic;text-align:center;">
          Ver detalle en cotización #${venta.cotizacionId}
        </td>
       </tr>`

  // ── Filas de pagos ────────────────────────────────────────────────────────
  const filasPagos = pagos.map(p => `
    <tr>
      <td style="padding:5px 0;font-size:8.5px;color:#52525B;border-bottom:1px solid #F4F4F5;">
        ${cap(p.metodo)}${p.referencia ? ` · ${p.referencia}` : ''}
      </td>
      <td style="padding:5px 0;font-size:8.5px;color:#18181B;font-weight:600;text-align:right;border-bottom:1px solid #F4F4F5;">
        ${Q(p.monto)}
      </td>
    </tr>`).join('')

  // ── HTML del comprobante ──────────────────────────────────────────────────
  const html = `
  <div style="
    font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
    background:#ffffff;
    padding:44px 52px;
    color:#18181B;
    line-height:1.4;
  ">

    <!-- ════════════════════════════════════════════════ HEADER -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="vertical-align:top;width:56%;">
          <!-- Logotipo + nombre -->
          <table style="border-collapse:collapse;margin-bottom:14px;">
            <tr>
              <td style="padding-right:11px;vertical-align:middle;">
                <div style="
                  width:38px;height:38px;
                  background:#18181B;
                  border-radius:7px;
                  text-align:center;
                  line-height:38px;
                ">
                  <span style="color:#ffffff;font-size:12px;font-weight:800;letter-spacing:-0.5px;">AP</span>
                </div>
              </td>
              <td style="vertical-align:middle;">
                <div style="font-size:13.5px;font-weight:800;color:#18181B;letter-spacing:.4px;">${EMPRESA.nombre}</div>
                <div style="font-size:7px;color:#A1A1AA;letter-spacing:1px;text-transform:uppercase;margin-top:1px;">${EMPRESA.rubro}</div>
              </td>
            </tr>
          </table>
          <div style="font-size:7.5px;color:#71717A;line-height:2;">
            <div>${EMPRESA.ciudad}</div>
            <div>${EMPRESA.tel}&nbsp;&nbsp;·&nbsp;&nbsp;${EMPRESA.email}</div>
          </div>
        </td>
        <td style="vertical-align:top;text-align:right;width:44%;">
          <div style="font-size:7px;color:#A1A1AA;text-transform:uppercase;letter-spacing:1.8px;margin-bottom:5px;">Comprobante de Venta</div>
          <div style="font-size:28px;font-weight:800;color:#18181B;letter-spacing:-1.5px;line-height:1;">#${pad(venta.id)}</div>
          <div style="margin-top:8px;font-size:7.5px;color:#71717A;">
            Fecha:&nbsp;<span style="color:#18181B;font-weight:600;">${fmt(venta.fecha)}</span>
          </div>
          <div style="margin-top:9px;">
            <span style="
              display:inline-block;
              padding:3px 12px;
              border-radius:20px;
              border:1px solid ${estado.border};
              background:${estado.bg};
              font-size:7px;
              font-weight:700;
              color:${estado.color};
              letter-spacing:.9px;
              text-transform:uppercase;
            ">${estado.label}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Divisor principal -->
    <div style="height:2px;background:#18181B;border-radius:2px;margin-bottom:24px;"></div>

    <!-- ════════════════════════════════════════════════ BILLING -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <tr>
        <td style="width:50%;padding-right:10px;vertical-align:top;">
          <div style="background:#FAFAFA;border:1px solid #E4E4E7;border-radius:8px;padding:13px 16px;">
            <div style="font-size:6px;text-transform:uppercase;letter-spacing:1.6px;color:#A1A1AA;font-weight:700;margin-bottom:8px;">De</div>
            <div style="font-size:10px;font-weight:700;color:#18181B;margin-bottom:5px;">${EMPRESA.nombre}</div>
            <div style="font-size:7.5px;color:#71717A;line-height:2;">
              <div>${EMPRESA.ciudad}</div>
              <div>${EMPRESA.nit}</div>
            </div>
          </div>
        </td>
        <td style="width:50%;padding-left:10px;vertical-align:top;">
          <div style="background:#FAFAFA;border:1px solid #E4E4E7;border-radius:8px;padding:13px 16px;">
            <div style="font-size:6px;text-transform:uppercase;letter-spacing:1.6px;color:#A1A1AA;font-weight:700;margin-bottom:8px;">Para</div>
            <div style="font-size:10px;font-weight:700;color:#18181B;margin-bottom:5px;">${clienteNombre || 'Consumidor Final'}</div>
            <div style="font-size:7.5px;color:#71717A;line-height:2;">
              <div>NIT: CF</div>
              <div>Vendedor:&nbsp;${venta.usuarioNombre || '—'}</div>
              <div>${tipoTexto}</div>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- ════════════════════════════════════════════════ DETALLE -->
    <div style="margin-bottom:20px;">
      <div style="font-size:6px;text-transform:uppercase;letter-spacing:1.6px;color:#A1A1AA;font-weight:700;margin-bottom:10px;">Detalle</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #E4E4E7;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#18181B;">
            <th style="padding:8px 14px;font-size:6.5px;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:left;font-weight:600;">Descripción</th>
            <th style="padding:8px 14px;font-size:6.5px;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:center;font-weight:600;width:56px;">Cant.</th>
            <th style="padding:8px 14px;font-size:6.5px;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:right;font-weight:600;width:96px;">Precio unit.</th>
            <th style="padding:8px 14px;font-size:6.5px;text-transform:uppercase;letter-spacing:1px;color:#ffffff;text-align:right;font-weight:600;width:96px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${filasItems}</tbody>
      </table>
    </div>

    <!-- ════════════════════════════════════════════════ TOTALES -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
      <tr>
        <td style="width:58%;"></td>
        <td style="width:42%;vertical-align:top;">
          <div style="border-top:1px solid #E4E4E7;padding-top:10px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:3px 0;font-size:8px;color:#71717A;">Subtotal</td>
                <td style="padding:3px 0;font-size:8px;color:#52525B;text-align:right;">${Q(venta.subtotal)}</td>
              </tr>
              ${Number(venta.descuento) > 0 ? `
              <tr>
                <td style="padding:3px 0;font-size:8px;color:#71717A;">Descuento</td>
                <td style="padding:3px 0;font-size:8px;color:#52525B;text-align:right;">− ${Q(venta.descuento)}</td>
              </tr>` : ''}
            </table>
            <!-- Caja total destacada -->
            <div style="background:#18181B;border-radius:8px;padding:12px 14px;margin-top:10px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="font-size:8px;font-weight:700;color:#ffffff;text-transform:uppercase;letter-spacing:1.2px;">Total</td>
                  <td style="font-size:15px;font-weight:800;color:#ffffff;text-align:right;letter-spacing:-.3px;">${Q(venta.total)}</td>
                </tr>
              </table>
            </div>
          </div>
        </td>
      </tr>
    </table>

    <!-- ════════════════════════════════════════════════ PAGOS + NOTAS -->
    ${pagos.length > 0 || venta.notas ? `
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="width:50%;padding-right:14px;vertical-align:top;">
          ${pagos.length > 0 ? `
          <div style="font-size:6px;text-transform:uppercase;letter-spacing:1.6px;color:#A1A1AA;font-weight:700;margin-bottom:10px;">Pagos recibidos</div>
          <table style="width:100%;border-collapse:collapse;">
            ${filasPagos}
            <tr>
              <td style="padding:7px 0 2px;font-size:8.5px;font-weight:700;color:#18181B;">${pendiente > 0 ? 'Saldo pendiente' : 'Pagado completamente'}</td>
              <td style="padding:7px 0 2px;font-size:8.5px;font-weight:700;color:#18181B;text-align:right;">${pendiente > 0 ? Q(pendiente) : Q(venta.total)}</td>
            </tr>
          </table>
          ` : '&nbsp;'}
        </td>
        <td style="width:50%;padding-left:14px;vertical-align:top;">
          ${venta.notas ? `
          <div style="font-size:6px;text-transform:uppercase;letter-spacing:1.6px;color:#A1A1AA;font-weight:700;margin-bottom:10px;">Observaciones</div>
          <div style="
            font-size:8px;color:#52525B;line-height:1.7;
            background:#FAFAFA;border:1px solid #E4E4E7;
            border-radius:7px;padding:10px 12px;
          ">${venta.notas}</div>
          ` : '&nbsp;'}
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- ════════════════════════════════════════════════ PIE -->
    <div style="border-top:1px solid #E4E4E7;padding-top:18px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:bottom;width:44%;">
            <div style="width:130px;border-bottom:1px solid #A1A1AA;height:30px;margin-bottom:5px;"></div>
            <div style="font-size:7px;color:#A1A1AA;letter-spacing:.4px;">Firma y sello</div>
          </td>
          <td style="vertical-align:bottom;text-align:center;width:12%;">
            <div style="font-size:6px;color:#D4D4D8;font-family:monospace;letter-spacing:.5px;">COMP-${pad(venta.id)}</div>
          </td>
          <td style="vertical-align:bottom;text-align:right;width:44%;">
            <div style="font-size:8px;font-weight:700;color:#3F3F46;">${EMPRESA.nombre}</div>
            <div style="font-size:7px;color:#A1A1AA;margin-top:2px;">Generado el ${new Date().toLocaleDateString('es-GT')}</div>
          </td>
        </tr>
      </table>
    </div>

  </div>`

  // ── Renderizar y exportar ─────────────────────────────────────────────────
  const contenedor = document.createElement('div')
  contenedor.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#ffffff;'
  contenedor.innerHTML = html
  document.body.appendChild(contenedor)

  await html2pdf()
    .set({
      margin:      [0, 0, 0, 0],
      filename:    `Comprobante-${pad(venta.id)}.pdf`,
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(contenedor)
    .save()

  document.body.removeChild(contenedor)
}
