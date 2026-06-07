/**
 * Parser de mensajes SINPE Móvil.
 *
 * Los SMS varían por banco (BAC, Banco Nacional, BCR, etc.), así que usamos
 * heurísticas tolerantes. Lo crítico que extraemos:
 *   - amount: el monto transferido
 *   - detail: el concepto/detalle (donde el cliente pone el código CENT-XXXX)
 *   - sender_name: quién envió
 *   - orderCode: el código CENT-XXXX si aparece en cualquier parte del texto
 *
 * Ajustá las expresiones regulares según el formato exacto de tu banco.
 */

export interface ParsedSinpe {
  amount: number | null;
  detail: string | null;
  sender_name: string | null;
  reference: string | null;
  orderCode: string | null;
}

export function parseSinpeMessage(raw: string): ParsedSinpe {
  const text = raw.replace(/\s+/g, " ").trim();

  return {
    amount: extractAmount(text),
    detail: extractDetail(text),
    sender_name: extractSender(text),
    reference: extractReference(text),
    orderCode: extractOrderCode(text),
  };
}

/** Busca el código de orden CENT-XXXX en cualquier parte del texto. */
export function extractOrderCode(text: string): string | null {
  const m = text.toUpperCase().match(/CENT[-\s]?([A-Z0-9]{4})/);
  return m ? `CENT-${m[1]}` : null;
}

/** Monto: soporta ₡, CRC, "colones", separador de miles con coma o punto. */
function extractAmount(text: string): number | null {
  // p.ej. "₡3,000.00", "CRC 3000", "por 3.000,00 colones"
  const patterns = [
    /(?:₡|CRC|por)\s*([\d.,]+)/i,
    /([\d.,]+)\s*colones/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = normalizeAmount(m[1]);
      if (n != null) return n;
    }
  }
  return null;
}

/** Normaliza "3,000.00" / "3.000,00" / "3000" a número. */
function normalizeAmount(s: string): number | null {
  let clean = s.trim();
  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  // El separador decimal es el que aparece más a la derecha.
  if (lastComma > lastDot) {
    // formato 3.000,00 -> quitar puntos, coma como decimal
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else {
    // formato 3,000.00 -> quitar comas
    clean = clean.replace(/,/g, "");
  }
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

/** Detalle / concepto / motivo. */
function extractDetail(text: string): string | null {
  const m = text.match(/(?:detalle|concepto|motivo|comentario)[:\s]+(.+?)(?:\.|$)/i);
  return m ? m[1].trim() : null;
}

/** Nombre del remitente. */
function extractSender(text: string): string | null {
  const m = text.match(/(?:de|env[ií]a|recibido de)[:\s]+([A-ZÁÉÍÓÚÑ][\w\sÁÉÍÓÚÑáéíóúñ.]+?)(?:\s+por|\s+₡|\s+CRC|,|\.|$)/i);
  return m ? m[1].trim() : null;
}

/** Número de referencia/comprobante del banco. */
function extractReference(text: string): string | null {
  const m = text.match(/(?:ref(?:erencia)?|comprobante)[:\s#]*([\d]{4,})/i);
  return m ? m[1] : null;
}
