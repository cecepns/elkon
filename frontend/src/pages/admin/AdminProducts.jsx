import React, { useEffect, useState, useRef, useCallback } from "react";
import { request } from "../../utils/request";
import { api } from "../../utils/api";
import { API_ENDPOINTS } from "../../utils/endpoints";
import { getImageUrl } from "../../utils/api";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Loader2,
  X,
  Plus as PlusIcon
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminProducts({ onActionSuccess }) {
  // List data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // Table controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLimit, setSelectedLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debouncing search
  const debounceTimer = useRef(null);

  // Modal visibility states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // --- Form Fields States ---
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodStatus, setProdStatus] = useState("active");
  const [prodImagePreview, setProdImagePreview] = useState("");
  const [prodImageFile, setProdImageFile] = useState(null);
  const [prodVariants, setProdVariants] = useState([]);
  // Pre-Order Fields
  const [isPreorder, setIsPreorder] = useState(false);
  const [preorderDays, setPreorderDays] = useState(14);

  // Fetch Categories List
  const fetchCategories = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.CATEGORIES.LIST);
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
    }
  };

  // Fetch Products List
  const fetchProducts = useCallback(async (searchVal = searchTerm, pageVal = currentPage, limitVal = selectedLimit) => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, {
        search: searchVal,
        page: pageVal,
        limit: limitVal,
        sort: "newest",
      });
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Gagal memuat produk:", error);
      toast.error("Gagal memuat produk.");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, selectedLimit]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [currentPage, selectedLimit]);

  // Debounced search trigger for products
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      fetchProducts(val, 1, selectedLimit);
    }, 300);
  };

  const handleLimitChange = (e) => {
    const limit = parseInt(e.target.value);
    setSelectedLimit(limit);
    setCurrentPage(1);
    fetchProducts(searchTerm, 1, limit);
  };

  const handlePageChange = (p) => {
    if (p < 1 || p > pagination.totalPages) return;
    setCurrentPage(p);
  };

  // --- FORM ACTIONS ---
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdDesc("");
    setProdPrice("");
    setProdCategoryId(categories[0]?.id || "");
    setProdStatus("active");
    setIsPreorder(false);
    setPreorderDays(30);
    setProdImagePreview("");
    setProdImageFile(null);
    setProdVariants([
      { size: "S", color: "Beige", sku: `ELK-${Date.now().toString().slice(-3)}-S`, price_override: "", stock: 10 },
      { size: "M", color: "Beige", sku: `ELK-${Date.now().toString().slice(-3)}-M`, price_override: "", stock: 15 },
    ]);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdDesc(prod.description || "");
    setProdPrice(prod.base_price.toString());
    setProdCategoryId(prod.category_id || "");
    setProdStatus(prod.status);
    setIsPreorder(prod.is_preorder === 1 || prod.is_preorder === true);
    setPreorderDays(prod.preorder_days || 14);

    const fullImg = getImageUrl(prod.image);
    setProdImagePreview(prod.image ? fullImg : "");
    setProdImageFile(null);

    if (prod.variants && prod.variants.length > 0) {
      setProdVariants(
        prod.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku,
          price_override: v.price_override !== null ? v.price_override.toString() : "",
          stock: v.stock
        }))
      );
    } else {
      setProdVariants([]);
    }
    setIsProductModalOpen(true);
  };

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setProdImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProdImagePreview(reader.result);
    reader.readAsDataURL(file);
  }

  function handleAddVariantRow() {
    const randSuffix = Math.floor(100 + Math.random() * 900);
    setProdVariants([
      ...prodVariants,
      { size: "S", color: "Default", sku: `ELK-VAR-${randSuffix}`, price_override: "", stock: 10 }
    ]);
  }

  function handleUpdateVariantField(idx, field, val) {
    const updated = [...prodVariants];
    updated[idx][field] = val;
    setProdVariants(updated);
  }

  function handleRemoveVariantRow(idx) {
    const updated = [...prodVariants];
    updated.splice(idx, 1);
    setProdVariants(updated);
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!prodName.trim() || !prodPrice || !prodCategoryId) {
      toast.error("Nama produk, harga dasar, dan kategori wajib diisi.");
      return;
    }

    if (prodVariants.length === 0) {
      toast.error("Minimal harus terdapat satu varian kombinasi.");
      return;
    }

    setModalLoading(true);
    try {
      let finalImagePath = editingProduct ? editingProduct.image : "";

      if (prodImageFile) {
        const formData = new FormData();
        formData.append("image", prodImageFile);
        const uploadRes = await api.post(API_ENDPOINTS.UPLOAD, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (uploadRes.data.success) {
          finalImagePath = uploadRes.data.imageUrl;
        }
      }

      const payload = {
        name: prodName,
        description: prodDesc,
        base_price: parseFloat(prodPrice),
        image: finalImagePath,
        category_id: parseInt(prodCategoryId),
        status: prodStatus,
        is_preorder: isPreorder ? 1 : 0,
        preorder_days: isPreorder ? parseInt(preorderDays) : null,
        variants: prodVariants.map(v => ({
          id: v.id,
          size: v.size.trim(),
          color: v.color.trim(),
          sku: v.sku.trim(),
          price_override: v.price_override ? parseFloat(v.price_override) : null,
          stock: parseInt(v.stock) || 0,
        }))
      };

      if (editingProduct) {
        const res = await request.put(API_ENDPOINTS.PRODUCTS.UPDATE(editingProduct.id), payload);
        if (res.success) {
          toast.success("Produk berhasil diperbarui.");
          setIsProductModalOpen(false);
          fetchProducts();
          if (onActionSuccess) onActionSuccess();
        }
      } else {
        const res = await request.post(API_ENDPOINTS.PRODUCTS.CREATE, payload);
        if (res.success) {
          toast.success("Produk berhasil disimpan.");
          setIsProductModalOpen(false);
          fetchProducts();
          if (onActionSuccess) onActionSuccess();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan produk.");
    } finally {
      setModalLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const toastId = toast.loading("Sedang menghapus...");

    try {
      const res = await request.delete(API_ENDPOINTS.PRODUCTS.DELETE(itemToDelete.id));
      if (res.success) {
        toast.success("Produk berhasil dihapus.", { id: toastId });
        setItemToDelete(null);
        fetchProducts();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus produk.", { id: toastId });
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Controls and Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">DAFTAR PAKAIAN</h2>
          <p className="text-xs text-stone-400">Kelola katalog produk, pre-order, dan matrix persediaan varian pakaian.</p>
        </div>
        <button
          onClick={openCreateProduct}
          className="flex items-center justify-center space-x-2 bg-stone-900 text-white px-5 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-stone-50 p-4 border border-stone-150">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-450" />
          <input
            type="text"
            className="w-full bg-white border border-stone-250 pl-10 pr-4 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
            placeholder="Cari pakaian (realtime debounce)..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-550 uppercase tracking-wider">Per Halaman:</span>
          <select
            value={selectedLimit}
            onChange={handleLimitChange}
            className="bg-white border border-stone-250 text-xs text-stone-700 px-3 py-2 focus:border-stone-900 focus:outline-none"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 border border-stone-150 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-stone-550" />
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-stone-150">
          <ImageIcon className="h-10 w-10 text-stone-200" />
          <p className="text-xs text-stone-400 mt-2">Belum ada produk yang didaftarkan.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-stone-150 bg-white rounded shadow-xs">
          <table className="min-w-full divide-y divide-stone-150 text-left text-sm">
            <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-550">
              <tr>
                <th className="px-6 py-4">Foto</th>
                <th className="px-6 py-4">Detail Pakaian</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Harga Dasar</th>
                <th className="px-6 py-4 text-center">Pre-Order</th>
                <th className="px-6 py-4 text-center">Jumlah Varian</th>
                <th className="px-6 py-4 text-center">Total Unit</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-750">
              {products.map((prod) => {
                const img = getImageUrl(prod.image);

                return (
                  <tr key={prod.id} className="hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="h-14 w-10 border border-stone-100 overflow-hidden bg-stone-50">
                        {prod.image ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-stone-300">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-semibold text-stone-900">{prod.name}</div>
                      <div className="text-xs text-stone-400 line-clamp-1">{prod.description}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-600">
                      {prod.category || "Tanpa Kategori"}
                    </td>
                    <td className="px-6 py-4 font-semibold text-stone-900">
                      {formatPrice(prod.base_price)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {(prod.is_preorder === 1 || prod.is_preorder === true) ? (
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-semibold bg-stone-900 text-white uppercase tracking-wider">
                          {prod.preorder_days || 14} Hari
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 font-light">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {prod.variants?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-semibold ${prod.total_stock === 0 ? 'text-red-650' : 'text-stone-700'}`}>
                        {prod.total_stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded ${prod.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-stone-100 text-stone-500'
                        }`}>
                        {prod.status === 'active' ? 'Aktif' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => openEditProduct(prod)}
                          className="text-stone-500 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(prod)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-100">
          <span className="text-xs text-stone-500">
            Menampilkan Halaman <span className="font-semibold text-stone-850">{pagination.page}</span> dari{" "}
            <span className="font-semibold text-stone-850">{pagination.totalPages}</span>
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:hover:text-stone-600 bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => handlePageChange(pNum)}
                className={`px-3 py-1 text-xs font-semibold ${pagination.page === pNum
                    ? "bg-stone-900 text-white"
                    : "border border-stone-200 text-stone-600 hover:text-stone-900 bg-white"
                  }`}
              >
                {pNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 border border-stone-200 text-stone-600 hover:text-stone-900 disabled:opacity-40 disabled:hover:text-stone-600 bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION DELETE DIALOG --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => setItemToDelete(null)} />
          <div className="relative transform overflow-hidden bg-white border border-stone-150 max-w-sm w-full p-6 text-left shadow-2xl transition-all">
            <h3 className="font-serif text-lg font-medium text-stone-900 uppercase tracking-wider">Konfirmasi Hapus</h3>
            <p className="mt-3 text-xs text-stone-550 leading-relaxed">
              Apakah Anda yakin ingin menghapus pakaian <span className="font-semibold text-stone-900">"{itemToDelete.name}"</span>? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 border border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:bg-stone-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-650 hover:bg-red-755 text-white text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- FORM MODAL: CREATE / EDIT PRODUCT --- */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs" onClick={() => !modalLoading && setIsProductModalOpen(false)} />
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative transform bg-[#FBFBF9] border border-stone-150 max-w-3xl w-full p-8 shadow-2xl transition-all space-y-6">
              <button
                disabled={modalLoading}
                className="absolute top-4 right-4 rounded-full p-2 text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                onClick={() => setIsProductModalOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>

              <div className="space-y-1">
                <span className="text-[9px] font-semibold tracking-wider text-stone-400 uppercase">
                  {editingProduct ? "Perbarui informasi pakaian" : "Daftarkan pakaian baru"}
                </span>
                <h3 className="font-serif text-xl font-light text-stone-900 uppercase tracking-widest">
                  {editingProduct ? "Edit Produk & Varian" : "Buat Produk Baru"}
                </h3>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Produk</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white border border-stone-250 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. Linen Slouchy Blazer"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Kategori Dinamis</label>
                      <select
                        value={prodCategoryId}
                        onChange={(e) => setProdCategoryId(e.target.value)}
                        className="w-full bg-white border border-stone-250 px-3 py-2 text-sm text-stone-755 focus:border-stone-900 focus:outline-none"
                      >
                        <option value="">Pilih Kategori...</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Harga Dasar (IDR)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full bg-white border border-stone-250 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                        placeholder="cth. 2500000"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Visibilitas Katalog</label>
                      <div className="flex gap-4">
                        <label className="flex items-center space-x-2 text-xs text-stone-750 font-medium cursor-pointer">
                          <input
                            type="radio"
                            name="prodStatus"
                            value="active"
                            checked={prodStatus === "active"}
                            onChange={() => setProdStatus("active")}
                            className="accent-stone-900"
                          />
                          <span>Aktif (Tampil)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs text-stone-750 font-medium cursor-pointer">
                          <input
                            type="radio"
                            name="prodStatus"
                            value="draft"
                            checked={prodStatus === "draft"}
                            onChange={() => setProdStatus("draft")}
                            className="accent-stone-900"
                          />
                          <span>Draft (Disembunyikan)</span>
                        </label>
                      </div>
                    </div>

                    {/* Pre-Order Checkbox & Custom Estimation Days input */}
                    <div className="space-y-3 p-4 bg-stone-50 border border-stone-200">
                      <label className="flex items-center space-x-2.5 text-xs text-stone-750 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-stone-900 h-4 w-4 cursor-pointer"
                          checked={isPreorder}
                          onChange={(e) => setIsPreorder(e.target.checked)}
                        />
                        <span>Aktifkan Fitur Pre-Order</span>
                      </label>
                      {isPreorder && (
                        <div className="space-y-1 pl-6">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-stone-500">Estimasi Pengiriman (Hari)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            className="w-32 bg-white border border-stone-250 px-3 py-1.5 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all"
                            placeholder="cth. 30"
                            value={preorderDays}
                            onChange={(e) => setPreorderDays(e.target.value)}
                          />
                          <p className="text-[9px] text-stone-400">Jumlah hari perkiraan proses produksi dan pengemasan produk preorder.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-start space-y-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Gambar Cover Produk</label>
                      <div className="border border-dashed border-stone-255 bg-stone-50/50 p-4 rounded flex flex-col items-center justify-center text-center space-y-2 h-[200px] relative overflow-hidden">
                        {prodImagePreview ? (
                          <>
                            <img src={prodImagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/90 text-stone-900 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow">Ganti Foto</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-stone-300" />
                            <span className="text-[11px] text-stone-400 font-light">Pilih berkas JPG/PNG gambar produk</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Deskripsi Pakaian</label>
                      <textarea
                        rows="4"
                        className="w-full bg-white border border-stone-250 px-3 py-2 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all resize-none"
                        placeholder="Keterangan serat kain, kecocokan potong, instruksi model..."
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-stone-200" />

                {/* Variants Matrix */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-stone-900">Konfigurasi Varian Kombinasi</h4>
                      <p className="text-[10px] text-stone-450">Tentukan ukuran, warna, kode SKU unik, harga override varian, dan persediaan unit.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariantRow}
                      className="inline-flex items-center space-x-1.5 border border-stone-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-900 hover:bg-stone-900 hover:text-white transition-all"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>Tambah Kombinasi</span>
                    </button>
                  </div>

                  <div className="border border-stone-200 rounded max-h-[180px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-stone-200 text-left text-xs bg-white">
                      <thead className="bg-stone-50 font-bold uppercase tracking-wider text-stone-550 text-[9px] sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2.5">Ukuran</th>
                          <th className="px-4 py-2.5">Warna</th>
                          <th className="px-4 py-2.5">Kode SKU</th>
                          <th className="px-4 py-2.5">Harga Override</th>
                          <th className="px-4 py-2.5">Stok Unit</th>
                          <th className="px-4 py-2.5 text-right">Hapus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-150">
                        {prodVariants.map((v, index) => (
                          <tr key={index}>
                            <td className="px-4 py-1">
                              <input
                                type="text"
                                required
                                className="w-16 border border-stone-200 px-2 py-1 text-xs focus:outline-none"
                                value={v.size}
                                onChange={(e) => handleUpdateVariantField(index, "size", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-1">
                              <input
                                type="text"
                                required
                                className="w-24 border border-stone-200 px-2 py-1 text-xs focus:outline-none"
                                value={v.color}
                                onChange={(e) => handleUpdateVariantField(index, "color", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-1">
                              <input
                                type="text"
                                required
                                className="w-36 border border-stone-200 px-2 py-1 text-xs font-mono focus:outline-none"
                                value={v.sku}
                                onChange={(e) => handleUpdateVariantField(index, "sku", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-1">
                              <input
                                type="number"
                                className="w-28 border border-stone-200 px-2 py-1 text-xs focus:outline-none"
                                placeholder="Pakai harga dasar"
                                value={v.price_override}
                                onChange={(e) => handleUpdateVariantField(index, "price_override", e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-1">
                              <input
                                type="number"
                                required
                                min="0"
                                className="w-16 border border-stone-200 px-2 py-1 text-xs focus:outline-none"
                                value={v.stock}
                                onChange={(e) => handleUpdateVariantField(index, "stock", parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td className="px-4 py-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantRow(index)}
                                className="text-red-400 hover:text-red-650 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="h-[1px] w-full bg-stone-200" />

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    disabled={modalLoading}
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-5 py-3 border border-stone-250 text-xs font-semibold uppercase tracking-widest text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="flex items-center justify-center space-x-2 bg-stone-900 text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                  >
                    {modalLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>{modalLoading ? "Menyimpan..." : "Simpan Produk"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
