 'use client';
import { useRef } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function ImageUpload({ onUpload }) {
  const inputRef = useRef();

  const handleChange = async () => {
    const file = inputRef.current.files[0];
    const url = await uploadToCloudinary(file);
    onUpload(url);
  };

  return <input type="file" ref={inputRef} onChange={handleChange} />;
}