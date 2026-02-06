'use client';

import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import ImageEditor from '@/components/ImageEditor';
import { TrashIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

export default function NewProductPage() {
  const fetcher = useAuthorizedFetch();
  const router = useRouter();

  // Product Title & Description
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  
  // Pricing
  const [price, setPrice] = useState<number | ''>('');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  
  // Inventory
  const [SKU, setSKU] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [barcode, setBarcode] = useState('');
  
  // Additional fields
  const [weightGrams, setWeightGrams] = useState<number | ''>('');
  const [hasSizes, setHasSizes] = useState<boolean>(false); // Always initialize as boolean
  const [isActive, setIsActive] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  
  // Images & Media
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainThumbnailIndex, setMainThumbnailIndex] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add category modal state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Delete category modal state
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Try admin endpoint first, fallback to public endpoint
        let res = await fetcher('/admin/categories');
        if (!res.ok) {
          console.log('Admin categories failed, trying public endpoint...');
          res = await fetch('/api/categories');
        }
        const json = await res.json();
        if (res.ok && json.data && json.data.categories && Array.isArray(json.data.categories)) {
          // Use API response if successful
          setCategories(json.data.categories);
          console.log('Loaded categories from API:', json.data.categories.length);
        } else {
          console.error('Invalid API response:', json);
          setCategories([]);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [fetcher]);

  // Cleanup object URLs on component unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => {
        if (url && !url.startsWith('data:')) {
          URL.revokeObjectURL(url);
        }
      });
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [imagePreviews, videoPreview]);

  // Handle multiple image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(prev => [...prev, ...files]);
      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  // Remove image by index
  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const preview = prev[index];
      if (preview && !preview.startsWith('data:')) {
        URL.revokeObjectURL(preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index > 0) {
      setImageFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        return newFiles;
      });
      setImagePreviews(prev => {
        const newPreviews = [...prev];
        [newPreviews[index - 1], newPreviews[index]] = [newPreviews[index], newPreviews[index - 1]];
        return newPreviews;
      });
    }
  };

  // Move image down in order
  const moveImageDown = (index: number) => {
    if (index < imageFiles.length - 1) {
      setImageFiles(prev => {
        const newFiles = [...prev];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        return newFiles;
      });
      setImagePreviews(prev => {
        const newPreviews = [...prev];
        [newPreviews[index], newPreviews[index + 1]] = [newPreviews[index + 1], newPreviews[index]];
        return newPreviews;
      });
    }
  };

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
    }
  };

  // Remove video
  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Handle name change and auto-generate slug
  const handleCategoryNameChange = (name: string) => {
    setNewCategoryName(name);
    if (!newCategorySlug || newCategorySlug === generateSlug(newCategoryName)) {
      setNewCategorySlug(generateSlug(name));
    }
  };

  // Create new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategorySlug.trim()) {
      setError('Category name and slug are required');
      return;
    }

    setCreatingCategory(true);
    setError(null);

    try {
      const res = await fetcher('/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          slug: newCategorySlug.trim(),
          description: newCategoryDescription.trim() || null,
          isActive: true,
        }),
      });

      const json = await res.json();

      if (res.ok && json.data?.category) {
        // Add new category to the list
        setCategories(prev => [...prev, json.data.category]);
        // Automatically select the new category
        setSelectedCategories(prev => [...prev, json.data.category.id]);
        // Reset form and close modal
        setNewCategoryName('');
        setNewCategorySlug('');
        setNewCategoryDescription('');
        setShowAddCategoryModal(false);
      } else {
        setError(json.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategory(true);
    setError(null);

    try {
      const res = await fetcher(`/admin/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (res.ok) {
        // Remove category from the list
        setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
        // Remove from selected categories if it was selected
        setSelectedCategories(prev => prev.filter(id => id !== categoryToDelete.id));
        // Close modal and reset
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
      } else {
        setError(json.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    } finally {
      setDeletingCategory(false);
    }
  };

  // Open delete category modal
  const openDeleteCategoryModal = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('slug', slug);
      formData.append('description', description);
      formData.append('price', price.toString());
      formData.append('compareAtPrice', compareAtPrice === '' ? '' : compareAtPrice.toString());
      formData.append('SKU', SKU);
      formData.append('quantity', quantity === '' ? '0' : quantity.toString());
      formData.append('barcode', barcode);
      formData.append('weightGrams', weightGrams === '' ? '' : weightGrams.toString());
      // If hasSizes is checked, use standard size list; otherwise empty
      formData.append('size', hasSizes ? 'XS, S, M, L, XL, XXL' : '');
      // For made-to-order products, send empty sizeStock (not tracking stock per size)
      formData.append('sizeStock', JSON.stringify({}));
      formData.append('isActive', isActive.toString());
      formData.append('categoryIds', JSON.stringify(selectedCategories));
      formData.append('mainThumbnailIndex', mainThumbnailIndex.toString());
      
      // Add multiple images (either original files or edited images)
      for (let index = 0; index < imagePreviews.length; index++) {
        const preview = imagePreviews[index];
        
        if (preview && preview.startsWith('data:')) {
          // Convert edited image from ImageEditor
          const response = await fetch(preview);
          const blob = await response.blob();
          const fileName = `product-${Date.now()}-${index}.jpg`;
          formData.append(`image_${index}`, blob, fileName);
        } else if (imageFiles[index]) {
          // Use original file if available and not edited
          formData.append(`image_${index}`, imageFiles[index]);
        }
      }
      
      // Add video if present
      if (videoFile) {
        formData.append('video', videoFile);
      }

      const res = await fetcher('/products', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (res.ok) {
        router.push('/admin/products');
      } else {
        setError(json.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminGuard>
      <Fragment>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">New Product</h1>
        
        {error && <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        
        <div className="space-y-8">
          {/* Product Title & Description Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Product Title & Description</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Title *</label>
                <input 
                  id="name" 
                  placeholder="Enter product title" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  required
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Slug *</label>
                <input 
                  id="slug" 
                  placeholder="product-slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Description</label>
              <textarea 
                id="description" 
                placeholder="Describe your product in detail..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                rows={4} 
              />
            </div>
          </div>

          {/* Images & Media Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Images & Media</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Upload your high-quality images. Set the order: lead with your best model shot, followed by other angles, flat lays, and finally the video.</p>
            
            {/* Multiple Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Images</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                  multiple
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload images</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 5MB each</p>
                  </div>
                </label>
              </div>
              
              {/* Image Previews with Order Controls */}
              {imagePreviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                      index === mainThumbnailIndex 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}>
                      <div className="flex-shrink-0 relative">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-16 h-16 object-cover rounded"
                        />
                        {index === mainThumbnailIndex && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">★</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Image {index + 1}
                          {index === mainThumbnailIndex && (
                            <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                              Main Thumbnail
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">Order: {index + 1}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setMainThumbnailIndex(index)}
                          className={`p-1 text-xs rounded ${
                            index === mainThumbnailIndex
                              ? 'bg-indigo-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                          }`}
                          title="Set as main thumbnail"
                        >
                          ★
                        </button>
                        <button
                          onClick={() => {
                            setEditingImageIndex(index);
                            setShowImageEditor(true);
                          }}
                          className="p-1 text-indigo-400 hover:text-indigo-600"
                          title="Edit image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveImageUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveImageDown(index)}
                          disabled={index === imagePreviews.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Video (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  {videoPreview ? (
                    <div className="space-y-2">
                      <video 
                        src={videoPreview} 
                        className="w-full h-48 object-cover rounded-lg mx-auto"
                        controls
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to change video</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload a video</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">MP4, MOV up to 50MB</p>
                    </div>
                  )}
                </label>
                {videoPreview && (
                  <button
                    onClick={removeVideo}
                    className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Video
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Pricing</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input 
                    id="price" 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={price} 
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                    className="w-full pl-7 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The selling price</p>
              </div>
              
              <div>
                <label htmlFor="compareAtPrice" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Compare at Price</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input 
                    id="compareAtPrice" 
                    placeholder="0.00" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={compareAtPrice} 
                    onChange={(e) => setCompareAtPrice(e.target.value === '' ? '' : Number(e.target.value))} 
                    className="w-full pl-7 border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">The original price if the item is on sale (e.g., Price: $49.99 | Compare at: $79.99)</p>
              </div>
            </div>
          </div>

          {/* Inventory Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Inventory (SKU & Barcode)</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sku" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">SKU (Stock Keeping Unit) *</label>
                <input 
                  id="sku" 
                  placeholder="EVADRESS-BLU-M" 
                  value={SKU} 
                  onChange={(e) => setSKU(e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create a unique identifier for each product variant. Example: EVADRESS-BLU-M for the Eva Dress in Blue, Size Medium.</p>
              </div>
              
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Quantity *</label>
                <input 
                  id="quantity" 
                  placeholder="0" 
                  type="number" 
                  min="0"
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter the stock level for each variant. This allows for low-stock alerts.</p>
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="barcode" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Barcode (Optional)</label>
              <input 
                id="barcode" 
                placeholder="123456789012" 
                value={barcode} 
                onChange={(e) => setBarcode(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Additional Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Weight (grams)</label>
                <input 
                  id="weight" 
                  placeholder="0" 
                  type="number" 
                  min="0"
                  value={weightGrams} 
                  onChange={(e) => setWeightGrams(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Product Sizes</label>
                <div className="flex items-center space-x-2">
                  <input 
                    id="hasSizes" 
                    type="checkbox" 
                    checked={Boolean(hasSizes)} 
                    onChange={(e) => setHasSizes(Boolean(e.target.checked))} 
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hasSizes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product has sizes (XS, S, M, L, XL, XXL)
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check this if customers need to select a size when ordering. Leave unchecked for products without sizes (e.g., accessories, bags).
                </p>
              </div>
            </div>
            
            {/* Made-to-Order Notice */}
            {hasSizes && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Made-to-Order Product</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      This product has sizes. Customers will select their preferred size when ordering. The quantity field above represents the total stock available for all sizes combined.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <div className="flex items-center space-x-2">
                <input 
                  id="active" 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Product is active</label>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Categories</h2>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Category
              </button>
            </div>
            {loadingCategories ? (
              <div className="text-sm text-gray-500">Loading categories...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.length === 0 ? (
                  <p className="text-sm text-gray-500 col-span-full">No categories available</p>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50 group">
                      <label className="flex items-center space-x-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openDeleteCategoryModal(category);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-600 rounded"
                        title="Delete category"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <button 
              disabled={saving || !name || !slug || !SKU || !price || quantity === ''} 
              onClick={onSave} 
              className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              {saving ? 'Creating Product...' : 'Create Product'}
            </button>
            <button 
              onClick={() => router.push('/admin/products')}
              className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      {/* Image Editor Modal */}
      {showImageEditor && editingImageIndex !== null && imagePreviews[editingImageIndex] && (
        <ImageEditor
          imageUrl={imagePreviews[editingImageIndex]}
          onSave={(editedImageUrl) => {
            const newPreviews = [...imagePreviews];
            newPreviews[editingImageIndex] = editedImageUrl;
            setImagePreviews(newPreviews);
            setShowImageEditor(false);
            setEditingImageIndex(null);
          }}
          onClose={() => {
            setShowImageEditor(false);
            setEditingImageIndex(null);
          }}
        />
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Add New Category
                </h3>
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategorySlug('');
                    setNewCategoryDescription('');
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {error && (
                <div className="mb-4 text-sm text-red-600 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="categoryName" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Category Name *
                  </label>
                  <input
                    id="categoryName"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                    placeholder="e.g., Kids, Bags, Watches"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="categorySlug" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Slug *
                  </label>
                  <input
                    id="categorySlug"
                    type="text"
                    value={newCategorySlug}
                    onChange={(e) => setNewCategorySlug(e.target.value)}
                    placeholder="e.g., kids, bags, watches"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    URL-friendly version (auto-generated from name)
                  </p>
                </div>

                <div>
                  <label htmlFor="categoryDescription" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    id="categoryDescription"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category..."
                    rows={3}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategorySlug('');
                    setNewCategoryDescription('');
                    setError(null);
                  }}
                  disabled={creatingCategory}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={creatingCategory || !newCategoryName.trim() || !newCategorySlug.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {creatingCategory ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {showDeleteCategoryModal && categoryToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                Delete Category
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <strong>{categoryToDelete.name}</strong>? 
                  This action cannot be undone.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Note: This will remove the category from all products that use it.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteCategoryModal(false);
                      setCategoryToDelete(null);
                    }}
                    disabled={deletingCategory}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCategory}
                    disabled={deletingCategory}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                  >
                    {deletingCategory ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </Fragment>
    </AdminGuard>
  );
}