import React, { useState } from 'react'

const statusFromStock = (stock) => {
  if (stock === 0) return { label: 'Out of stock', dot: 'bg-rose-400', cls: 'bg-rose-50 text-rose-600' }
  if (stock < 10) return { label: 'Low stock', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-600' }
  return { label: 'In stock', dot: 'bg-green-400', cls: 'bg-green-50 text-green-600' }
}

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

export default function ProductCard({ p, onView = () => {}, onEdit = () => {} }) {
  const status = statusFromStock(p.stock)
  const [imgError, setImgError] = useState(false)

  const margin = p.cost_price && p.selling_price
    ? (((parseFloat(p.selling_price) - parseFloat(p.cost_price)) / parseFloat(p.cost_price)) * 100).toFixed(1)
    : null

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 overflow-hidden
      flex flex-col transition-all duration-200 hover:shadow-lg hover:shadow-slate-200/80 hover:-translate-y-0.5">

      {/* Image */}
      <div className="relative w-full h-44 bg-slate-100 overflow-hidden flex-shrink-0">
        {p.image && !imgError ? (
          <img
            src={p.image} alt={p.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">No image</span>
          </div>
        )}

        {/* Status badge */}
        <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full
          text-xs font-semibold ${status.cls}`}
          style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)' }}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </div>

        {/* Margin badge */}
        {margin !== null && (
          <div className={`absolute top-2.5 right-2.5 px-2 py-1 rounded-full text-xs font-semibold
            ${parseFloat(margin) >= 0 ? 'text-green-700' : 'text-rose-600'}`}
            style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)' }}>
            {parseFloat(margin) >= 0 ? '+' : ''}{margin}%
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Name + category */}
        <div>
          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
            {p.name}
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
            {p.category_name || 'Uncategorized'}
          </span>
        </div>

        {/* Description */}
        {p.description && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
        )}

        {/* Prices */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Cost</p>
            <p className="text-sm font-semibold text-slate-600 font-mono">
              Rs {Number(p.cost_price).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Selling</p>
            <p className="text-base font-bold text-green-600 font-mono">
              Rs {Number(p.selling_price).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Stock bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Stock</span>
            <span className={`text-xs font-semibold tabular-nums
              ${p.stock === 0 ? 'text-rose-500' : p.stock < 10 ? 'text-amber-600' : 'text-slate-700'}`}>
              {p.stock} units
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all
                ${p.stock === 0 ? 'bg-rose-300' : p.stock < 10 ? 'bg-amber-400' : 'bg-green-400'}`}
              style={{ width: `${Math.min(Math.max((p.stock / 100) * 100, p.stock > 0 ? 4 : 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 mt-auto border-t border-slate-100">
          <span className="text-xs text-slate-300 font-mono">#{p.id}</span>
          <div className="flex gap-1.5">
            <button onClick={() => onView(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200
                text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
              <EyeIcon /> View
            </button>
            <button onClick={() => onEdit(p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
              <PencilIcon /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}