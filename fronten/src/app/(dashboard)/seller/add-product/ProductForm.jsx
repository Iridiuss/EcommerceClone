 'use client';
import { useState } from 'react';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import ImageUpload from '@/components/UI/ImageUpload';
import validateProduct from '@/utils/validateProduct';
import toast from 'react-hot-toast';

export default function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateProduct(formData);
    if (!isValid) {
      toast.error("Invalid Data");
      return;
    }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      toast.success("Product added successfully!");
    } else {
      toast.error("Failed to add product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input name="name" placeholder="Name" onChange={handleChange} />
      <Input name="description" placeholder="Description" onChange={handleChange} />
      <Input name="price" placeholder="Price" onChange={handleChange} />
      <Input name="category" placeholder="Category" onChange={handleChange} />
      <ImageUpload onUpload={(url) => setFormData({ ...formData, image: url })} />
      <Button type="submit">Add Product</Button>
    </form>
  );
}