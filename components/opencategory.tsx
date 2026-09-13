'use client';

import { useState, useRef, useEffect } from 'react';
import { updateCategory } from '@/lib/categoriesStore';
import type { Category } from '@/lib/datatypes';
import { X, Upload, Trash2, Loader2, AlertCircle, Lock } from 'lucide-react';
import Image from 'next/image';

interface OpenCategoryModalProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OpenCategoryModal({
  category,
  isOpen,
  onClose,
  onSuccess,
}: OpenCategoryModalProps) {
  if (!isOpen || !category) return null;

  return (
    <OpenCategoryModalContent
      key={category.id}
      category={category}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function OpenCategoryModalContent({
  category,
  onClose,
  onSuccess,
}: {
  category: Category;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(category.name || '');
  const [description, setDescription] = useState(category.description || '');
  const [status, setStatus] = useState<boolean>(category.status ?? true);
  const [available, setAvailable] = useState<boolean>(category.available ?? true);

  const [imageUrl, setImageUrl] = useState<string | null>(category.image_url || null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URL when unmounted
  useEffect(() => {
    return () => {
      if (newImagePreview && newImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(newImagePreview);
      }
    };
  }, [newImagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file size must be less than 5MB');
        return;
      }
      setNewImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setNewImagePreview(objectUrl);
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    setNewImageFile(null);
    if (newImagePreview && newImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(newImagePreview);
    }
    setNewImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Category Name is required.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await updateCategory(
        category.id,
        {
          name: trimmedName,
          description: description.trim() || null,
          image_url: imageUrl,
          status,
          available,
        },
        newImageFile
      );

      if (updateError) {
        throw updateError;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update category.');
    } finally {
      setLoading(false);
    }
  };

  const currentDisplayImage = newImagePreview || imageUrl;

  return (
    <div
      id="open-category-modal-backdrop"
      className="modal-backdrop"
    >
      <div
        id="open-category-modal-content"
        className="modal-card"
      >
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              Edit Category
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Category ID is locked. Update details and status below.
            </p>
          </div>
          <button
            type="button"
            id="close-open-category-btn"
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

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Category ID (Locked / Readonly) & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="edit_category_id"
                  className="form-label"
                >
                  Category ID
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              </div>
              <input
                id="edit_category_id"
                type="text"
                disabled
                value={category.category_id}
                className="form-input-disabled"
              />
            </div>

            <div>
              <label
                htmlFor="edit_category_name"
                className="form-label"
              >
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit_category_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Category Name"
                className="form-input"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="edit_category_desc"
              className="form-label"
            >
              Description (Optional)
            </label>
            <textarea
              id="edit_category_desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about this category..."
              className="form-textarea"
            />
          </div>

          {/* Image Upload & Management */}
          <div>
            <label className="form-label mb-1.5">
              Category Image
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="edit-category-image-file"
            />

            {currentDisplayImage ? (
              <div className="image-preview-card">
                <div className="category-image-box h-16 w-16 bg-white">
                  <Image
                    src={currentDisplayImage}
                    alt={name || 'Category'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-neutral-800 truncate">
                    {newImageFile ? newImageFile.name : 'Current Image'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {newImageFile
                      ? 'New image selected to upload'
                      : 'Saved in category_images bucket'}
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
                    title="Remove Image"
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
                  Click to upload category image
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
                id="edit_category_status_toggle"
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
                id="edit_category_available_toggle"
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
              id="cancel-edit-category-btn"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-edit-category-btn"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
