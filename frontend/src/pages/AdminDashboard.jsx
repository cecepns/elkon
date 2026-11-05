import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";

// Split Subpages
import AdminStats from "./admin/AdminStats";
import AdminProducts from "./admin/AdminProducts";
import AdminCategories from "./admin/AdminCategories";
import AdminBanners from "./admin/AdminBanners";
import AdminOrders from "./admin/AdminOrders";
import AdminSalesReport from "./admin/AdminSalesReport";
import AdminContacts from "./admin/AdminContacts";
import AdminSettings from "./admin/AdminSettings";
import AdminPaymentGateway from "./admin/AdminPaymentGateway";
import AdminLogs from "./admin/AdminLogs";

import {
  Package,
  Tags,
  Image as ImageIcon,
  ShoppingBag,
  TrendingUp,
  Mail,
  Settings,
  CreditCard,
  Terminal,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const TAB_CONFIG = [
  { id: "products", label: "Produk", icon: Package, getBadge: (s) => s.totalProducts },
  { id: "categories", label: "Kategori", icon: Tags, getBadge: (s) => s.totalCategories },
  { id: "banners", label: "Banner Swiper", icon: ImageIcon, getBadge: (s) => s.totalBanners },
  {
    id: "orders",
    label: "Pesanan",
    icon: ShoppingBag,
    getBadge: (s) => s.totalOrders,
    alertBadge: (s) => s.pendingOrders,
    alertBadgeColor: "bg-amber-500",
  },
  {
    id: "sales",
    label: "Laporan Penjualan",
    icon: TrendingUp,
    aliases: ["sales-report", "laporan", "laporan-penjualan", "report"],
  },
  {
    id: "contacts",
    label: "Pesan Kontak",
    icon: Mail,
    alertBadge: (s) => s.unreadContacts,
    alertBadgeColor: "bg-red-650",
  },
  { id: "settings", label: "Pengaturan", icon: Settings },
  { id: "payment", label: "Payment Gateway", icon: CreditCard, aliases: ["gateway", "pembayaran"] },
  { id: "logs", label: "Log", icon: Terminal, aliases: ["log"] },
];

export default function AdminDashboard() {
  const { tab: routeTab } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mobile menu / sidebar drawer state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats dashboard state
  const [stats, setStats] = useState({
    totalProducts: 0,
    outOfStockCount: 0,
    totalStockCount: 0,
    totalCategories: 0,
    unreadContacts: 0,
    totalContacts: 0,
    totalBanners: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  // Resolve active tab from URL route param (:tab) or query string (?tab=...)
  const resolvedTab = useMemo(() => {
    const target = (routeTab || searchParams.get("tab") || "").toLowerCase().trim();
    if (!target) return "products";
    const matched = TAB_CONFIG.find(
      (t) => t.id === target || (t.aliases && t.aliases.includes(target))
    );
    return matched ? matched.id : "products";
  }, [routeTab, searchParams]);

  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  // Tab switch handler: sync URL so refresh / back / forward / share link works seamlessly
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
    const targetPath = tabId === "sales" ? "sales-report" : tabId;
    navigate(`/admin/${targetPath}`, { replace: false });
  };

  // Fetch Dynamic Global Stats
  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ADMIN.STATS);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error("Gagal mengambil statistik:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const currentTabObj = TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];
  const CurrentIcon = currentTabObj.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Title & Mobile Menu Trigger */}
      <div className="flex items-center justify-between border-b border-stone-150 pb-6 gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-stone-900 tracking-wide">
            PANEL ADMIN ELKON
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kelola produk, varian, pesanan, rekap penjualan, banner, dan konfigurasi toko.
          </p>
        </div>

        {/* Mobile menu hamburger button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden inline-flex items-center space-x-2 border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-stone-800 shadow-xs hover:border-stone-900 cursor-pointer transition-all"
          aria-label="Buka Menu Admin"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
          {(stats.pendingOrders > 0 || stats.unreadContacts > 0) && (
            <span className="h-2 w-2 rounded-full bg-red-650 animate-pulse" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Off-canvas Drawer with smooth transition */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-visibility duration-300 ${
          isMobileMenuOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className={`fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Slide-out Sidebar Panel */}
        <div
          className={`fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-in-out transform ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Navigasi Admin
              </span>
              <h2 className="font-serif text-lg font-medium text-stone-900">Menu Elkon</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition-colors rounded-sm cursor-pointer"
              aria-label="Tutup Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {TAB_CONFIG.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              const badgeNum = t.getBadge ? t.getBadge(stats) : null;
              const alertNum = t.alertBadge ? t.alertBadge(stats) : null;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    isActive
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-stone-400"}`} />
                    <span className="truncate">{t.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    {alertNum > 0 && (
                      <span
                        className={`flex h-4 min-w-4 px-1 items-center justify-center rounded-full ${
                          t.alertBadgeColor || "bg-red-650"
                        } text-[9px] font-bold text-white`}
                      >
                        {alertNum}
                      </span>
                    )}
                    {badgeNum !== null && badgeNum !== undefined && !alertNum && (
                      <span
                        className={`text-[10px] font-mono ${
                          isActive ? "text-stone-300" : "text-stone-400"
                        }`}
                      >
                        ({badgeNum})
                      </span>
                    )}
                    <ChevronRight
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-stone-300" : "text-stone-300"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-stone-150 bg-stone-50 text-[10px] text-stone-400 text-center">
            Elkon Store Admin Panel v2.0
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Tabs Navigation (Horizontal bar with badges) */}
      <div className="flex border-b border-stone-200 overflow-x-auto scrollbar-thin">
        {TAB_CONFIG.map((t) => {
          const isActive = activeTab === t.id;
          const badgeNum = t.getBadge ? t.getBadge(stats) : null;
          const alertNum = t.alertBadge ? t.alertBadge(stats) : null;
          const Icon = t.icon;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTabChange(t.id)}
              className={`relative flex items-center space-x-2 px-5 py-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "border-stone-900 text-stone-900 bg-stone-50/50"
                  : "border-transparent text-stone-400 hover:text-stone-700 hover:border-stone-300"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-stone-900" : "text-stone-400"}`} />
              <span>{t.label}</span>
              {badgeNum !== null && badgeNum !== undefined && (
                <span className="font-mono text-[11px] text-stone-400">({badgeNum})</span>
              )}
              {alertNum > 0 && (
                <span
                  className={`ml-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full ${
                    t.alertBadgeColor || "bg-red-650"
                  } text-[9px] font-bold text-white`}
                >
                  {alertNum}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Statistics Cards */}
      <AdminStats stats={stats} />

      {/* Current Tab Indicator for mobile convenience */}
      <div className="lg:hidden flex items-center justify-between bg-stone-100 border border-stone-200 px-4 py-2.5 text-xs">
        <div className="flex items-center space-x-2 font-semibold text-stone-900 uppercase tracking-wider">
          <CurrentIcon className="h-4 w-4 text-stone-600" />
          <span>Tab Aktif: {currentTabObj.label}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-[11px] text-stone-600 hover:text-stone-900 underline uppercase tracking-wider cursor-pointer"
        >
          Ganti Tab
        </button>
      </div>

      {/* --- CONTENT TABS SWITCHING --- */}
      <div className="bg-white p-4 sm:p-6 border border-stone-150 shadow-xs">
        {activeTab === "products" && (
          <AdminProducts onActionSuccess={fetchStats} />
        )}
        {activeTab === "categories" && (
          <AdminCategories onActionSuccess={fetchStats} />
        )}
        {activeTab === "banners" && (
          <AdminBanners onActionSuccess={fetchStats} />
        )}
        {activeTab === "orders" && (
          <AdminOrders onActionSuccess={fetchStats} />
        )}
        {activeTab === "sales" && (
          <AdminSalesReport />
        )}
        {activeTab === "contacts" && (
          <AdminContacts onActionSuccess={fetchStats} />
        )}
        {activeTab === "settings" && (
          <AdminSettings onActionSuccess={fetchStats} />
        )}
        {activeTab === "payment" && (
          <AdminPaymentGateway />
        )}
        {activeTab === "logs" && (
          <AdminLogs />
        )}
      </div>
    </div>
  );
}
