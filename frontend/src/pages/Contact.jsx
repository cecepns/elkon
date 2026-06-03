import React, { useState } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Semua field wajib diisi.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Mengirim pesan Anda...");
    try {
      const res = await request.post(API_ENDPOINTS.CONTACTS.SUBMIT, {
        name,
        email,
        message,
      });

      if (res.success) {
        toast.success(res.message || "Pesan Anda berhasil dikirim!", { id: toastId });
        setName("");
        setEmail("");
        setMessage("");
      }
    } catch (error) {
      toast.dismiss(toastId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Title */}
      <div className="space-y-2 border-b border-stone-100 pb-6 text-center md:text-left">
        <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-stone-400">Hubungi Kami</span>
        <h1 className="font-serif text-3xl md:text-5xl font-light text-stone-900 uppercase tracking-widest">Kontak Kami</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Side: Brand info */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-light text-stone-900">elkon Showroom</h2>
            <p className="text-sm font-light text-stone-500 leading-relaxed">
              Kunjungi ruang pameran kami untuk melihat langsung tekstur kain organik dan fitting eksklusif koleksi kami.
            </p>
          </div>

          <div className="space-y-4 text-sm font-light text-stone-600">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-stone-450 mt-0.5 flex-shrink-0" />
              <span>Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan, Indonesia</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-stone-450 flex-shrink-0" />
              <span>+62 21 8976 5432</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-stone-450 flex-shrink-0" />
              <span>info@elkon.com</span>
            </div>
          </div>

          <div className="h-[1px] w-full bg-stone-100" />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Jam Operasional</h3>
            <p className="text-xs text-stone-600 font-light">Senin - Sabtu &bull; 10:00 - 20:00 WIB</p>
            <p className="text-xs text-stone-600 font-light">Minggu &bull; Dengan Perjanjian</p>
          </div>
        </div>

        {/* Right Side: Contact Form */}
        <div className="lg:col-span-7 bg-white border border-stone-100 p-8 shadow-xs">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Nama Lengkap</label>
              <input
                type="text"
                required
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. Budi Santoso"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Alamat Email</label>
              <input
                type="email"
                required
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400"
                placeholder="cth. budi@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Pesan Anda</label>
              <textarea
                required
                rows="5"
                className="w-full bg-stone-50/50 border border-stone-200 px-3 py-3 text-sm text-stone-950 focus:border-stone-900 focus:outline-none transition-all placeholder-stone-400 resize-none"
                placeholder="Tuliskan pertanyaan atau tanggapan Anda di sini..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-stone-900 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-850 active:bg-black disabled:opacity-50 transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{loading ? "Mengirim..." : "Kirim Pesan"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
