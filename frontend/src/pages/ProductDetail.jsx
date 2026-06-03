import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { getImageUrl } from "../utils/api";
import { Minus, Plus, ShoppingBag, ArrowLeft, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetail({ onAddToCart, whatsappNumber }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Variant selector states
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await request.get(API_ENDPOINTS.PRODUCTS.DETAIL(id));
        if (res.success) {
          setProduct(res.data);

          if (res.data.variants && res.data.variants.length > 0) {
            const sizes = [...new Set(res.data.variants.map(v => v.size))];
            const colors = [...new Set(res.data.variants.map(v => v.color))];

            setSelectedSize(sizes[0] || "");
            setSelectedColor(colors[0] || "");
          }
        }
      } catch (error) {
        console.error("Gagal memuat detail produk:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product || !product.variants) return;

    const found = product.variants.find(
      (v) => v.size === selectedSize && v.color === selectedColor
    );

    setSelectedVariant(found || null);
    setQuantity(1);
  }, [selectedSize, selectedColor, product]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-stone-850" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <AlertTriangle className="h-10 w-10 text-stone-400 mx-auto" />
        <h2 className="font-serif text-2xl text-stone-850">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-stone-550">Produk yang Anda cari tidak tersedia atau telah dihapus.</p>
        <Link to="/shop" className="inline-block border border-stone-900 px-6 py-2 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:bg-stone-900 hover:text-white transition-all">
          Kembali ke Toko
        </Link>
      </div>
    );
  }

  const availableSizes = [...new Set(product.variants.map(v => v.size))];
  const availableColors = [...new Set(product.variants.map(v => v.color))];

  const currentPrice = selectedVariant && selectedVariant.price_override !== null
    ? parseFloat(selectedVariant.price_override)
    : parseFloat(product.base_price);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAdd = () => {
    if (!selectedVariant) {
      toast.error("Silakan pilih kombinasi warna dan ukuran terlebih dahulu.");
      return;
    }

    if (selectedVariant.stock <= 0) {
      toast.error("Kombinasi varian ini saat ini sedang habis.");
      return;
    }

    onAddToCart(product, selectedVariant, quantity);
  };

  const handleBuyWhatsApp = () => {
    if (!selectedVariant) {
      toast.error("Silakan pilih kombinasi warna dan ukuran terlebih dahulu.");
      return;
    }

    if (!whatsappNumber) {
      toast.error("Nomor WhatsApp belum dikonfigurasi oleh admin.");
      return;
    }

    const price = selectedVariant.price_override !== null ? selectedVariant.price_override : product.base_price;
    const preorderText = (product.is_preorder === 1 || product.is_preorder === true) ? `\n*Status*: Pre-Order (${product.preorder_days || 30} Hari)` : "";
    const textMessage = `Halo elkon, saya tertarik membeli produk berikut:\n\n*Nama Produk*: ${product.name}${preorderText}\n*Ukuran*: ${selectedVariant.size}\n*Warna*: ${selectedVariant.color}\n*SKU*: ${selectedVariant.sku}\n*Harga*: ${formatPrice(price)}\n*Jumlah*: ${quantity}\n\nMohon dibantu untuk proses pemesanan. Terima kasih.`;

    const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, "_blank");
  };

  const imageUrl = getImageUrl(product.image);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back button */}
      <div>
        <Link to="/shop" className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke toko</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Side */}
        <div className="overflow-hidden bg-stone-50 border border-stone-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-auto aspect-[3/4] object-cover object-center fade-in duration-500"
          />
        </div>

        {/* Right Side */}
        <div className="flex flex-col justify-between space-y-8 py-4">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-400">
                {product.category || "Tanpa Kategori"}
              </span>
              {(product.is_preorder === 1 || product.is_preorder === true) && (
                <span className="bg-stone-900 text-white text-[8px] font-semibold uppercase tracking-widest px-2 py-0.5 shadow-sm">
                  Pre-Order: {product.preorder_days || 30} Hari
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-light text-stone-900 leading-tight">
              {product.name}
            </h1>
            <p className="text-xl font-light tracking-wide text-stone-900">
              {formatPrice(currentPrice)}
            </p>

            <div className="h-[1px] w-full bg-stone-100" />

            <p className="text-sm font-light text-stone-500 leading-relaxed">
              {product.description}
            </p>

            {(product.is_preorder === 1 || product.is_preorder === true) && (
              <div className="bg-stone-550/5 border border-stone-200 p-4 text-xs space-y-1">
                <p className="font-semibold uppercase tracking-wider text-stone-850">Informasi Pemesanan Pre-Order</p>
                <p className="text-stone-550 font-light leading-relaxed">
                  Produk ini adalah produk pre-order dengan waktu estimasi pengerjaan dan pengiriman sekitar <span className="font-semibold text-stone-900">{product.preorder_days || 30} hari</span>. Kami akan mengirimkan pesanan Anda sesegera mungkin setelah proses produksi selesai.
                </p>
              </div>
            )}

            <div className="h-[1px] w-full bg-stone-100" />

            {/* Colors */}
            {availableColors.length > 0 && availableColors[0] !== "Default" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Warna: {selectedColor}</span>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 text-xs font-medium border uppercase tracking-wider transition-all duration-200 ${isSelected
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
                          }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && availableSizes[0] !== "One Size" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Ukuran: {selectedSize}</span>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`h-10 min-w-10 px-3 flex items-center justify-center text-xs font-medium border transition-all duration-250 ${isSelected
                            ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                            : "border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900"
                          }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock indicator */}
            {selectedVariant && (
              <div className="text-xs flex items-center space-x-2">
                <div
                  className={`h-2 w-2 rounded-full ${selectedVariant.stock > 10
                      ? "bg-green-500"
                      : selectedVariant.stock > 0
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                />
                <span className="text-stone-550">
                  {selectedVariant.stock > 10
                    ? `Tersedia (${selectedVariant.stock} item tersisa)`
                    : selectedVariant.stock > 0
                      ? `Stok Menipis (${selectedVariant.stock} item tersisa)`
                      : "Stok Habis Sementara"}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {selectedVariant && selectedVariant.stock > 0 && (
              <div className="space-y-4">
                {/* Fixed Quantity Adjuster layout block (prevents wrapping offset issue completely) */}
                <div className="flex items-center border border-stone-200 h-14 bg-white max-w-xs">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-full px-5 hover:bg-stone-50 text-stone-500 hover:text-stone-900 disabled:opacity-35 transition-colors border-r border-stone-150 flex items-center justify-center"
                    type="button"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center select-none flex flex-col justify-center">
                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest block leading-none">Jumlah</span>
                    <span className="text-sm font-bold text-stone-900 block mt-1 leading-none">{quantity}</span>
                  </div>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                    disabled={quantity >= selectedVariant.stock}
                    className="h-full px-5 hover:bg-stone-50 text-stone-500 hover:text-stone-900 disabled:opacity-35 transition-colors border-l border-stone-150 flex items-center justify-center"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Add to Bag */}
                  <button
                    onClick={handleAdd}
                    className="w-full sm:flex-1 flex items-center justify-center space-x-3 bg-stone-900 h-14 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black transition-all duration-200"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Tambah ke Keranjang</span>
                  </button>

                  {/* Beli via WhatsApp Option (dynamic whatsapp number link) */}
                  <button
                    onClick={handleBuyWhatsApp}
                    className="w-full sm:flex-1 flex items-center justify-center space-x-3 border border-[#25D366] text-[#25D366] bg-white h-14 text-xs font-semibold uppercase tracking-widest hover:bg-[#25D366] hover:text-white transition-all duration-200"
                  >
                    {/* SVG WA logo */}
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.012 2C6.48 2 2 6.48 2 12.012c0 1.764.456 3.48 1.332 5.004L2 22l5.124-1.332c1.464.792 3.12 1.212 4.888 1.212 5.532 0 10.012-4.48 10.012-10.012C22.024 6.48 17.544 2 12.012 2zm5.736 14.292c-.24.672-1.2 1.236-1.656 1.296-.456.06-1.044.096-1.68-.108-.408-.132-.936-.312-1.572-.588-2.676-1.152-4.404-3.864-4.536-4.044-.132-.18-.996-1.32-.996-2.52 0-1.2.624-1.788.852-2.04.228-.252.504-.312.672-.312.168 0 .336.012.48.024.156.012.36-.048.564.444.204.492.708 1.728.768 1.848.06.12.096.264.012.432-.084.168-.18.276-.3.408-.12.132-.252.276-.36.384-.12.12-.24.252-.108.48.132.228.588.972 1.26 1.572.864.768 1.596 1.008 1.824 1.116.228.108.36.096.492-.048.132-.144.564-.66.72-.888.156-.228.312-.192.528-.108.216.084 1.368.648 1.608.768.24.12.408.18.468.276.06.108.06.612-.18 1.284z" />
                    </svg>
                    <span>Beli via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}

            {selectedVariant && selectedVariant.stock === 0 && (
              <button
                disabled
                className="w-full bg-stone-250 text-stone-400 h-14 text-xs font-semibold uppercase tracking-widest cursor-not-allowed"
              >
                Stok Habis
              </button>
            )}

            {/* Premium Details */}
            <div className="border-t border-stone-100 pt-6 space-y-4 text-xs text-stone-500 leading-relaxed font-light">
              <div className="flex justify-between items-center text-stone-800 font-medium">
                <span className="uppercase tracking-wider">Perawatan Pakaian</span>
                <span>Dry Clean Direkomendasikan</span>
              </div>
              <p>
                Produk linen dan sutra organik kami dibuat dengan teknik tradisional. Cuci dengan tangan menggunakan air dingin dengan deterjen ber-pH netral atau lakukan cuci kering (dry clean) untuk menjaga tekstur anyaman kain tetap sempurna.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
