import { useEffect, useState, useCallback, useMemo } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import { getImageUrl } from "../../utils/api";
import { getOrderStatusMeta } from "../../utils/orderStatus";
import { exportMatrixCsv, exportVariantListCsv } from "../../utils/salesExport";
import {
  Loader2,
  X,
  Eye,
  Inbox,
  Search,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Package,
  Wallet,
  ShoppingBag,
  Layers,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(price) || 0);

const formatNumber = (n) => new Intl.NumberFormat("id-ID").format(Number(n) || 0);

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const STATUS_FILTER_OPTIONS = [
  { value: "valid", label: "Valid (Dibayar s/d Selesai)" },
  { value: "all_except_cancelled", label: "Semua Kecuali Batal/Kedaluwarsa" },
  { value: "all", label: "Semua Status" },
  { value: "pending", label: "Menunggu Pembayaran" },
  { value: "paid", label: "Sudah Dibayar" },
  { value: "processing", label: "Sedang Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
  { value: "expired", label: "Kedaluwarsa" },
];

const SORT_OPTIONS = [
  { value: "qty_desc", label: "Qty Terbanyak" },
  { value: "qty_asc", label: "Qty Tersedikit" },
  { value: "subtotal_desc", label: "Omzet Tertinggi" },
  { value: "subtotal_asc", label: "Omzet Terendah" },
  { value: "name_asc", label: "Nama A-Z" },
  { value: "name_desc", label: "Nama Z-A" },
];

const LIMIT_OPTIONS = [10, 25, 50, 100];

const selectCls =
  "bg-white border border-stone-200 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-600 focus:border-stone-900 focus:outline-none";
const dateCls =
  "bg-white border border-stone-200 px-3 py-2.5 text-xs text-stone-700 focus:border-stone-900 focus:outline-none";

export default function AdminSalesReport() {
  const [items, setItems] = useState([]);
  const [matrix, setMatrix] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [summary, setSummary] = useState({
    total_items_sold: 0,
    total_revenue: 0,
    total_orders: 0,
    total_variants: 0,
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Tampilan: "variants" (rincian per varian) | "matrix" (matriks ukuran)
  const [view, setView] = useState("variants");

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("valid");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("qty_desc");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  // Detail pembeli
  const [detail, setDetail] = useState(null); // { product_name, variant_color, variant_size }
  const [detailOrders, setDetailOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  // Debounce search 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const baseParams = useMemo(
    () => ({
      status,
      search: search || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [status, search, startDate, endDate]
  );

  const filterLabel = useMemo(() => {
    const statusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === status)?.label || status;
    const parts = [statusLabel];
    if (startDate || endDate) parts.push(`${startDate || "..."} s/d ${endDate || "..."}`);
    if (search) parts.push(`Cari: "${search}"`);
    return parts.join(" | ");
  }, [status, startDate, endDate, search]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.SALES_REPORT, {
        ...baseParams,
        page,
        limit,
        sort,
      });
      if (res.success) {
        setItems(res.data || []);
        setPagination(res.pagination || { page: 1, limit, total: 0, totalPages: 0 });
        setSummary(res.summary || {});
        setMatrix(res.matrix || []);
        setAvailableSizes(res.availableSizes || []);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan penjualan:", error);
    } finally {
      setLoading(false);
    }
  }, [baseParams, page, limit, sort]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const hasActiveFilter =
    status !== "valid" || startDate || endDate || searchInput || sort !== "qty_desc";

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("valid");
    setStartDate("");
    setEndDate("");
    setSort("qty_desc");
    setPage(1);
  };

  // --- Detail pembeli ---
  const openDetail = async (row) => {
    setDetail({
      product_name: row.product_name,
      variant_color: row.variant_color,
      variant_size: row.variant_size,
    });
    setDetailOrders([]);
    setDetailLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ORDERS.SALES_REPORT_DETAIL, {
        product_name: row.product_name,
        variant_color: row.variant_color,
        variant_size: row.variant_size,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res.success) setDetailOrders(res.data?.orders || []);
    } catch (error) {
      console.error(error);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Export CSV ---
  const handleExportMatrix = () => {
    if (!matrix.length) return toast.error("Tidak ada data untuk diekspor.");
    exportMatrixCsv({ matrix, availableSizes, filterLabel });
    toast.success("Rekap matriks ukuran berhasil diunduh.");
  };

  const handleExportVariants = async () => {
    setExporting(true);
    try {
      // Ambil seluruh data (limit = -1), bukan hanya halaman aktif
      const res = await request.get(API_ENDPOINTS.ORDERS.SALES_REPORT, {
        ...baseParams,
        page: 1,
        limit: -1,
        sort,
      });
      const all = res?.data || [];
      if (!all.length) return toast.error("Tidak ada data untuk diekspor.");
      exportVariantListCsv({ items: all, filterLabel });
      toast.success("Rincian penjualan per varian berhasil diunduh.");
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const detailTotals = useMemo(
    () =>
      detailOrders.reduce(
        (acc, o) => ({
          qty: acc.qty + Number(o.quantity || 0),
          subtotal: acc.subtotal + Number(o.subtotal || 0),
        }),
        { qty: 0, subtotal: 0 }
      ),
    [detailOrders]
  );

  const sizeTotals = useMemo(() => {
    const totals = {};
    availableSizes.forEach((sz) => (totals[sz] = 0));
    matrix.forEach((m) =>
      availableSizes.forEach((sz) => {
        totals[sz] += Number(m.sizes?.[sz] || 0);
      })
    );
    return totals;
  }, [matrix, availableSizes]);

  const summaryCards = [
    { label: "Total Pcs Terjual", value: formatNumber(summary.total_items_sold), icon: Package },
    { label: "Total Omzet", value: formatPrice(summary.total_revenue), icon: Wallet },
    { label: "Total Pesanan", value: formatNumber(summary.total_orders), icon: ShoppingBag },
    { label: "Varian Terjual", value: formatNumber(summary.total_variants), icon: Layers },
  ];

  const rowOffset = limit > 0 ? (pagination.page - 1) * limit : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-light text-stone-900 tracking-wide">Laporan Penjualan</h2>
          <p className="text-xs text-stone-500">
            Rekap penjualan per varian produk (seri, warna, ukuran) dan matriks ukuran untuk eksekusi produksi.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportMatrix}
            disabled={loading || !matrix.length}
            className="inline-flex items-center space-x-2 border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-stone-700 hover:border-stone-900 hover:text-stone-900 disabled:opacity-40 transition-all cursor-pointer"
          >
            <FileDown className="h-4 w-4" />
            <span>Export Matriks Ukuran</span>
          </button>
          <button
            type="button"
            onClick={handleExportVariants}
            disabled={loading || exporting || !summary.total_variants}
            className="inline-flex items-center space-x-2 bg-stone-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-stone-800 disabled:opacity-40 transition-all cursor-pointer"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            <span>Export Rincian Varian</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-stone-150 p-5 flex items-center justify-between shadow-xs">
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">{label}</span>
              <p className="text-lg sm:text-xl font-semibold text-stone-850 truncate">{value}</p>
            </div>
            <Icon className="h-7 w-7 text-stone-300 shrink-0 ml-2" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama produk / warna / ukuran / SKU..."
              className="w-full bg-white border border-stone-200 pl-9 pr-3 py-2.5 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className={selectCls}
            >
              {LIMIT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o} / halaman
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Dari</label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className={dateCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Sampai</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className={dateCls}
            />
          </div>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center space-x-1.5 text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex border-b border-stone-200">
        {[
          { key: "variants", label: `Rincian Per Varian (${pagination.total})` },
          { key: "matrix", label: `Matriks Ukuran (${matrix.length})` },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              view === t.key
                ? "border-stone-900 text-stone-900"
                : "border-transparent text-stone-400 hover:text-stone-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white border border-stone-150">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : (view === "variants" ? items.length === 0 : matrix.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <Inbox className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">Tidak ada data penjualan yang cocok dengan filter.</p>
        </div>
      ) : view === "variants" ? (
        <>
          <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
            <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
              <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">No</th>
                  <th className="px-4 py-4">Produk / Seri</th>
                  <th className="px-4 py-4">Warna</th>
                  <th className="px-4 py-4 text-center">Ukuran</th>
                  <th className="px-4 py-4 text-center">Qty</th>
                  <th className="px-4 py-4 text-right">Rata-rata Harga</th>
                  <th className="px-4 py-4 text-right">Omzet</th>
                  <th className="px-4 py-4 text-center">Order</th>
                  <th className="px-4 py-4 text-center">Sisa Stok</th>
                  <th className="px-4 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 text-stone-755">
                {items.map((row, idx) => {
                  const stock = row.current_stock;
                  const lowStock = stock !== null && stock !== undefined && Number(stock) <= 0;
                  return (
                    <tr
                      key={`${row.product_name}-${row.variant_color}-${row.variant_size}`}
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-xs text-stone-400">{rowOffset + idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="h-12 w-10 shrink-0 bg-stone-100 border border-stone-150 overflow-hidden">
                            {row.image ? (
                              <img
                                src={getImageUrl(row.image)}
                                alt={row.product_name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-stone-900 truncate">{row.product_name}</p>
                            <p className="font-mono text-[10px] text-stone-400">{row.sku || "-"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{row.variant_color}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase bg-stone-100 border border-stone-200 text-stone-700">
                          {row.variant_size}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-stone-900">
                        {formatNumber(row.total_qty)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs">{formatPrice(row.avg_price)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-900">
                        {formatPrice(row.total_subtotal)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">{formatNumber(row.total_orders)}</td>
                      <td className="px-4 py-3 text-center text-xs">
                        {stock === null || stock === undefined ? (
                          "-"
                        ) : (
                          <span className={lowStock ? "font-semibold text-red-650" : ""}>{formatNumber(stock)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(row)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-stone-200 text-[10px] font-semibold uppercase tracking-wider text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Pembeli</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {limit > 0 && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
              <span>
                Halaman {pagination.page} dari {pagination.totalPages} · {formatNumber(pagination.total)} varian
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center px-3 py-2 border border-stone-200 bg-white hover:border-stone-900 disabled:opacity-40 disabled:hover:border-stone-200 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center px-3 py-2 border border-stone-200 bg-white hover:border-stone-900 disabled:opacity-40 disabled:hover:border-stone-200 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
          <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
              <tr>
                <th className="px-4 py-4 w-12 text-center">No</th>
                <th className="px-4 py-4">Produk / Seri</th>
                <th className="px-4 py-4">Warna</th>
                {availableSizes.map((sz) => (
                  <th key={sz} className="px-3 py-4 text-center">
                    {sz}
                  </th>
                ))}
                <th className="px-4 py-4 text-center">Total Pcs</th>
                <th className="px-4 py-4 text-right">Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-755">
              {matrix.map((m, idx) => (
                <tr key={`${m.product_name}-${m.variant_color}`} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-3 text-center text-xs text-stone-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="h-12 w-10 shrink-0 bg-stone-100 border border-stone-150 overflow-hidden">
                        {m.image ? (
                          <img
                            src={getImageUrl(m.image)}
                            alt={m.product_name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <p className="font-medium text-stone-900">{m.product_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{m.variant_color}</td>
                  {availableSizes.map((sz) => {
                    const qty = m.sizes?.[sz] || 0;
                    return (
                      <td
                        key={sz}
                        className={`px-3 py-3 text-center text-xs ${
                          qty > 0 ? "font-semibold text-stone-900" : "text-stone-300"
                        }`}
                      >
                        {qty > 0 ? formatNumber(qty) : "–"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-semibold text-stone-900">{formatNumber(m.total_qty)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-stone-900">{formatPrice(m.total_subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-stone-50 text-xs font-bold text-stone-900">
              <tr>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 uppercase tracking-wider" colSpan={2}>
                  Total Keseluruhan
                </td>
                {availableSizes.map((sz) => (
                  <td key={sz} className="px-3 py-3 text-center">
                    {formatNumber(sizeTotals[sz])}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  {formatNumber(matrix.reduce((a, m) => a + Number(m.total_qty || 0), 0))}
                </td>
                <td className="px-4 py-3 text-right">
                  {formatPrice(matrix.reduce((a, m) => a + Number(m.total_subtotal || 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* --- MODAL: DETAIL PEMBELI PER VARIAN --- */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setDetail(null)} />
          <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl space-y-5">
            <button
              className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50 cursor-pointer"
              onClick={() => setDetail(null)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Daftar Pembeli Varian
              </span>
              <h3 className="font-serif text-xl text-stone-900">{detail.product_name}</h3>
              <p className="text-xs text-stone-500">
                Warna: <span className="font-semibold text-stone-800">{detail.variant_color}</span> · Ukuran:{" "}
                <span className="font-semibold text-stone-800">{detail.variant_size}</span>
              </p>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
              </div>
            ) : detailOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-10 w-10 text-stone-200" />
                <p className="text-xs text-stone-400 mt-2">Tidak ada pembeli untuk varian ini.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-stone-150 bg-white">
                  <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
                    <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
                      <tr>
                        <th className="px-4 py-3">Referensi</th>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Pembeli</th>
                        <th className="px-4 py-3">Kota</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-150 text-stone-755">
                      {detailOrders.map((o, i) => {
                        const meta = getOrderStatusMeta(o.order_status);
                        return (
                          <tr key={`${o.order_id}-${i}`}>
                            <td className="px-4 py-3 font-mono text-xs text-stone-900">{o.reference_id}</td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium text-stone-900">{o.buyer_name}</p>
                              <p className="text-[10px] text-stone-400">{o.buyer_phone || o.buyer_email || "-"}</p>
                            </td>
                            <td className="px-4 py-3 text-xs">{o.city || "-"}</td>
                            <td className="px-4 py-3 text-center font-semibold">{formatNumber(o.quantity)}</td>
                            <td className="px-4 py-3 text-right text-xs font-semibold">{formatPrice(o.subtotal)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${meta.badge}`}>
                                {meta.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-6 text-xs text-stone-600">
                  <span>
                    Total Qty: <b className="text-stone-900">{formatNumber(detailTotals.qty)}</b>
                  </span>
                  <span>
                    Total Omzet: <b className="text-stone-900">{formatPrice(detailTotals.subtotal)}</b>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
