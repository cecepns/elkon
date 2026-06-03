import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { getImageUrl } from "../utils/api";
import { ArrowRight } from "lucide-react";
import HeroImage from '../assets/product_silk_dress.png';

// Import Swiper React components & modules
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await request.get("/banners");
        if (res.success) {
          setBanners(res.data);
        }
      } catch (error) {
        console.error("Gagal memuat banner:", error);
      } finally {
        setLoadingBanners(false);
      }
    }

    async function fetchFeatured() {
      try {
        const res = await request.get(API_ENDPOINTS.PRODUCTS.LIST, { limit: 3 });
        if (res.success) {
          setFeaturedProducts(res.data);
        }
      } catch (error) {
        console.error("Gagal memuat produk unggulan:", error);
      } finally {
        setLoadingProducts(false);
      }
    }

    fetchBanners();
    fetchFeatured();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-24 pb-24">
      {/* Hero Banner Section using Swiper Slider with Prev/Next Navigation */}
      <section className="relative h-[85vh] w-full bg-stone-900">
        {loadingBanners ? (
          <div className="flex h-full w-full items-center justify-center bg-stone-900">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-stone-700 border-t-stone-200" />
          </div>
        ) : banners.length === 0 ? (
          /* Fallback static banner */
          <div className="relative h-full w-full overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="/assets/campaign-hero.png"
                alt="elkon premium fashion campaign"
                className="h-full w-full object-cover object-center opacity-85 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/35" />
            </div>
            <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 sm:px-6 lg:px-8">
              <div className="max-w-2xl text-white space-y-6">
                <span className="text-xs font-semibold tracking-[0.3em] uppercase text-stone-200">
                  Kampanye Musim Panas/Gugur 2026
                </span>
                <h1 className="font-serif text-5xl md:text-7xl font-extralight tracking-tight leading-none text-white">
                  Resonansi dari <br />
                  <span className="italic font-normal">Keheningan & Ruang</span>
                </h1>
                <p className="max-w-md text-sm md:text-base font-light text-stone-300 leading-relaxed">
                  Studi editorial potongan minimalis dengan pencahayaan alami.
                </p>
                <div className="pt-4">
                  <Link
                    to="/shop"
                    className="inline-flex items-center space-x-3 bg-white px-8 py-4 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:bg-stone-100 transition-all"
                  >
                    <span>Lihat Koleksi</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            effect={'fade'}
            speed={1000}
            autoplay={{
              delay: 5000,
              disableOnInteraction: false,
            }}
            loop={true}
            navigation={true}
            pagination={{
              clickable: true,
              bulletClass: 'swiper-pagination-bullet !bg-white !opacity-40',
              bulletActiveClass: 'swiper-pagination-bullet-active !opacity-100',
            }}
            className="h-full w-full relative group"
          >
            {/* Custom stylesheet override to style default swiper buttons gracefully for premium brand look */}
            <style>{`
              .swiper-button-next, .swiper-button-prev {
                color: #FFFFFF !important;
                width: 36px !important;
                height: 36px !important;
                border: 1px solid rgba(255,255,255,0.2) !important;
                background: rgba(28,27,26,0.4) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                border-radius: 9999px !important;
                opacity: 0.8 !important;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                z-index: 40 !important;
                cursor: pointer !important;
                pointer-events: auto !important;
              }
              /* Hide Swiper default ::after font icon */
              .swiper-button-next::after, .swiper-button-prev::after {
                display: none !important;
                content: "" !important;
              }
              /* Style the SVG icon to be sleek and smaller than the circular bullet background */
              .swiper-button-next svg, .swiper-button-prev svg, .swiper-navigation-icon {
                width: 8px !important;
                height: 14px !important;
                display: block !important;
                flex-shrink: 0 !important;
              }
              .swiper-button-next {
                right: 12px !important;
                left: auto !important;
              }
              .swiper-button-prev {
                left: 12px !important;
                right: auto !important;
              }
              .swiper-button-next:hover, .swiper-button-prev:hover {
                border-color: #FFFFFF !important;
                background: rgba(28,27,26,0.7) !important;
                opacity: 1 !important;
              }
              @media (min-width: 768px) {
                .swiper-button-next, .swiper-button-prev {
                  width: 48px !important;
                  height: 48px !important;
                  opacity: 0 !important;
                }
                .swiper-button-next svg, .swiper-button-prev svg, .swiper-navigation-icon {
                  width: 10px !important;
                  height: 18px !important;
                }
                .swiper-button-next {
                  right: 24px !important;
                }
                .swiper-button-prev {
                  left: 24px !important;
                }
                .group:hover .swiper-button-next, .group:hover .swiper-button-prev {
                  opacity: 1 !important;
                }
              }
            `}</style>
            {banners.map((banner) => {
              const bgImg = getImageUrl(banner.image);

              return (
                <SwiperSlide key={banner.id} className="relative h-full w-full overflow-hidden">
                  <div className="absolute inset-0">
                    <img
                      src={bgImg}
                      alt={banner.title}
                      className="h-full w-full object-cover object-center opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/35" />
                  </div>
                  <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-20 sm:px-6 lg:px-8">
                    <div className="max-w-2xl text-white space-y-6">
                      <span className="text-xs font-semibold tracking-[0.3em] uppercase text-stone-200">
                        Koleksi Kampanye elkon
                      </span>
                      <h2 className="font-serif text-4xl md:text-6xl font-extralight tracking-tight leading-none text-white">
                        {banner.title.includes("<br") ? (
                          <span dangerouslySetInnerHTML={{ __html: banner.title }} />
                        ) : (
                          banner.title
                        )}
                      </h2>
                      {banner.subtitle && (
                        <p className="max-w-md text-sm md:text-base font-light text-stone-300 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                      <div className="pt-4">
                        <Link
                          to={banner.link_url || "/shop"}
                          className="inline-flex items-center space-x-3 bg-white px-8 py-4 text-xs font-semibold uppercase tracking-widest text-stone-900 hover:bg-stone-100 transition-all duration-350 shadow-lg"
                        >
                          <span>Temukan Detail</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </section>

      {/* Brand Introduction Section */}
      <section className="mx-auto max-w-4xl px-4 text-center space-y-8">
        <span className="text-xs font-semibold tracking-[0.4em] uppercase text-stone-400">
          Filosofi Kami
        </span>
        <h2 className="font-serif text-3xl md:text-5xl font-light tracking-wide text-stone-900 leading-snug">
          "Kami tidak merancang pakaian untuk membuat pernyataan, tetapi untuk mendefinisikan arsitektur bagi pemakainya."
        </h2>
        <div className="h-[1px] w-20 bg-stone-200 mx-auto" />
        <p className="mx-auto max-w-2xl text-sm md:text-base font-light text-stone-500 leading-loose">
          Desain elkon berakar pada dialog antara alam dan arsitektur. Menggunakan bahan linen pilihan, sutra organik, dan wol halus, setiap helai pakaian dipotong untuk menonjolkan bentuk, bayangan, dan kehadiran taktil. Dirancang untuk daya tahan lama dan kenyamanan yang anggun.
        </p>
      </section>

      {/* Editorial Collection Showcase (Modified to show 2 columns on mobile: grid-cols-2) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold tracking-[0.3em] uppercase text-stone-400">Pilihan Editor</span>
            <h3 className="font-serif text-2xl md:text-3xl text-stone-900 font-light">Koleksi yang Tersedia</h3>
          </div>
          <Link to="/shop" className="group mt-4 md:mt-0 flex items-center space-x-2 text-xs font-medium uppercase tracking-widest text-stone-600 hover:text-stone-900 transition-colors">
            <span>Jelajahi Semua Produk</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-12">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="bg-stone-100 aspect-[3/4]" />
                <div className="h-4 bg-stone-100 w-2/3" />
                <div className="h-3 bg-stone-100 w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-12">
            {featuredProducts.map((product, idx) => {
              const isEven = idx % 2 === 0;
              const imageUrl = getImageUrl(product.image);

              return (
                <div
                  key={product.id}
                  className={`group space-y-4 md:space-y-6 transition-all duration-500 fade-in ${isEven ? "md:translate-y-0" : "md:translate-y-8"
                    }`}
                >
                  <Link to={`/product/${product.id}`} className="block overflow-hidden bg-stone-50 border border-stone-100">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      {(product.is_preorder === 1 || product.is_preorder === true) && (
                        <div className="absolute top-3 left-3 z-10 bg-stone-900 text-white text-[8px] sm:text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1.5 shadow-sm">
                          Pre-Order: {product.preorder_days || 30} Hari
                        </div>
                      )}
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover object-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-stone-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>

                  <div className="space-y-1.5 md:space-y-2">
                    <span className="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-stone-400">
                      {product.category || "Tanpa Kategori"}
                    </span>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-baseline">
                      <h4 className="font-serif text-sm md:text-lg font-light text-stone-900 hover:text-stone-600 transition-colors line-clamp-1">
                        <Link to={`/product/${product.id}`}>{product.name}</Link>
                      </h4>
                      <p className="text-[11px] md:text-xs font-semibold text-stone-900 whitespace-nowrap">{formatPrice(product.base_price)}</p>
                    </div>
                    <p className="hidden sm:block text-xs text-stone-500 font-light line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Full-width campaign visual block */}
      <section className="relative h-[60vh] w-full overflow-hidden bg-stone-900 flex items-center">
        <div className="absolute inset-0">
          <img
            src={HeroImage}
            alt="elkon silhouette look"
            className="h-full w-full object-cover object-center opacity-40"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white space-y-6 text-center md:text-left">
          <span className="text-xs font-semibold tracking-[0.4em] uppercase text-stone-300">Estetika Modern</span>
          <h2 className="font-serif text-4xl md:text-6xl font-extralight tracking-wide leading-tight">
            Estetika Abadi <br /><span className="italic font-normal">Dalam Kesederhanaan</span>
          </h2>
          <p className="max-w-md text-xs md:text-sm font-light text-stone-300 leading-relaxed mx-auto md:mx-0">
            Temukan harmoni antara kenyamanan harian dan potongan struktural yang elegan. Setiap pakaian dikurasi secara teliti untuk mengekspresikan karakter Anda melalui siluet yang minimalis namun tetap anggun.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 border-b border-white pb-1 text-xs uppercase tracking-widest hover:text-stone-300 hover:border-stone-300 transition-all"
            >
              <span>Jelajahi Koleksi Pakaian</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
