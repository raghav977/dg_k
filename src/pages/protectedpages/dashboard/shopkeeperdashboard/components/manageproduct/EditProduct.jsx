import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../../../api/axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const Spinner = ({ size = 16, color = "#fff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: "ep-spin 0.8s linear infinite", flexShrink: 0 }}>
    <style>{`@keyframes ep-spin{to{transform:rotate(360deg)}}`}</style>
    <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity=".25" strokeWidth="3" />
    <path d="M12 2a10 10 0 0110 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Field = ({ label, error, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
    {children}
    {error && <p className="text-xs text-rose-500">{error}</p>}
  </div>
);

const inputCls = `w-full border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800
  placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30
  focus:border-green-400 transition py-2.5 px-3`;

const EditProduct = ({ product, onClose, onUpdated, onLoading }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "", description: "", category: "",
    cost_price: "", selling_price: "", stock: "", image: null,
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [preview, setPreview] = useState(null);
  const [keepExistingImage, setKeepExistingImage] = useState(true);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        cost_price: product.cost_price || "",
        selling_price: product.selling_price || "",
        stock: product.stock || "",
        image: null,
      });
      setPreview(product.image || null);
      setKeepExistingImage(true);
    }
  }, [product]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get(`${BACKEND_URL}/products/categories/`);
        setCategories(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) { console.error("Error fetching categories:", err); }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
    setKeepExistingImage(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
    setKeepExistingImage(false);
  };

  const removeImage = () => {
    setForm((f) => ({ ...f, image: null }));
    setPreview(null);
    setKeepExistingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const margin = form.selling_price && form.cost_price
    ? (((parseFloat(form.selling_price) - parseFloat(form.cost_price)) / parseFloat(form.cost_price)) * 100).toFixed(1)
    : null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required";
    if (!form.category) e.category = "Please select a category";
    if (!form.cost_price) e.cost_price = "Cost price is required";
    if (!form.selling_price) e.selling_price = "Selling price is required";
    if (!form.stock) e.stock = "Stock quantity is required";
    return e;
  };

  const updateProductMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("cost_price", form.cost_price);
      formData.append("selling_price", form.selling_price);
      formData.append("stock", form.stock);
      if (form.image && !keepExistingImage) formData.append("image", form.image);
      const res = await api.patch(`${BACKEND_URL}/products/products/${product.id}/`, formData);
      if (!res || (res.status && res.status >= 400)) throw new Error("Failed to update product");
      return res.data;
    },
    onMutate: () => { if (typeof onLoading === "function") onLoading(true); },
    onSettled: () => { if (typeof onLoading === "function") onLoading(false); },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["products"]);
      if (typeof onUpdated === "function") onUpdated(data);
      if (typeof onClose === "function") onClose();
    },
    onError: (err) => {
      console.error("Update product error", err);
      setApiError(err?.response?.data?.detail || "Failed to update product. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    updateProductMutation.mutate();
  };

  const isPending = updateProductMutation.isPending || updateProductMutation.isLoading;
  const isNewImage = !keepExistingImage && preview;
  const hasImage = !!preview;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* Image area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !hasImage && fileInputRef.current?.click()}
        className={`relative w-full rounded-2xl border-2 overflow-hidden transition
          ${hasImage ? "border-transparent cursor-default" : "border-dashed border-slate-200 hover:border-green-300 cursor-pointer bg-slate-50 hover:bg-green-50/40"}`}
        style={{ minHeight: "130px" }}
      >
        {hasImage ? (
          <>
            <img src={preview} alt="product" className="w-full h-40 object-cover" />
            <div className="absolute top-2 left-2 flex gap-1.5">
              {keepExistingImage && (
                <span className="text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">Current image</span>
              )}
              {isNewImage && (
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">New image</span>
              )}
            </div>
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition" title="Replace image">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                </svg>
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(); }}
                className="w-7 h-7 rounded-full bg-black/50 hover:bg-rose-500 text-white flex items-center justify-center transition" title="Remove image">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-500">Drop image or click to upload</p>
            <p className="text-xs">PNG, JPG, WEBP up to 10MB</p>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
      </div>

      <Field label="Product Name" error={errors.name}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Wireless Headphones" className={inputCls} />
      </Field>

      <Field label="Description">
        <textarea name="description" value={form.description} onChange={handleChange} rows={2} placeholder="Short product description…" className={`${inputCls} resize-none`} />
      </Field>

      <Field label="Category" error={errors.category}>
        <select name="category" value={form.category} onChange={handleChange} className={`${inputCls} appearance-none cursor-pointer`}>
          <option value="">Select a category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost Price (Rs)" error={errors.cost_price}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs</span>
            <input type="number" step="0.01" min="0" name="cost_price" value={form.cost_price} onChange={handleChange} placeholder="0.00" className={`${inputCls} pl-9`} />
          </div>
        </Field>
        <Field label="Selling Price (Rs)" error={errors.selling_price}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rs</span>
            <input type="number" step="0.01" min="0" name="selling_price" value={form.selling_price} onChange={handleChange} placeholder="0.00" className={`${inputCls} pl-9`} />
          </div>
        </Field>
      </div>

      {/* Margin pill */}
      {margin !== null && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium
          ${parseFloat(margin) >= 0 ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-600"}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={parseFloat(margin) >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
          </svg>
          Margin: {parseFloat(margin) >= 0 ? "+" : ""}{margin}%
          {parseFloat(margin) < 0 && " · Selling below cost"}
        </div>
      )}

      <Field label="Stock Quantity" error={errors.stock}>
        <input type="number" min="0" name="stock" value={form.stock} onChange={handleChange} placeholder="0" className={inputCls} />
      </Field>

      {apiError && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {apiError}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="submit" disabled={isPending}
          className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", boxShadow: "0 4px 12px rgba(22,163,74,0.3)" }}>
          {isPending ? <><Spinner /> Saving…</> : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default EditProduct;