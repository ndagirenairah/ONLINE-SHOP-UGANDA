import React, { useState } from "react";

const initialState = {
  title: "",
  price: "",
  oldPrice: "",
  image: "",
  brand: "Fashion",
  badge: "Brand New",
  badgeType: "default",
  guarantee: "7 days return policy",
  discount: "",
  stars: 5,
};

const AddProductForm = ({ onAdd }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // POST to backend
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
          discount: form.discount ? Number(form.discount) : undefined,
          stars: Number(form.stars),
        }),
      });
      if (!res.ok) throw new Error("Failed to add product");
      const data = await res.json();
      onAdd && onAdd(data);
      setForm(initialState);
    } catch (err) {
      setError(err.message || "Error adding product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 16, borderRadius: 8, marginBottom: 24, maxWidth: 500 }}>
      <h3>Add New Clothing Item</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" required />
        <input name="oldPrice" value={form.oldPrice} onChange={handleChange} placeholder="Old Price (optional)" type="number" />
        <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" required />
        <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand (e.g. Fashion, Shoes)" />
        <input name="badge" value={form.badge} onChange={handleChange} placeholder="Badge (e.g. Brand New)" />
        <input name="guarantee" value={form.guarantee} onChange={handleChange} placeholder="Guarantee" />
        <input name="discount" value={form.discount} onChange={handleChange} placeholder="Discount % (optional)" type="number" />
        <input name="stars" value={form.stars} onChange={handleChange} placeholder="Stars (1-5)" type="number" min="1" max="5" />
        <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Product"}</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </div>
    </form>
  );
};

export default AddProductForm;