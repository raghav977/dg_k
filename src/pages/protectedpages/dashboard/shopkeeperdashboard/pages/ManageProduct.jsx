import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AddProduct from "../components/manageproduct/AddProduct.jsx";
import EditProduct from "../components/manageproduct/EditProduct.jsx";
import ViewProduct from "../components/manageproduct/ViewProduct.jsx";
import ProductCard from "../components/manageproduct/ProductCard.jsx";
import api from "../../../../../api/axios.js";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const Modal = ({ onClose, children, maxW = "max-w-md" }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(15,20,15,0.45)", backdropFilter: "blur(6px)" }}
    onClick={onClose}
  >
    <div
      className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
      style={{ boxShadow: "0 32px 64px -12px rgba(0,0,0,0.22)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const Spinner = ({ size = 20, color = "#16a34a" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity=".2" strokeWidth="3" />
    <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const inputCls = `w-full border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 placeholder-slate-400
  focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition py-2.5 px-3`;

const InputField = ({ icon, ...props }) => (
  <div className="relative">
    {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
    <input {...props} className={`${inputCls} ${icon ? "pl-9" : ""}`} />
  </div>
);

const SelectField = ({ children, style, ...props }) => (
  <select
    {...props}
    style={style}
    className="w-full border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-700
      focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition
      py-2.5 px-3 appearance-none cursor-pointer"
  >
    {children}
  </select>
);

const Icon = {
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" /></svg>,
  Tag: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 11.5V7a4 4 0 014-4z" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2} /><path d="m21 21-4.35-4.35" strokeLinecap="round" strokeWidth={2} /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 10h10M10 16h4" /></svg>,
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
};

const ManageProduct = () => {
  const queryClient = useQueryClient();

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showViewProductModal, setShowViewProductModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notif, setNotif] = useState({ msg: "", type: "success" });

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minSelling, setMinSelling] = useState("");
  const [maxSelling, setMaxSelling] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [inStock, setInStock] = useState(false);
  const [ordering, setOrdering] = useState("id");
  const [searchTick, setSearchTick] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(12);
  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchTick((x) => x + 1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const q = new URLSearchParams();
    if (search.trim()) q.append("search", search.trim());
    if (category) q.append("category", category);
    if (minSelling) q.append("min_selling_price", minSelling);
    if (maxSelling) q.append("max_selling_price", maxSelling);
    if (minStock) q.append("min_stock", minStock);
    if (maxStock) q.append("max_stock", maxStock);
    if (inStock) q.append("in_stock", "true");
    if (ordering) q.append("ordering", ordering);
    q.append("page", String(page));
    q.append("page_size", String(pageSizeState));
    return q.toString();
  }, [searchTick, category, minSelling, maxSelling, minStock, maxStock, inStock, ordering, page, pageSizeState]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["products", params, page, pageSizeState],
    queryFn: async () => {
      const url = `${BACKEND_URL}/products/products/${params ? `?${params}` : ""}`;
      const res = await api.get(url);
      if (res?.data && Array.isArray(res.data.results)) return res.data;
      const arr = Array.isArray(res.data) ? res.data : res.data.results || [];
      return { results: arr, count: arr.length };
    },
    keepPreviousData: true,
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get(`${BACKEND_URL}/products/categories/`);
      setCategories(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) { console.error("Error fetching categories:", err); }
  };
  useEffect(() => { fetchCategories(); }, []);

  const toast = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif({ msg: "", type: "success" }), 3500);
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => (await api.delete(`${BACKEND_URL}/products/products/${productId}/`)).data,
    onSuccess: () => { queryClient.invalidateQueries(["products"]); toast("Product deleted"); setShowDeleteConfirm(false); setSelectedProduct(null); },
    onError: () => toast("Failed to delete product", "error"),
  });

  const handleViewProduct = (p) => { setSelectedProduct(p); setShowViewProductModal(true); };
  const handleEditProduct = (p) => { setSelectedProduct(p); setShowViewProductModal(false); setShowEditProductModal(true); };
  const handleDeleteProduct = (p) => { setSelectedProduct(p); setShowViewProductModal(false); setShowDeleteConfirm(true); };
  const confirmDelete = () => { if (selectedProduct) deleteProductMutation.mutate(selectedProduct.id); };

  const addCategory = async () => {
    setCategoryError("");
    if (!categoryName.trim()) { setCategoryError("Category name is required"); return; }
    try {
      setAddingCategory(true);
      await api.post(`${BACKEND_URL}/products/categories/`, { name: categoryName.trim() });
      await fetchCategories();
      toast("Category added");
      setShowAddCategoryModal(false);
      setCategoryName("");
    } catch (err) {
      setCategoryError(err?.response?.data?.detail || "Failed to add category");
    } finally { setAddingCategory(false); }
  };

  const lastPage = useMemo(() => Math.max(1, Math.ceil((data?.count || 0) / pageSizeState)), [data?.count, pageSizeState]);
  const clearFilters = () => { setSearch(""); setCategory(""); setMinSelling(""); setMaxSelling(""); setMinStock(""); setMaxStock(""); setInStock(false); setOrdering("id"); };
  const hasActiveFilters = category || minSelling || maxSelling || minStock || maxStock || inStock || ordering !== "id";

  const GreenBtn = ({ children, onClick, disabled, className = "" }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50 ${className}`}
      style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 border-b border-slate-200/80" style={{ backdropFilter: "blur(12px)" }}>
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Products</h1>
            {data?.count != null && <p className="text-xs text-slate-400 mt-0.5 font-mono">{data.count} items total</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200
                text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition"
            >
              <Icon.Tag /> Category
            </button>
            <GreenBtn onClick={() => setShowAddProductModal(true)} className="px-4 py-2">
              <Icon.Plus /> Add Product
            </GreenBtn>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* Search row */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <InputField icon={<Icon.Search />} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" />
          </div>
          <div className="w-44">
            <SelectField value={ordering} onChange={(e) => setOrdering(e.target.value)}>
              <option value="id">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="-name">Name Z–A</option>
              <option value="selling_price">Price ↑</option>
              <option value="-selling_price">Price ↓</option>
              <option value="stock">Stock ↑</option>
              <option value="-stock">Stock ↓</option>
            </SelectField>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition
              ${showFilters ? "bg-green-50 border-green-300 text-green-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            <Icon.Filter /> Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5" />}
          </button>
          {hasActiveFilters && (
            <button onClick={() => { clearFilters(); setPage(1); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition">
              <Icon.X /> Clear
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Advanced Filters</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Category</label>
                <SelectField value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">All</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </SelectField>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Min price (Rs)</label>
                <InputField value={minSelling} onChange={(e) => setMinSelling(e.target.value)} placeholder="0" type="number" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Max price (Rs)</label>
                <InputField value={maxSelling} onChange={(e) => setMaxSelling(e.target.value)} placeholder="∞" type="number" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Min stock</label>
                <InputField value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" type="number" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Max stock</label>
                <InputField value={maxStock} onChange={(e) => setMaxStock(e.target.value)} placeholder="∞" type="number" />
              </div>
              <div className="flex items-end pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div onClick={() => setInStock(!inStock)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${inStock ? "bg-green-500" : "bg-slate-200"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${inStock ? "translate-x-4" : ""}`} />
                  </div>
                  <span className="text-sm text-slate-600">In stock only</span>
                </label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <GreenBtn onClick={() => { setPage(1); refetch(); }} className="px-4 py-2">Apply filters</GreenBtn>
              <button onClick={() => { clearFilters(); setPage(1); }} className="px-4 py-2 rounded-xl text-sm text-slate-600 border border-slate-200 hover:bg-slate-50 transition">Reset</button>
            </div>
          </div>
        )}

        {/* Grid */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Spinner /> <span className="text-sm">Loading products…</span>
          </div>
        )}
        {error && !isLoading && (
          <div className="flex items-center justify-center py-20 text-center">
            <div>
              <p className="text-slate-500 text-sm">Couldn't load products.</p>
              <button onClick={() => refetch()} className="mt-2 text-green-600 text-sm underline">Try again</button>
            </div>
          </div>
        )}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {(data?.results || []).map((p) => (
              <ProductCard key={p.id} p={p} onView={handleViewProduct} onEdit={handleEditProduct} />
            ))}
            {(data?.results || []).length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center gap-3 text-slate-400">
                <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm font-medium">No products found</p>
                <p className="text-xs">Try adjusting your filters or add a product.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && (data?.results || []).length > 0 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <Icon.ChevronLeft />
              </button>
              {Array.from({ length: Math.min(lastPage, 5) }, (_, i) => {
                const pg = lastPage <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= lastPage - 2 ? lastPage - 4 + i : page - 2 + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition
                      ${pg === page ? "text-white shadow" : "border border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    style={pg === page ? { background: "linear-gradient(135deg,#16a34a,#15803d)" } : {}}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page === lastPage || isLoading}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <Icon.ChevronRight />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Show</span>
              <SelectField value={pageSizeState} onChange={(e) => { setPageSizeState(Number(e.target.value)); setPage(1); }} style={{ width: "5rem" }}>
                {[8, 12, 24, 48].map((n) => <option key={n} value={n}>{n}</option>)}
              </SelectField>
              <span>per page</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddProductModal && (
        <Modal onClose={() => setShowAddProductModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">New Product</h2>
              <button onClick={() => setShowAddProductModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><Icon.X /></button>
            </div>
            <AddProduct onClose={() => setShowAddProductModal(false)} onAdded={() => { toast("Product added successfully"); refetch(); }} onLoading={(v) => setAdding(Boolean(v))} />
          </div>
        </Modal>
      )}

      {showViewProductModal && selectedProduct && (
        <Modal maxW="max-w-lg" onClose={() => { setShowViewProductModal(false); setSelectedProduct(null); }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Product Details</h2>
              <button onClick={() => { setShowViewProductModal(false); setSelectedProduct(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><Icon.X /></button>
            </div>
            <ViewProduct product={selectedProduct} onClose={() => { setShowViewProductModal(false); setSelectedProduct(null); }} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />
          </div>
        </Modal>
      )}

      {showEditProductModal && selectedProduct && (
        <Modal onClose={() => { setShowEditProductModal(false); setSelectedProduct(null); }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Product</h2>
              <button onClick={() => { setShowEditProductModal(false); setSelectedProduct(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><Icon.X /></button>
            </div>
            <EditProduct product={selectedProduct} onClose={() => { setShowEditProductModal(false); setSelectedProduct(null); }} onUpdated={() => { toast("Product updated"); refetch(); }} onLoading={(v) => setAdding(Boolean(v))} />
          </div>
        </Modal>
      )}

      {showDeleteConfirm && selectedProduct && (
        <Modal maxW="max-w-sm" onClose={() => setShowDeleteConfirm(false)}>
          <div className="p-6">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center mb-4 text-rose-500"><Icon.Trash /></div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Delete Product</h3>
            <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <strong className="text-slate-700">{selectedProduct.name}</strong>? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowDeleteConfirm(false); setSelectedProduct(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteProductMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2">
                {deleteProductMutation.isPending ? <><Spinner size={16} color="#fff" /> Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddCategoryModal && (
        <Modal maxW="max-w-sm" onClose={() => { setShowAddCategoryModal(false); setCategoryName(""); setCategoryError(""); }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">New Category</h2>
              <button onClick={() => { setShowAddCategoryModal(false); setCategoryName(""); setCategoryError(""); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"><Icon.X /></button>
            </div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Category name</label>
            <InputField value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="e.g. Electronics" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
            {categoryError && <p className="mt-2 text-xs text-rose-500">{categoryError}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowAddCategoryModal(false); setCategoryName(""); setCategoryError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <GreenBtn onClick={addCategory} disabled={addingCategory} className="flex-1 py-2.5">
                {addingCategory ? <><Spinner size={16} color="#fff" /> Adding…</> : "Add Category"}
              </GreenBtn>
            </div>
          </div>
        </Modal>
      )}

      {adding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(15,20,15,0.35)", backdropFilter: "blur(4px)" }}>
          <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-4 shadow-2xl">
            <Spinner size={24} /> <span className="text-sm font-medium text-slate-700">Saving changes…</span>
          </div>
        </div>
      )}

      {notif.msg && (
        <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium"
          style={{
            background: notif.type === "error" ? "linear-gradient(135deg,#f43f5e,#e11d48)" : "linear-gradient(135deg,#16a34a,#15803d)",
            boxShadow: notif.type === "error" ? "0 8px 24px rgba(244,63,94,0.35)" : "0 8px 24px rgba(22,163,74,0.35)",
            animation: "slideUp 0.3s ease"
          }}>
          <style>{`@keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
          {notif.type === "error" ? "✕" : "✓"} {notif.msg}
        </div>
      )}
    </div>
  );
};

export default ManageProduct;