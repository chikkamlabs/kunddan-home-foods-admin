import { supabase } from '@/lib/supabase';
import type { Coupon, CouponInsert, CouponUpdate } from '@/lib/datatypes';

export interface CouponFilterParams {
  searchQuery?: string;
}

/**
 * Fetches total count of all coupons in the database.
 */
export async function getTotalCouponsCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching coupons count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getTotalCouponsCount:', err);
    return 0;
  }
}

/**
 * Fetches coupons with optional search filtering by coupon_code.
 */
export async function getCoupons(params?: CouponFilterParams): Promise<{
  data: Coupon[] | null;
  error: Error | null;
}> {
  try {
    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.searchQuery) {
      const q = params.searchQuery.trim();
      query = query.ilike('coupon_code', `%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as Coupon[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching coupons'),
    };
  }
}

/**
 * Fetches a single coupon by id (UUID).
 */
export async function getCouponById(id: string): Promise<{
  data: Coupon | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching coupon'),
    };
  }
}

/**
 * Creates a new coupon.
 */
export async function createCoupon(
  couponData: Omit<CouponInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Coupon | null; error: Error | null }> {
  try {
    const payload: CouponInsert = {
      coupon_code: couponData.coupon_code.trim().toUpperCase(),
      title: couponData.title.trim(),
      discount: Number(couponData.discount) || 0,
      min_order: couponData.min_order != null ? Number(couponData.min_order) : 0,
      max_discount: couponData.max_discount != null && couponData.max_discount !== ('' as unknown as number) ? Number(couponData.max_discount) : null,
      is_active: couponData.is_active ?? true,
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create coupon'),
    };
  }
}

/**
 * Updates an existing coupon by id.
 */
export async function updateCoupon(
  id: string,
  updates: CouponUpdate
): Promise<{ data: Coupon | null; error: Error | null }> {
  try {
    const payload: CouponUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (payload.coupon_code) {
      payload.coupon_code = payload.coupon_code.trim().toUpperCase();
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Coupon, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update coupon'),
    };
  }
}

/**
 * Deletes a coupon by id.
 */
export async function deleteCoupon(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err : new Error('Failed to delete coupon'),
    };
  }
}
