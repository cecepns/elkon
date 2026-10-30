/**
 * shippingLabelPdf.js
 * Utility untuk membuat dan mengunduh file PDF Label Pengiriman (Shipping Label)
 * untuk kebutuhan kurir (JNE, J&T, SiCepat, Anteraja, Gosend, Grab, dll).
 * Menyertakan nama, alamat, nomor telepon, dan deskripsi/catatan pembeli saat checkout.
 */

// Helper: Bungkus teks panjang menjadi beberapa baris
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Helper: Escape karakter khusus sintaks PDF
function escapePdfText(txt) {
  if (!txt) return '';
  return String(txt)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' '); // Memastikan encoding aman WinAnsi/Latin1
}

// Format tanggal Indonesia
function formatDateIndo(dateStr) {
  if (!dateStr) return 'Hari ini';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Membangun binary PDF string dari dokumen label
 */
function buildPdfDoc(width, height, contentStreamText) {
  // Konversi string konten ke byte stream
  const contentBytes = [];
  for (let i = 0; i < contentStreamText.length; i++) {
    contentBytes.push(contentStreamText.charCodeAt(i) & 0xff);
  }
  const streamLength = contentBytes.length;

  const objects = [];
  // 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  // 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  // 3: Page (Ukuran dinamis A6)
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj`
  );
  // 4: Regular Font (Helvetica)
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  // 5: Bold Font (Helvetica-Bold)
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');
  // 6: Stream Konten
  objects.push(`6 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStreamText}\nendstream\nendobj`);

  let pdfHeader = '%PDF-1.4\n';
  const offsets = [];
  let currentOffset = pdfHeader.length;

  let body = '';
  objects.forEach((obj) => {
    offsets.push(currentOffset);
    const objStr = obj + '\n';
    body += objStr;
    currentOffset += objStr.length;
  });

  const xrefOffset = currentOffset;
  let xref = 'xref\n';
  xref += `0 ${objects.length + 1}\n`;
  xref += '0000000000 65535 f \n';
  offsets.forEach((offset) => {
    xref += offset.toString().padStart(10, '0') + ' 00000 n \n';
  });

  let trailer = 'trailer\n';
  trailer += `<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  trailer += 'startxref\n';
  trailer += `${xrefOffset}\n`;
  trailer += '%%EOF\n';

  const fullPdfStr = pdfHeader + body + xref + trailer;
  const resultBytes = new Uint8Array(fullPdfStr.length);
  for (let i = 0; i < fullPdfStr.length; i++) {
    resultBytes[i] = fullPdfStr.charCodeAt(i) & 0xff;
  }
  return resultBytes;
}

/**
 * Generate binary array PDF untuk label pengiriman kurir
 */
