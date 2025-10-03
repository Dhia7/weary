'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminGuard, useAuthorizedFetch } from '@/lib/admin';
import { getImageUrl } from '@/lib/utils';
import ImageEditor from '@/components/ImageEditor';
import { TrashIcon } from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
}

interface Product {
  id?: number;
  name: string;
  slug: string;
  description: string;
  price: number | '';
  compareAtPrice: number | '';
  SKU: string;
  quantity: number | '';
  barcode: string | null;
  weightGrams: number | '';
  isActive: boolean;
  imageUrl: string | null;
  images?: string[];
  mainThumbnailIndex?: number;
  categories: Category[];
}

export default function EditProductPage() {
  const fetcher = useAuthorizedFetch();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const isNew = id === 'new';

  // Product data state
  const [productData, setProductData] = useState<Product>({
    name: '',
    slug: '',
    description: '',
    price: '',
    compareAtPrice: '',
    SKU: '',
    quantity: '',
    barcode: null,
    weightGrams: '',
    isActive: true,
    imageUrl: null,
    images: [],
    mainThumbnailIndex: 0,
    categories: []
  });

  // Categories and UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Images & Media state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [mainThumbnailIndex, setMainThumbnailIndex] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        if (res.ok && json.data.categories && json.data.categories.length > 3) {
          // Only use API if it returns more than 3 categories
          setCategories(json.data.categories);
        } else {
          console.log('API returned limited categories, using hardcoded list');
                        // Use hardcoded categories with correct IDs from database
                        setCategories([
                            { id: 11, name: 'Women', slug: 'women', isActive: true },
                            { id: 12, name: 'Men', slug: 'men', isActive: true },
                            { id: 2, name: 'Accessories', slug: 'accessories', isActive: true },
                            { id: 13, name: 'Footwear', slug: 'footwear', isActive: true },
                            { id: 14, name: 'Jewelry', slug: 'jewelry', isActive: true },
                            { id: 9, name: 'Activewear', slug: 'activewear', isActive: true }
                        ]);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Fallback to hardcoded categories if API fails
        setCategories([
            { id: 11, name: 'Women', slug: 'women', isActive: true },
            { id: 12, name: 'Men', slug: 'men', isActive: true },
            { id: 2, name: 'Accessories', slug: 'accessories', isActive: true },
            { id: 13, name: 'Footwear', slug: 'footwear', isActive: true },
            { id: 14, name: 'Jewelry', slug: 'jewelry', isActive: true },
            { id: 9, name: 'Activewear', slug: 'activewear', isActive: true }
        ]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [fetcher]);

  // Load product data for editing
  useEffect(() => {
    if (!isNew) {
      const loadData = async () => {
        try {
          const res = await fetcher(`/products/${id}`);
          const json = await res.json();
          if (res.ok) {
            const p = json.data.product;
            setProductData({
              id: p.id,
              name: p.name || '',
              slug: p.slug || '',
              description: p.description || '',
              price: p.price || '',
              compareAtPrice: p.compareAtPrice || '',
              SKU: p.SKU || '',
              quantity: p.quantity || '',
              barcode: p.barcode || null,
              weightGrams: p.weightGrams || '',
              isActive: p.isActive !== false,
              imageUrl: p.imageUrl || null,
              images: p.images || [],
              mainThumbnailIndex: p.mainThumbnailIndex || 0,
              categories: p.categories || []
            });
            setSelectedCategoryIds(p.categories?.map((c: Category) => c.id) || []);
            
            // Handle existing product images
            if (p.images && p.images.length > 0) {
              const imageUrls = p.images.map((img: string) => getImageUrl(img)).filter(Boolean);
              if (imageUrls.length > 0) {
                console.log('Setting image preview URLs:', imageUrls);
                setImagePreviews(imageUrls);
                setMainThumbnailIndex(p.mainThumbnailIndex || 0);
              }
            } else if (p.imageUrl) {
              // Fallback to single imageUrl for backward compatibility
              const imageUrl = getImageUrl(p.imageUrl);
              if (imageUrl) {
                console.log('Setting single image preview URL:', imageUrl);
                setImagePreviews([imageUrl]);
                setMainThumbnailIndex(0);
              }
            }
          } else {
            setError(json.message || 'Failed to load product');
          }
        } catch (error) {
          console.error('Error loading data:', error);
          setError('Failed to load product data');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [id, isNew, fetcher]);

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
    
    // Adjust main thumbnail index if needed
    if (index === mainThumbnailIndex && mainThumbnailIndex > 0) {
      setMainThumbnailIndex(mainThumbnailIndex - 1);
    } else if (index < mainThumbnailIndex) {
      setMainThumbnailIndex(mainThumbnailIndex - 1);
    }
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
      
      // Adjust main thumbnail index
      if (index === mainThumbnailIndex) {
        setMainThumbnailIndex(index - 1);
      } else if (index - 1 === mainThumbnailIndex) {
        setMainThumbnailIndex(index);
      }
    }
  };

  // Move image down in order
  const moveImageDown = (index: number) => {
    if (index < imagePreviews.length - 1) {
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
      
      // Adjust main thumbnail index
      if (index === mainThumbnailIndex) {
        setMainThumbnailIndex(index + 1);
      } else if (index + 1 === mainThumbnailIndex) {
        setMainThumbnailIndex(index);
      }
    }
  };

  // Handle video file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Update product data
  const updateProduct = (field: keyof Product, value: string | number | boolean | null) => {
    setProductData(prev => ({ ...prev, [field]: value }));
  };

  // Save product
  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('name', productData.name);
      formData.append('slug', productData.slug);
      formData.append('description', productData.description);
      formData.append('price', productData.price.toString());
      formData.append('compareAtPrice', productData.compareAtPrice.toString());
      formData.append('SKU', productData.SKU);
      formData.append('quantity', productData.quantity.toString());
      formData.append('barcode', productData.barcode || '');
      formData.append('weightGrams', productData.weightGrams.toString());
      formData.append('isActive', productData.isActive.toString());
      formData.append('categoryIds', JSON.stringify(selectedCategoryIds));
      formData.append('mainThumbnailIndex', mainThumbnailIndex.toString());
      // Include currently kept existing image paths (server-relative) so backend can remove others
      const remainingExisting = imagePreviews
        .filter((url) => typeof url === 'string' && (url.startsWith('/uploads/') || url.startsWith('/api/uploads/')))
        .map((url) => url.startsWith('/api/') ? url.replace('/api', '') : url);
      formData.append('existingImages', JSON.stringify(remainingExisting));
      
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
      
      const res = await fetcher(isNew ? '/products' : `/products/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        body: formData
      });
      
      const json = await res.json();
      if (res.ok) {
        setSuccess(isNew ? 'Product created successfully!' : 'Product updated successfully!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        setError(json.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Delete product
  const onDelete = async () => {
    if (isNew) return; // Can't delete a new product
    
    setDeleting(true);
    setError(null);
    
    try {
      const res = await fetcher(`/products/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setSuccess('Product deleted successfully');
        setTimeout(() => {
          router.push('/admin/products');
        }, 1500);
      } else {
        const json = await res.json();
        setError(json.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">{isNew ? 'New Product' : 'Edit Product'}</h1>
        
        {error && <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="text-green-600 text-sm p-4 bg-green-50 rounded-lg border border-green-200">{success}</div>}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading product data...</p>
          </div>
        ) : (
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
                    value={productData.name} 
                    onChange={(e) => updateProduct('name', e.target.value)} 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Slug *</label>
                  <input 
                    id="slug" 
                    placeholder="product-slug" 
                    value={productData.slug} 
                    onChange={(e) => updateProduct('slug', e.target.value)} 
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
                  value={productData.description} 
                  onChange={(e) => updateProduct('description', e.target.value)} 
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
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload video</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">MP4, MOV up to 100MB</p>
                      </div>
                    )}
                  </label>
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
                      value={productData.price} 
                      onChange={(e) => updateProduct('price', e.target.value === '' ? '' : Number(e.target.value))} 
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
                      value={productData.compareAtPrice} 
                      onChange={(e) => updateProduct('compareAtPrice', e.target.value === '' ? '' : Number(e.target.value))} 
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
                    value={productData.SKU} 
                    onChange={(e) => updateProduct('SKU', e.target.value)} 
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
                    value={productData.quantity} 
                    onChange={(e) => updateProduct('quantity', e.target.value === '' ? '' : Number(e.target.value))} 
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
                  value={productData.barcode || ''} 
                  onChange={(e) => updateProduct('barcode', e.target.value)} 
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
                    value={productData.weightGrams} 
                    onChange={(e) => updateProduct('weightGrams', e.target.value === '' ? '' : Number(e.target.value))} 
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400" 
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input 
                    id="active" 
                    type="checkbox" 
                    checked={productData.isActive} 
                    onChange={(e) => updateProduct('isActive', e.target.checked)} 
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Product is active</label>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Categories</h2>
              {loadingCategories ? (
                <div className="text-sm text-gray-500">Loading categories...</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500 col-span-full">No categories available</p>
                  ) : (
                    categories.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t">
          <button 
            disabled={saving || !productData.name || !productData.slug || !productData.SKU || !productData.price || productData.quantity === ''} 
            onClick={onSave} 
            className="px-8 py-3 rounded-lg bg-indigo-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={() => router.push('/admin/products')}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {!isNew && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-8 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Product
            </button>
          )}
        </div>
      </div>

      {/* Image Editor Modal */}
      {showImageEditor && editingImageIndex !== null && imagePreviews[editingImageIndex] && (
        <ImageEditor
          imageUrl={imagePreviews[editingImageIndex]}
          onSave={(editedImageUrl) => {
            console.log('Saving edited image:', editedImageUrl);
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                Delete Product
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete <strong>{productData.name}</strong>? 
                  This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center"
                  >
                    {deleting ? (
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
    </AdminGuard>
  );
}