'use client';

import { useState, useRef, useEffect } from 'react';
import {
  createCategory,
  getNextCategoryId,
} from '@/lib/categoriesStore';
import { X, Upload, Trash2, Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCategoriesCount?: number;
}

export default function AddCategoryModal({
  isOpen,
  onClose,
  onSuccess,
  currentCategoriesCount = 0,
}: AddCategoryModalProps) {
  if (!isOpen) return null;

  return (
    <AddCategoryModalContent
      key={`add-cat-${currentCategoriesCount}`}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      currentCategoriesCount={currentCategoriesCount}
    />
  );
}

function AddCategoryModalContent({
  onClose,
  onSuccess,
  currentCategoriesCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCategoriesCount: number;
}) {
  const defaultCategoryId = getNextCategoryId(currentCategoriesCount);

  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<boolean>(true);
  const [available, setAvailable] = useState<boolean>(true);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URL when unmounted
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCatId = categoryId.trim();
    const trimmedName = name.trim();

    if (!trimmedCatId) {
      setError('Category ID is required (e.g. cat-101).');
      return;
    }

    if (!trimmedName) {
      setError('Category Name is required.');
      return;
    }

    setLoading(true);

    try {
      const { error: createError } = await createCategory(
        {
          category_id: trimmedCatId,
          name: trimmedName,
          description: description.trim() || null,
          status,
          available,
        },
        imageFile
      );

      if (createError) {
        throw createError;
      }

      // Reset form
      setCategoryId(getNextCategoryId(currentCategoriesCount + 1));
      setName('');
      setDescription('');
      setStatus(true);
      setAvailable(true);
      handleRemoveImage();

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="add-category-modal-backdrop"
      className="modal-backdrop"
    >
      <div
        id="add-category-modal-content"
        className="modal-card"
      >
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Add New Category
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Enter category details and upload an image
            </p>
          </div>
          <button
            type="button"
            id="close-add-category-btn"
            onClick={onClose}
            className="btn-icon-close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="ui-alert-error">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category ID & Name Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category_id"
                className="form-label"
              >
                Category ID <span className="text-red-500">*</span>
              </label>
              <input
                id="category_id"
                type="text"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                placeholder={defaultCategoryId}
                className="form-input font-mono"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Default: {defaultCategoryId} (cat-101 + {currentCategoriesCount})
              </p>
            </div>

            <div>
              <label
                htmlFor="category_name"
                className="form-label"
              >
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                id="category_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dry Fruits & Nuts"
                className="form-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="category_desc"
              className="form-label"
            >
              Description (Optional)
            </label>
            <textarea
              id="category_desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about this category..."
              className="form-textarea"
            />
          </div>

          {/* Image Upload with Preview & Bucket Storage */}
          <div>
            <label className="form-label mb-1.5">
              Category Image (Stored in category_images bucket)
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="category-image-file"
            />

            {imagePreview ? (
              <div className="image-preview-card">
                <div className="category-image-box h-16 w-16 bg-white">
                  <Image
                    src={imagePreview}
                    alt="Category Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-neutral-800 truncate">
                    {imageFile?.name || 'Selected Image'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Ready to upload to category_images bucket
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-xs px-2.5 py-1"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn-danger-icon"
                    title="Delete Image"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="upload-dropzone"
              >
                <div className="brand-icon-box bg-white shadow-xs mb-2">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-neutral-700">
                  Click to select & upload image
                </span>
                <span className="text-[11px] text-neutral-400 mt-0.5">
                  PNG, JPG, WebP up to 5MB
                </span>
              </div>
            )}
          </div>

          {/* Status & Available Switches */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="switch-toggle-card">
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">Status</span>
                <span className="text-[11px] text-neutral-500">
                  {status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <input
                type="checkbox"
                id="category_status_toggle"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="form-checkbox"
              />
            </div>

            <div className="switch-toggle-card">
              <div>
                <span className="text-xs font-semibold text-neutral-800 block">Available</span>
                <span className="text-[11px] text-neutral-500">
                  {available ? 'In Stock / Visible' : 'Unavailable'}
                </span>
              </div>
              <input
                type="checkbox"
                id="category_available_toggle"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="form-checkbox"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              id="cancel-add-category-btn"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-add-category-btn"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Category...
                </>
              ) : (
                'Save Category'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
