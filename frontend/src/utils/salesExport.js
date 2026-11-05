/**
 * salesExport.js
 * Utility helper untuk mengekspor data Rekap Penjualan & Matriks Ukuran
 * ke format CSV/Excel (UTF-8 BOM) sehingga langsung terbaca rapi di Microsoft Excel & Google Sheets.
 */

// Helper escape cell CSV
function escapeCsvCell(cell) {
  if (cell === null || cell === undefined) return '""';
  const str = String(cell).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Ekspor Rekap Matriks Ukuran ke file CSV (Format Eksekusi Produksi)
 */
export function exportMatrixCsv({ matrix, availableSizes, filterLabel = "Semua" }) {
  if (!matrix || matrix.length === 0) return false;

  const rows = [];
  const timestamp = new Date().toISOString().slice(0, 10);

  // Header Laporan
  rows.push(["REKAP EKSEKUSI PRODUKSI PER UKURAN & SERI - ELKON"]);
  rows.push([`Filter Status & Periode: ${filterLabel}`]);
  rows.push([`Tanggal Unduh: ${new Date().toLocaleString("id-ID")}`]);
  rows.push([]); // baris kosong

  // Header Kolom Tabel
  const headers = ["No", "Nama Produk / Seri", "Warna"];
  availableSizes.forEach((sz) => headers.push(`Ukuran ${sz} (Pcs)`));
  headers.push("TOTAL PCS TERJUAL");
  headers.push("ESTIMASI OMZET (RP)");
  rows.push(headers);

  // Data per Baris Matriks
  let grandTotalQty = 0;
  let grandTotalRevenue = 0;
  const colSizeTotals = {};
  availableSizes.forEach((sz) => (colSizeTotals[sz] = 0));

  matrix.forEach((item, idx) => {
    const row = [idx + 1, item.product_name, item.variant_color || "-"];
    availableSizes.forEach((sz) => {
      const qty = item.sizes?.[sz] || 0;
      colSizeTotals[sz] += qty;
      row.push(qty);
    });
    row.push(item.total_qty || 0);
    row.push(item.total_subtotal || 0);

    grandTotalQty += item.total_qty || 0;
    grandTotalRevenue += item.total_subtotal || 0;
    rows.push(row);
  });

  // Baris Total Keseluruhan
  const totalRow = ["", "TOTAL KESELURUHAN", ""];
  availableSizes.forEach((sz) => totalRow.push(colSizeTotals[sz]));
  totalRow.push(grandTotalQty);
  totalRow.push(grandTotalRevenue);
  rows.push([]);
  rows.push(totalRow);

  // Konversi ke string CSV dengan UTF-8 BOM
  const csvContent =
    "\uFEFF" +
    rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `rekap-eksekusi-ukuran-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Ekspor Daftar Rincian Lengkap Varian ke CSV
 */
export function exportVariantListCsv({ items, filterLabel = "Semua" }) {
  if (!items || items.length === 0) return false;

  const rows = [];
  const timestamp = new Date().toISOString().slice(0, 10);

  rows.push(["RINCIAN PENJUALAN PER VARIAN PRODUK - ELKON"]);
  rows.push([`Filter Status & Periode: ${filterLabel}`]);
  rows.push([`Tanggal Unduh: ${new Date().toLocaleString("id-ID")}`]);
  rows.push([]);

  rows.push([
    "No",
    "Nama Seri / Produk",
    "Warna",
    "Ukuran",
    "SKU",
    "Qty Terjual (Pcs)",
    "Rata-rata Harga (Rp)",
    "Total Omzet (Rp)",
    "Jumlah Order/Transaksi",
    "Sisa Stok Tersedia",
  ]);

  let totalQty = 0;
  let totalRevenue = 0;

  items.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.product_name,
      item.variant_color || "-",
      item.variant_size || "-",
      item.sku || "-",
      item.total_qty || 0,
      item.avg_price || 0,
      item.total_subtotal || 0,
      item.total_orders || 0,
      item.current_stock ?? "-",
    ]);
    totalQty += Number(item.total_qty || 0);
    totalRevenue += Number(item.total_subtotal || 0);
  });

  rows.push([]);
  rows.push([
    "",
    "TOTAL",
    "",
    "",
    "",
    totalQty,
    "",
    totalRevenue,
    "",
    "",
  ]);

  const csvContent =
    "\uFEFF" +
    rows
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `rincian-penjualan-varian-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

