import React, { useEffect, useState } from "react";
import { request } from "../../utils/request";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings({ onActionSuccess }) {
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [whatsappNumberSetting, setWhatsappNumberSetting] = useState("");

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request.get("/settings");
      if (res.success && res.data) {
        setWhatsappNumberSetting(res.data.whatsapp_number || "");
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
      toast.error("Gagal memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();

    if (!whatsappNumberSetting.trim()) {
      toast.error("Nomor WhatsApp wajib diisi.");
      return;
    }

    // Basic WhatsApp validation format (numeric only, usually starts with country code like 62...)
    const cleanNum = whatsappNumberSetting.trim().replace(/\D/g, "");
    if (cleanNum.length < 9) {
      toast.error("Silakan masukkan nomor WhatsApp yang valid (hanya angka).");
      return;
    }

    setModalLoading(true);
    const toastId = toast.loading("Menyimpan pengaturan...");
    try {
      const res = await request.put("/settings", { whatsapp_number: cleanNum });
      if (res.success) {
        toast.success("Pengaturan berhasil disimpan.", { id: toastId });
        fetchSettings();
        if (onActionSuccess) onActionSuccess();
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan pengaturan.", { id: toastId });
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg bg-white border border-stone-150 p-8 shadow-xs">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-light text-stone-900 uppercase tracking-widest">Pengaturan Global Toko</h3>
        <p className="text-xs text-stone-400">Sesuaikan data operasional dan kanal kontak transaksi langsung.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-stone-500" />
        </div>
      ) : (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Nomor WhatsApp Admin (Checkout & Floating WA)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full bg-stone-50/50 border border-stone-250 px-3 py-3 text-sm text-stone-955 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. 628123456789"
                value={whatsappNumberSetting}
                onChange={(e) => setWhatsappNumberSetting(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-stone-450 leading-relaxed">
              Masukkan nomor WhatsApp lengkap menggunakan kode negara di bagian depan (tanpa tanda '+' atau spasi), contoh: <span className="font-mono font-medium text-stone-700">628123456789</span> untuk nomor Indonesia.
            </p>
          </div>

          <div className="h-[1px] w-full bg-stone-100" />

          <button
            type="submit"
            disabled={modalLoading}
            className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
          >
            {modalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{modalLoading ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
