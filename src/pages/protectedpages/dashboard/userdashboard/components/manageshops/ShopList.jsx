import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { fetchConnectedShops } from "../../../../../../api/ConnectedShops";
import reactPhoto from "../../../../../../assets/react.svg";
import {
  FiSearch, FiX, FiMapPin, FiShoppingBag,
  FiShoppingCart, FiClipboard, FiExternalLink,
} from "react-icons/fi";
import { RiAppStoreLine } from "react-icons/ri";


/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PAGE_SIZE = 12;

const G = {
  50:  "#f0fdf4",
  100: "#dcfce7",
  500: "#22c55e",
  600: "#16a34a",
  700: "#15803d",
  800: "#166534",
  900: "#14532d",
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
// Generate a deterministic muted color from shop name for the avatar
const shopColor = (name = "") => {
  const palette = [
    ["#d1fae5", G[700]],
    ["#dbeafe", "#1d4ed8"],
    ["#fce7f3", "#9d174d"],
    ["#fef3c7", "#92400e"],
    ["#e0e7ff", "#3730a3"],
    ["#f3e8ff", "#6b21a8"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const shopInitials = (name = "") =>
  name?.split(" ")?.slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.2, delay: i * 0.04, ease: "easeOut" } }),
};

function ShopCard({ shop, index, onViewMap, onProducts, onOrders, onCart }) {
  const name = shop.business_name || shop.name || "Unnamed Shop";
  const owner = shop.owner_name || shop.ownerName || "—";
  const [bg, fg] = shopColor(name);

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, boxShadow: "0 10px 28px rgba(22,163,74,0.10)" }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm transition-shadow"
    >
      {/* avatar / header */}
      <div
        className="h-24 flex items-center justify-center relative"
        style={{ background: bg }}
      >
        <span
          className="text-3xl font-bold tracking-tight select-none"
          style={{ color: fg }}
        >
          {shopInitials(name)}
        </span>
        {/* map button */}
        {shop.lat && shop.lng && (
          <button
            onClick={() => onViewMap(shop)}
            title="View on map"
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition"
          >
            <FiMapPin className="w-3.5 h-3.5" style={{ color: G[600] }} />
          </button>
        )}
      </div>

      {/* info */}
      <div className="px-4 pt-3 pb-4 flex-1 flex flex-col">
        <p className="font-semibold text-gray-900 truncate text-sm">{name}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{owner}</p>
        {shop.description && (
          <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">{shop.description}</p>
        )}

        {/* actions */}
        <div className="mt-auto pt-4 grid grid-cols-2 gap-2">
          <button
            onClick={onProducts}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: G[600] }}
          >
            <FiShoppingBag className="w-3.5 h-3.5" />
            Products
          </button>
          <button
            onClick={onOrders}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all"
          >
            <FiClipboard className="w-3.5 h-3.5" />
            Orders
          </button>
          <button
            onClick={onCart}
            className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-all"
          >
            <FiShoppingCart className="w-3.5 h-3.5" />
            View Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MapModal({ shop, onClose }) {
  const name  = shop.business_name || shop.name;
  const owner = shop.owner_name || shop.ownerName;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* header */}
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `2px solid ${G[100]}` }}>
            <div>
              <p className="font-bold text-gray-900">{name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{owner}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps?q=${shop.lat},${shop.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition hover:brightness-110"
                style={{ background: G[600] }}
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                Open Maps
              </a>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >
                <FiX className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* map */}
          <div className="h-80">
            <iframe
              title="shop-map"
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://www.google.com/maps?q=${shop.lat},${shop.lng}&z=15&output=embed`}
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const ShopList = () => {
  const navigate = useNavigate();
  const [q, setQ]           = useState("");
  const [page, setPage]     = useState(1);
  const [mapShop, setMapShop] = useState(null);

  const { data: shops = [], isLoading, error } = useQuery({
    queryKey: ["connectedShops"],
    queryFn: fetchConnectedShops,
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return shops;
    return shops.filter(s => {
      const name  = (s.business_name || s.name  || "").toLowerCase();
      const owner = (s.owner_name    || s.ownerName || "").toLowerCase();
      return name.includes(term) || owner.includes(term);
    });
  }, [q, shops]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems  = filtered?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const nav = useCallback((path) => navigate(path), [navigate]);

  /* ── loading ── */
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-green-100 border-t-green-600 animate-spin" />
      <p className="text-sm text-gray-400">Loading shops…</p>
    </div>
  );

  /* ── error ── */
  if (error) return (
    <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
      <p className="text-red-600 font-semibold">Failed to load shops</p>
      <p className="text-sm text-red-400 mt-1">{error.message}</p>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #f0fdf4 0%, #f9fafb 60%)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: G[600] }}>
                <RiAppStoreLine className="w-4 h-4 text-white" />
              </span>
              <span className="text-xs font-bold tracking-widest uppercase text-green-700">Network</span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tight text-gray-900"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Connected Shops
            </h1>
            <p className="mt-1 text-sm text-gray-400">{filtered.length} shop{filtered.length !== 1 ? "s" : ""} available</p>
          </div>

          {/* search */}
          <div className="relative w-full sm:w-72">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name or owner…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-300 shadow-sm placeholder:text-gray-400"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── Empty state ── */}
        {pageItems.length === 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: G[50] }}>
              <FiStore className="w-6 h-6" style={{ color: G[500] }} />
            </div>
            <p className="font-semibold text-gray-700">No shops found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
            {q && (
              <button
                onClick={() => setQ("")}
                className="mt-4 text-sm font-semibold underline underline-offset-2"
                style={{ color: G[600] }}
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pageItems.map((shop, i) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              index={i}
              onViewMap={setMapShop}
              onProducts={() => nav(`/dashboard/customer/shops/${shop.id}/products`)}
              onOrders={()   => nav(`/dashboard/customer/shops/${shop.id}/orders`)}
              onCart={()     => nav(`/dashboard/customer/shops/${shop.id}/carts`)}
            />
          ))}
        </div>

        {/* ── Pagination ── */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-green-300 hover:text-green-700 transition-all"
            >
              ← Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                  style={n === page ? { background: G[600], color: "white" } : { color: "#6b7280" }}
                >
                  {n}
                </button>
              ))}
              {totalPages > 7 && <span className="text-gray-400 px-1">…</span>}
            </div>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 disabled:opacity-30 hover:border-green-300 hover:text-green-700 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Map Modal ── */}
      {mapShop && <MapModal shop={mapShop} onClose={() => setMapShop(null)} />}
    </div>
  );
};

export default ShopList;