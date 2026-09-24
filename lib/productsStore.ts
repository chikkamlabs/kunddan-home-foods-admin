import { supabase } from '@/lib/supabase';
import type {
  Product,
  ProductVariant,
  ProductVariantUpdate,
  ProductWithCategory,
  Category,
} from '@/lib/datatypes';

export interface CreateProductInput {
  product_id: string;
  category_id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  list?: string | null;
  estimated_delivery?: string | null;
  image_url?: string | null;
  used_in_txt?: string | null;
  benefits?: string | null;
  featured?: boolean;
  status?: boolean;
  available?: boolean;
}

export interface UpdateProductInput {
  category_id: string;
  name: string;
  description?: string | null;
  notes?: string | null;
  list?: string | null;
  estimated_delivery?: string | null;
  image_url?: string | null;
  used_in_txt?: string | null;
  benefits?: string | null;
  featured?: boolean;
  status?: boolean;
  available?: boolean;
}

export interface VariantDraft {
  size: string;
  mrp: number;
  selling_price: number;
  status: boolean;
}

/**
 * Calculates the next product ID based on the default sequence:
 * Default format: `prod-${101 + currentCount}`
 */
export function getNextProductId(currentCount: number = 0): string {
  return `prod-${101 + currentCount}`;
}

/**
 * Fetches total count of all products in the database.
 */
export async function getTotalProductsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching products count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getTotalProductsCount:', err);
    return 0;
  }
}

/**
 * Uploads a product image file to the Supabase `product_images` storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const cleanProdId = productId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const fileName = `${cleanProdId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('product_images')
    .upload(filePath, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Product image upload error:', uploadError);
    throw new Error(
      `Failed to upload image to 'product_images' bucket: ${uploadError.message}. Ensure the bucket exists in Supabase Storage.`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from('product_images')
    .getPublicUrl(uploadData?.path || filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded product image.');
  }

  return publicUrlData.publicUrl;
}

/**
 * Fetches all products with joined categories and product_variants from Supabase.
 */
export async function getProducts(): Promise<{
  data: ProductWithCategory[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (*),
        product_variants (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as ProductWithCategory[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching products'),
    };
  }
}

/**
 * Fetches a single product by its UUID or product_id string, including variants and category.
 */
export async function getProductById(idOrProductId: string): Promise<{
  data: ProductWithCategory | null;
  error: Error | null;
}> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrProductId
    );

    const query = supabase
      .from('products')
      .select(`
        *,
        categories (*),
        product_variants (*)
      `);

    const { data, error } = isUuid
      ? await query.eq('id', idOrProductId).single()
      : await query.eq('product_id', idOrProductId).single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as ProductWithCategory) || null, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching product'),
    };
  }
}

/**
 * Fetches total count of products in the database.
 */
export async function getProductsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting product count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching products count:', err);
    return 0;
  }
}

/**
 * Fetches total count of all variants across all products.
 */
export async function getTotalVariantsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('product_variants')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error getting variant count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error fetching variant count:', err);
    return 0;
  }
}

/**
 * Inserts a product into `products` table and its variants into `product_variants` table.
 * If an image file is provided, uploads it to `product_images` bucket first.
 */
export async function createProductWithVariants(
  productInput: CreateProductInput,
  variantsInput: VariantDraft[],
  imageFile?: File | null
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    if (!variantsInput || variantsInput.length === 0) {
      return {
        data: null,
        error: new Error('At least one product variant is required.'),
      };
    }

    let finalImageUrl = productInput.image_url || null;
    if (imageFile) {
      finalImageUrl = await uploadProductImage(imageFile, productInput.product_id);
    }

    // 1. Insert product record
    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert({
        product_id: productInput.product_id.trim(),
        category_id: productInput.category_id,
        name: productInput.name.trim(),
        description: productInput.description?.trim() || null,
        notes: productInput.notes?.trim() || null,
        list: productInput.list?.trim() || null,
        estimated_delivery: productInput.estimated_delivery?.trim() || null,
        image_url: finalImageUrl,
        used_in_txt: productInput.used_in_txt?.trim() || null,
        benefits: productInput.benefits?.trim() || null,
        featured: productInput.featured ?? false,
        status: productInput.status ?? true,
        available: productInput.available ?? true,
      })
      .select()
      .single();

    if (productError || !createdProduct) {
      return {
        data: null,
        error: new Error(productError?.message || 'Failed to insert product record'),
      };
    }

    // 2. Insert variants for this product
    const variantPayloads = variantsInput.map((v) => ({
      product_id: createdProduct.id,
      size: v.size.trim(),
      mrp: Number(v.mrp),
      selling_price: Number(v.selling_price),
      status: v.status ?? true,
    }));

    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantPayloads);

    if (variantsError) {
      console.error('Failed to insert variants:', variantsError);
      // Even if variants fail, report it clearly
      return {
        data: createdProduct as Product,
        error: new Error(
          `Product created but failed to save variants: ${variantsError.message}`
        ),
      };
    }

    return { data: createdProduct as Product, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error:
        err instanceof Error
          ? err
          : new Error('Failed to create product with variants'),
    };
  }
}

/**
 * Updates an existing product details (except product_id which is locked).
 */
export async function updateProduct(
  id: string,
  input: UpdateProductInput,
  newImageFile?: File | null
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    let finalImageUrl = input.image_url;

    if (newImageFile) {
      finalImageUrl = await uploadProductImage(newImageFile, id);
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        category_id: input.category_id,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        list: input.list?.trim() || null,
        estimated_delivery: input.estimated_delivery?.trim() || null,
        image_url: finalImageUrl,
        used_in_txt: input.used_in_txt?.trim() || null,
        benefits: input.benefits?.trim() || null,
        featured: input.featured ?? false,
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

    return { data: data as Product, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update product'),
    };
  }
}

/**
 * Adds a new variant to an existing product.
 */
export async function addProductVariant(
  productId: string,
  variant: VariantDraft
): Promise<{ data: ProductVariant | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        size: variant.size.trim(),
        mrp: Number(variant.mrp),
        selling_price: Number(variant.selling_price),
        status: variant.status ?? true,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ProductVariant, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to add product variant'),
    };
  }
}

/**
 * Updates an existing variant.
 */
export async function updateProductVariant(
  variantId: string,
  variant: Partial<VariantDraft>
): Promise<{ data: ProductVariant | null; error: Error | null }> {
  try {
    const updatePayload: ProductVariantUpdate = {
      updated_at: new Date().toISOString(),
    };
    if (variant.size !== undefined) updatePayload.size = variant.size.trim();
    if (variant.mrp !== undefined) updatePayload.mrp = Number(variant.mrp);
    if (variant.selling_price !== undefined)
      updatePayload.selling_price = Number(variant.selling_price);
    if (variant.status !== undefined) updatePayload.status = variant.status;

    const { data, error } = await supabase
      .from('product_variants')
      .update(updatePayload)
      .eq('id', variantId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as ProductVariant, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update variant'),
    };
  }
}

/**
 * Deletes a variant by its ID.
 */
export async function deleteProductVariant(
  variantId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete variant'),
    };
  }
}

/**
 * Deletes a product by its ID (cascade deletes variants).
 */
export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return { success: false, error: new Error(error.message) };
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Failed to delete product'),
    };
  }
}
