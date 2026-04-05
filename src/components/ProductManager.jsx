import { useEffect, useState } from "react";
import {
  getProducts,
  saveProduct,
  updateProduct,
  deleteProduct,
  clearAllProducts,
} from "../db/database";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [name, setName]         = useState("");
  const [price, setPrice]       = useState("");
  const [gst, setGst]           = useState("");
  const [editingId, setEditingId] = useState(null);

  const loadProducts = () => setProducts(getProducts());

  useEffect(() => { loadProducts(); }, []);

  const handleSave = () => {
    if (!name || !price) return alert("Product name and price are required.");
    if (editingId) {
      updateProduct({ id: editingId, name, price: Number(price), gst: Number(gst) });
      setEditingId(null);
    } else {
      saveProduct({ id: Date.now(), name, price: Number(price), gst: Number(gst) });
    }
    setName(""); setPrice(""); setGst("");
    loadProducts();
  };

  const handleEdit = (p) => {
    setName(p.name); setPrice(p.price); setGst(p.gst); setEditingId(p.id);
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this product?")) return;
    deleteProduct(id);
    loadProducts();
  };

  const handleClearAll = () => {
    if (!confirm("Delete ALL products from the store? This cannot be undone.")) return;
    clearAllProducts();
    loadProducts();
  };

  return (
    <div className="bg-white border border-black p-4 space-y-4">

      {/* Title + Clear Store button */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase">Product Manager</h2>
        {products.length > 0 && (
          <button
            onClick={handleClearAll}
            className="border border-red-600 text-red-600 px-3 py-1 text-xs hover:bg-red-600 hover:text-white transition-colors"
          >
            🗑 Clear Store
          </button>
        )}
      </div>

      {/* Form */}
      <div className="grid grid-cols-3 gap-2">
        <input placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} className="border px-2 py-1 text-xs" />
        <input placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="border px-2 py-1 text-xs" type="number" />
        <input placeholder="GST %" value={gst} onChange={e => setGst(e.target.value)} className="border px-2 py-1 text-xs" type="number" />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="border border-black px-3 py-1 text-xs">
          {editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && (
          <button onClick={() => { setEditingId(null); setName(""); setPrice(""); setGst(""); }} className="border px-3 py-1 text-xs">
            Cancel
          </button>
        )}
      </div>

      {/* Product List */}
      <div className="border-t pt-3">
        {products.length === 0 ? (
          <p className="text-xs text-gray-400">No products added.</p>
        ) : (
          <table className="w-full text-xs border table-fixed">
            <thead>
              <tr className="border bg-gray-50">
                <th className="border px-2 py-1 text-left">Name</th>
                <th className="border px-2 py-1 w-20">Price</th>
                <th className="border px-2 py-1 w-16">GST%</th>
                <th className="border px-2 py-1 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border">
                  <td className="border px-2 py-1 break-words">{p.name}</td>
                  <td className="border px-2 py-1 text-right">{p.price}</td>
                  <td className="border px-2 py-1 text-right">{p.gst}</td>
                  <td className="border px-2 py-1 text-center space-x-1">
                    <button onClick={() => handleEdit(p)} className="border px-2 py-0.5 text-xs">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="border px-2 py-0.5 text-xs text-red-600">Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}