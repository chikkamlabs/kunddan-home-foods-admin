import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/datatypes';

export interface CreateCategoryInput {
  category_id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  status?: boolean;
  available?: boolean;
}

export interface UpdateCategoryInput {
  name: string;
  description?: string | null;
  image_url?: string | null;
  status?: boolean;
  available?: boolean;
}

/**
 * Calculates the next category ID based on the default sequence:
 * Default format: `cat-${101 + currentCount}`
 */
export function getNextCategoryId(currentCount: number = 0): string {
  return `cat-${101 + currentCount}`;
}

/**
 * Uploads a category image file to the Supabase `category_images` storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadCategoryImage(
  file: File,
  categoryId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanCatId = categoryId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const fileName = `${cleanCatId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('category_images')
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Category image upload error:', uploadError);
    throw new Error(
      `Failed to upload image to 'category_images' bucket: ${uploadError.message}. Make sure the bucket exists in Supabase Storage with public access enabled.`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from('category_images')
    .getPublicUrl(uploadData?.path || filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded category image.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Fetches all categories from Supabase ordered by creation date (newest first).
 */
export async function getCategories(): Promise<{
  data: Category[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as Category[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching categories'),
    };
  }
}

/**
 * Fetches a single category by its primary UUID or category_id string.
 */
export async function getCategoryById(idOrCategoryId: string): Promise<{
  data: Category | null;
  error: Error | null;
}> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrCategoryId
    );

    const query = supabase.from('categories').select('*');
    const { data, error } = isUuid
      ? await query.eq('id', idOrCategoryId).single()
      : await query.eq('category_id', idOrCategoryId).single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as Category) || null, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching category'),
    };
  }
}

/**
 * Gets total category count.
 */
export async function getCategoriesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting category count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching categories count:', err);
    return 0;
  }
}

/**
 * Creates a new category in Supabase. If an image file is supplied,
 * it uploads to `category_images` bucket first and attaches the resulting public URL.
 */
export async function createCategory(
  input: CreateCategoryInput,
  imageFile?: File | null
): Promise<{ data: Category | null; error: Error | null }> {
  try {
    let finalImageUrl = input.image_url || null;

    if (imageFile) {
      finalImageUrl = await uploadCategoryImage(imageFile, input.category_id);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        category_id: input.category_id.trim(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        image_url: finalImageUrl,
        status: input.status ?? true,
        available: input.available ?? true,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Category, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create category'),
    };
  }
}

/**
 * Updates an existing category. If a new image file is provided,
 * it uploads to `category_images` and updates the image_url.
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
  newImageFile?: File | null
): Promise<{ data: Category | null; error: Error | null }> {
  try {
    let finalImageUrl = input.image_url;

    if (newImageFile) {
      finalImageUrl = await uploadCategoryImage(newImageFile, id);
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        image_url: finalImageUrl,
        status: input.status ?? true,
        available: input.available ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Category, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update category'),
    };
  }
}

/**
 * Deletes a category by its ID.
 */
export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete category'),
    };
  }
}