export function generateShippingLabelPdfBytes({ order, storeInfo = {} }) {
  // Lebar standar label A6 (105mm ~ 298pt)
  const width = 298;
  const mx = 12;
  const my = 12;
  const cw = width - mx * 2;

  // Deskripsi / Catatan Pembeli saat checkout (order.notes)
  const buyerDescription = (order.notes || '').trim();
  const descLines = buyerDescription ? wrapText(buyerDescription, 50) : [];
  const descBoxHeight = descLines.length > 0 ? 18 + descLines.length * 11 : 0;

  // Item pesanan
  const items = order.items || [];
  const itemsContentHeight = 16 + items.length * 13;
  const itemsSectionHeight = Math.max(38, itemsContentHeight + 6);

  // Total tinggi dihitung dinamis agar deskripsi pembeli berapapun panjangnya tertampung utuh
  const calculatedHeight =
    my +
    38 + 6 +
    30 + 6 +
    114 + 6 +
    44 + 6 +
    (descBoxHeight > 0 ? descBoxHeight + 6 : 0) +
    itemsSectionHeight +
    26 +
    my;

  const height = Math.max(420, Math.ceil(calculatedHeight));

  const toPdfY = (y) => (height - y).toFixed(2);

  const rect = (x, y, w, h, stroke = true, fill = false, fillColor = [1, 1, 1], strokeColor = [0.8, 0.8, 0.8], lineWidth = 0.75) => {
    let s = 'q\n';
    if (fill) s += `${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg\n`;
    if (stroke) s += `${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG ${lineWidth} w\n`;
    s += `${x.toFixed(2)} ${(height - y - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}\n`;
    s += 'Q\n';
    return s;
  };

  const line = (x1, y1, x2, y2, color = [0.8, 0.8, 0.8], lineWidth = 0.5, dash = false) => {
    let s = 'q\n';
    s += `${color[0]} ${color[1]} ${color[2]} RG ${lineWidth} w\n`;
    if (dash) s += '[3 3] 0 d\n';
    s += `${x1.toFixed(2)} ${toPdfY(y1)} m ${x2.toFixed(2)} ${toPdfY(y2)} l S\nQ\n`;
    return s;
  };

  const text = (str, x, y, size = 9, isBold = false, color = [0.1, 0.1, 0.1]) => {
    const font = isBold ? '/F2' : '/F1';
    return `BT\n${font} ${size} Tf\n${color[0]} ${color[1]} ${color[2]} rg\n1 0 0 1 ${x.toFixed(2)} ${toPdfY(y)} Tm\n(${escapePdfText(str)}) Tj\nET\n`;
  };

  let c = '';

  // Frame luar solid
  const ch = height - my * 2;
  c += rect(mx, my, cw, ch, true, true, [1, 1, 1], [0.15, 0.15, 0.15], 1.2);

  // 1. Header Toko & Label
  c += rect(mx, my, cw, 38, true, true, [0.08, 0.08, 0.08], [0.08, 0.08, 0.08]);
  c += text('ELKON', mx + 12, my + 23, 15, true, [1, 1, 1]);
  c += text('LABEL PENGIRIMAN PAKET', mx + 12, my + 33, 7, false, [0.75, 0.75, 0.75]);
  c += text('KURIR / EKSPEDISI', mx + cw - 95, my + 24, 7.5, true, [1, 1, 1]);

  // 2. Info Resi / Referensi & Tanggal
  c += rect(mx + 6, my + 44, cw - 12, 30, true, true, [0.96, 0.96, 0.96], [0.8, 0.8, 0.8], 0.75);
  c += text('NO. PESANAN / REFERENSI:', mx + 12, my + 55, 6.5, false, [0.4, 0.4, 0.4]);
  c += text(order.reference_id || '-', mx + 12, my + 68, 10.5, true, [0.05, 0.05, 0.05]);

  const createdDate = formatDateIndo(order.created_at);
  c += text('TGL: ' + createdDate, mx + cw - 105, my + 60, 7, false, [0.3, 0.3, 0.3]);
  const statusLabel = order.status === 'paid' ? 'LUNAS (PAID)' : String(order.status || 'PROSES').toUpperCase();
  c += text('STATUS: ' + statusLabel, mx + cw - 105, my + 70, 7.5, true, [0.1, 0.4, 0.1]);

  // 3. BOX PENERIMA (TUJUAN PENGIRIMAN) - Nama, No Telp, Alamat, Kota
  let currentY = my + 80;
  const penerimaBoxHeight = 114;
  c += rect(mx + 6, currentY, cw - 12, penerimaBoxHeight, true, true, [1, 1, 1], [0.15, 0.15, 0.15], 1.2);

  c += rect(mx + 6, currentY, cw - 12, 17, true, true, [0.12, 0.12, 0.12], [0.12, 0.12, 0.12]);
  c += text('KEPADA (PENERIMA)', mx + 12, currentY + 12, 8, true, [1, 1, 1]);
  c += text('TUJUAN PENGIRIMAN', mx + cw - 95, currentY + 12, 6.5, true, [1, 0.85, 0.3]);

  // Nama Penerima
  c += text('NAMA:', mx + 12, currentY + 31, 7.5, false, [0.45, 0.45, 0.45]);
  c += text(order.buyer_name || '-', mx + 54, currentY + 31, 10.5, true, [0.05, 0.05, 0.05]);

  // No Telepon Penerima
  c += text('NO. TELP:', mx + 12, currentY + 46, 7.5, false, [0.45, 0.45, 0.45]);
  c += text(order.buyer_phone || '-', mx + 54, currentY + 46, 10, true, [0.05, 0.35, 0.1]);

  // Alamat Lengkap
  c += text('ALAMAT:', mx + 12, currentY + 60, 7.5, false, [0.45, 0.45, 0.45]);
  const addrLines = wrapText(order.address || '-', 35);
  const addrRowY = currentY + 60;
  addrLines.slice(0, 3).forEach((lineStr, idx) => {
    c += text(lineStr, mx + 54, addrRowY + idx * 11, 8, false, [0.1, 0.1, 0.1]);
  });

  // Kota Penerima
  const cityY = addrRowY + Math.min(addrLines.length, 3) * 11 + 2;
  c += text('KOTA / WIL:', mx + 12, Math.min(cityY, currentY + 105), 7.5, false, [0.45, 0.45, 0.45]);
  c += text(order.city || '-', mx + 54, Math.min(cityY, currentY + 105), 8.5, true, [0.05, 0.05, 0.05]);

  currentY += penerimaBoxHeight + 6;

  // 4. BOX PENGIRIM (SENDER)
  const senderHeight = 44;
  c += rect(mx + 6, currentY, cw - 12, senderHeight, true, true, [0.98, 0.98, 0.98], [0.75, 0.75, 0.75], 0.75);
  c += text('DARI (PENGIRIM):', mx + 12, currentY + 12, 7, true, [0.4, 0.4, 0.4]);
  c += text(storeInfo.name || 'ELKON Official Store', mx + 82, currentY + 12, 8, true, [0.1, 0.1, 0.1]);
  c += text('NO. WA / TELP:', mx + 12, currentY + 24, 7, false, [0.4, 0.4, 0.4]);
  c += text(storeInfo.phone || '0878-6540-7492', mx + 82, currentY + 24, 8, false, [0.2, 0.2, 0.2]);
  c += text('KOTA ASAL:', mx + 12, currentY + 36, 7, false, [0.4, 0.4, 0.4]);
  c += text(storeInfo.city || 'Indonesia', mx + 82, currentY + 36, 8, false, [0.2, 0.2, 0.2]);

  currentY += senderHeight + 6;

  // 5. BOX DESKRIPSI PEMBELI SAAT CHECKOUT (CATATAN PENGIRIMAN DARI PEMBELI)
  if (descLines.length > 0) {
    c += rect(mx + 6, currentY, cw - 12, descBoxHeight, true, true, [1, 0.98, 0.91], [0.9, 0.75, 0.35], 0.9);
    c += text('DESKRIPSI PEMBELI SAAT CHECKOUT:', mx + 12, currentY + 11, 7, true, [0.7, 0.4, 0.05]);
    let noteRowY = currentY + 22;
    descLines.forEach((nLine) => {
      c += text(nLine, mx + 12, noteRowY, 7.8, false, [0.15, 0.15, 0.15]);
      noteRowY += 11;
    });
    currentY += descBoxHeight + 6;
  }

  // 6. BOX ISI PAKET (DETAIL BARANG)
  c += rect(mx + 6, currentY, cw - 12, itemsSectionHeight, true, true, [1, 1, 1], [0.8, 0.8, 0.8], 0.75);
  c += rect(mx + 6, currentY, cw - 12, 14, true, true, [0.94, 0.94, 0.94], [0.8, 0.8, 0.8], 0.5);
  c += text('DAFTAR ISI PAKET', mx + 12, currentY + 10, 6.5, true, [0.3, 0.3, 0.3]);
  c += text('QTY', mx + cw - 32, currentY + 10, 6.5, true, [0.3, 0.3, 0.3]);

  let itemY = currentY + 22;
  items.forEach((item) => {
    const title = `${item.product_name || 'Item'} (${item.variant_size || '-'}/${item.variant_color || '-'})`;
    c += text(title.substring(0, 38), mx + 12, itemY, 7.5, false, [0.15, 0.15, 0.15]);
    c += text(`${item.quantity}x`, mx + cw - 30, itemY, 7.5, true, [0.1, 0.1, 0.1]);
    itemY += 13;
  });

  // 7. Garis Potong Label Kurir (Dotted Cut Line)
  c += line(mx, height - my - 14, width - mx, height - my - 14, [0.5, 0.5, 0.5], 0.6, true);
  c += text(
    'Gunting di sepanjang garis putus-putus dan tempelkan pada paket kurir',
    width / 2 - 95,
    height - my - 5,
    5.8,
    false,
    [0.5, 0.5, 0.5]
  );

  return buildPdfDoc(width, height, c);
}

/**
 * Download langsung file PDF Label Pengiriman ke komputer pengguna
 */
export function downloadShippingLabelPdf({ order, storeInfo = {} }) {
  if (!order) return;

  const pdfBytes = generateShippingLabelPdfBytes({ order, storeInfo });
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const safeRef = String(order.reference_id || 'order').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Label-Kurir-${safeRef}.pdf`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}
