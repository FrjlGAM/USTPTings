import React, { useRef, useState } from "react";
import { db, auth } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductAdded?: () => void; // callback to refresh dashboard
}
//  remove linter warning
// const REQUIRED_FIELDS = [  // List of required fields for validation

//   'productName', 'price', 'stock', 'productImage',
// ];

const AddProductModal: React.FC<AddProductModalProps> = ({ open, onClose, onProductAdded }) => {
  const [productImage, setProductImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [dateSlotInput, setDateSlotInput] = useState('');
  const [dateSlots, setDateSlots] = useState<{date: string, times: string[]}[]>([]);
  const [timeSlotInput, setTimeSlotInput] = useState('');
  const [activeDateForTime, setActiveDateForTime] = useState<string | null>(null);
  const [campusLocation, setCampusLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key:string]: string}>({});
  const [showSuccess, setShowSuccess] = useState(false);

  if (!open) return null;

  // Handle image upload (Cloudinary, like MyProfile)
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'profile_picture');
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dr7t6evpc/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await response.json();
      if (!data.secure_url) throw new Error("No secure_url returned from Cloudinary");
      setProductImage(data.secure_url);
      setErrors(prev => ({...prev, productImage: ''}));
    } catch (error) {
      alert("Failed to upload image. Check console for details.");
      console.error("Image upload error:", error);
    }
    setUploading(false);
  };

  // Tag chip logic
  const handleTagAdd = () => {
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput('');
    }
  };
  const handleTagRemove = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Date slot logic
  const handleDateSlotAdd = () => {
    const val = dateSlotInput.trim();
    if (val && !dateSlots.some(ds => ds.date === val)) {
      setDateSlots([...dateSlots, { date: val, times: [] }]);
      setDateSlotInput('');
      setActiveDateForTime(val);
    }
  };
  const handleDateSlotRemove = (date: string) => {
    setDateSlots(dateSlots.filter(ds => ds.date !== date));
    if (activeDateForTime === date) setActiveDateForTime(null);
  };
  // Timeslot logic per date
  const handleTimeSlotAdd = (date: string) => {
    if (!timeSlotInput.trim()) return;
    setDateSlots(dateSlots.map(ds =>
      ds.date === date && !ds.times.includes(timeSlotInput.trim())
        ? { ...ds, times: [...ds.times, timeSlotInput.trim()] }
        : ds
    ));
    setTimeSlotInput('');
  };
  const handleTimeSlotRemove = (date: string, time: string) => {
    setDateSlots(dateSlots.map(ds =>
      ds.date === date
        ? { ...ds, times: ds.times.filter(t => t !== time) }
        : ds
    ));
  };

  // Validation
  const validate = () => {
    const newErrors: {[key:string]: string} = {};
    if (!productName) newErrors.productName = 'Product name is required.';
    if (!price || isNaN(Number(price)) || Number(price) <= 0) newErrors.price = 'Valid price is required.';
    if (!stock || isNaN(Number(stock)) || Number(stock) < 0) newErrors.stock = 'Valid stock is required.';
    if (!productImage) newErrors.productImage = 'Product image is required.';
    return newErrors;
  };

  // Reset form
  const resetForm = () => {
    setProductName('');
    setPrice('');
    setStock('');
    setTags([]);
    setTagInput('');
    setDescription('');
    setDateSlotInput('');
    setDateSlots([]);
    setTimeSlotInput('');
    setActiveDateForTime(null);
    setCampusLocation('');
    setPaymentMethod('');
    setProductImage(null);
    setErrors({});
  };

  // Handle submit
  const handleAddProduct = async () => {
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setSaving(true);
    try {
      const productData = {
        name: productName,
        price,
        stock: Number(stock),
        tags,
        image: productImage,
        description,
        dateSlots,
        campusLocation,
        paymentMethod,
        sellerId: auth.currentUser?.uid || null,
        createdAt: new Date(),
      };
      await addDoc(collection(db, 'products'), productData);
      setShowSuccess(true);
      setSaving(false);
      resetForm();
      if (onProductAdded) onProductAdded();
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    } catch (error) {
      setSaving(false);
      alert('Failed to add product. Check console for details.');
      console.error('Add product error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFF3F2]/80 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-[900px] max-w-full relative border-2 border-black">
        {/* Success Toast */}
        {showSuccess && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full shadow-lg z-50 animate-fade-in">
            Product added successfully!
          </div>
        )}
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#F88379] hover:bg-[#F88379]/10 rounded-full w-10 h-10 flex items-center justify-center border-2 border-[#F88379]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F88379" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="6" x2="18" y2="18"/>
            <line x1="6" y1="18" x2="18" y2="6"/>
          </svg>
        </button>
        <div className="flex gap-8">
          {/* Left Side */}
          <div className="flex-1 flex flex-col gap-6 pr-2">
            <h2 className="text-4xl font-bold mb-2 text-black italic">Delivery Details</h2>
            {/* Date Slots Input */}
            <label className="font-semibold">Date Slots <span className="text-gray-400">(multiple allowed, each with timeslots)</span></label>
            <div className="flex gap-2 items-center mb-2">
              <input
                className="border-b-2 border-gray-300 py-2 focus:outline-none font-semibold flex-1"
                placeholder="Add a date (e.g. 2024-06-01) and press Enter"
                value={dateSlotInput}
                onChange={e => setDateSlotInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleDateSlotAdd(); } }}
                type="date"
              />
              <button
                type="button"
                className="bg-[#F88379] text-white px-3 py-1 rounded-full text-sm font-bold"
                onClick={handleDateSlotAdd}
                disabled={!dateSlotInput.trim()}
              >Add</button>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {dateSlots.map(ds => (
                <div key={ds.date} className="bg-[#F88379]/10 rounded p-2 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#F88379] text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      {ds.date}
                      <button type="button" className="ml-1 text-white hover:text-gray-200" onClick={() => handleDateSlotRemove(ds.date)}>&times;</button>
                    </span>
                    <button
                      className="ml-2 text-xs text-[#F88379] underline"
                      type="button"
                      onClick={() => setActiveDateForTime(ds.date)}
                    >{activeDateForTime === ds.date ? 'Adding times...' : 'Add timeslot'}</button>
                  </div>
                  {/* Times for this date */}
                  <div className="flex flex-wrap gap-2 ml-6">
                    {ds.times.map(time => (
                      <span key={time} className="bg-[#F88379] text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        {time}
                        <button type="button" className="ml-1 text-white hover:text-gray-200" onClick={() => handleTimeSlotRemove(ds.date, time)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  {/* Add timeslot input for this date */}
                  {activeDateForTime === ds.date && (
                    <div className="flex gap-2 items-center mt-1 ml-6">
                      <input
                        className="border-b-2 border-gray-300 py-1 focus:outline-none font-semibold flex-1"
                        placeholder="Add a timeslot (e.g. 10:00 AM)"
                        value={timeSlotInput}
                        onChange={e => setTimeSlotInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTimeSlotAdd(ds.date); } }}
                      />
                      <button
                        type="button"
                        className="bg-[#F88379] text-white px-2 py-1 rounded-full text-xs font-bold"
                        onClick={() => handleTimeSlotAdd(ds.date)}
                        disabled={!timeSlotInput.trim()}
                      >Add</button>
                      <button
                        type="button"
                        className="text-xs text-gray-400 ml-2"
                        onClick={() => setActiveDateForTime(null)}
                      >Done</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <input
              className="border-b-2 border-gray-300 py-2 focus:outline-none font-semibold"
              placeholder="Enter Campus Location (optional)"
              value={campusLocation}
              onChange={e => setCampusLocation(e.target.value)}
            />
            <select className="border-b-2 border-gray-300 py-2 focus:outline-none font-semibold text-gray-400" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
              <option value="">Choose Payment Method (optional)</option>
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
            </select>
            <textarea
              className="border-b-2 border-gray-300 py-2 focus:outline-none resize-none font-semibold mt-2"
              placeholder="Enter Product Description (optional)"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          {/* Center Image Upload */}
          <div className="flex flex-col items-center justify-center pt-6">
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <div
              className={`w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden border-2 ${errors.productImage ? 'border-red-500' : 'border-gray-300'}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ position: 'relative' }}
            >
              {uploading ? (
                <span className="text-2xl text-gray-400 font-light animate-pulse">Uploading...</span>
              ) : productImage ? (
                <img src={productImage} alt="Product" className="object-cover w-full h-full" />
              ) : (
                <span className="text-7xl text-gray-400 font-light">+</span>
              )}
            </div>
            {errors.productImage && <span className="text-red-500 text-xs mt-1">{errors.productImage}</span>}
          </div>
          {/* Right Side */}
          <div className="flex-1 flex flex-col gap-6 pl-2 pt-2">
            <label className="font-semibold">Product Name <span className="text-red-500">*</span></label>
            <input
              className={`border-b-2 py-2 focus:outline-none font-semibold ${errors.productName ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter Product Name"
              value={productName}
              onChange={e => { setProductName(e.target.value); setErrors(prev => ({...prev, productName: ''})); }}
            />
            {errors.productName && <span className="text-red-500 text-xs">{errors.productName}</span>}
            <label className="font-semibold">Price <span className="text-red-500">*</span></label>
            <input
              className={`border-b-2 py-2 focus:outline-none font-semibold ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter Price"
              type="number"
              value={price}
              onChange={e => { setPrice(e.target.value); setErrors(prev => ({...prev, price: ''})); }}
            />
            {errors.price && <span className="text-red-500 text-xs">{errors.price}</span>}
            <label className="font-semibold">Stock <span className="text-red-500">*</span></label>
            <input
              className={`border-b-2 py-2 focus:outline-none font-semibold ${errors.stock ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Enter Number of Stock"
              type="number"
              value={stock}
              onChange={e => { setStock(e.target.value); setErrors(prev => ({...prev, stock: ''})); }}
            />
            {errors.stock && <span className="text-red-500 text-xs">{errors.stock}</span>}
            <label className="font-semibold">Tags <span className="text-gray-400">(optional)</span></label>
            <div className="flex gap-2 items-center">
              <input
                className="border-b-2 border-gray-300 py-2 focus:outline-none font-semibold flex-1"
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleTagAdd(); } }}
              />
              <button
                type="button"
                className="bg-[#F88379] text-white px-3 py-1 rounded-full text-sm font-bold"
                onClick={handleTagAdd}
                disabled={!tagInput.trim()}
              >Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {tags.map(tag => (
                <span key={tag} className="bg-[#F88379] text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  {tag}
                  <button type="button" className="ml-1 text-white hover:text-gray-200" onClick={() => handleTagRemove(tag)}>&times;</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Add Product Button */}
        <div className="flex justify-center mt-8">
          <button
            className="bg-black text-white px-10 py-2 rounded-full font-bold text-lg hover:bg-[#F88379] transition disabled:opacity-60 flex items-center gap-2"
            disabled={saving || uploading}
            onClick={handleAddProduct}
          >
            {saving ? (
              <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Adding...</span>
            ) : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;
