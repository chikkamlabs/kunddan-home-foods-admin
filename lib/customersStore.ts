import { supabase } from '@/lib/supabase';
import type { Customer, CustomerInsert, CustomerUpdate, Order } from '@/lib/datatypes';

export interface CustomerFilterParams {
  searchQuery?: string;
}

/**
 * Generate a unique customer tracking key if not provided (e.g., CUST-RANDOM)
 */
export function generateCustomerKey(mobile?: string): string {
  const cleanMobile = (mobile || '').replace(/\D/g, '').slice(-4);
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KEY-${cleanMobile ? cleanMobile + '-' : ''}${randomHex}`;
}

/**
 * Fetches total count of all customers in the database.
 */
export async function getTotalCustomersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching customers count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getTotalCustomersCount:', err);
    return 0;
  }
}

/**
 * Fetches customers with optional search filtering on name and mobile_number.
 */
export async function getCustomers(params?: CustomerFilterParams): Promise<{
  data: Customer[] | null;
  error: Error | null;
}> {
  try {
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (params?.searchQuery) {
      const q = params.searchQuery.trim();
      // Filter by name or mobile_number (case-insensitive)
      query = query.or(`name.ilike.%${q}%,mobile_number.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as Customer[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching customers'),
    };
  }
}

/**
 * Fetches a single customer by id (UUID).
 */
export async function getCustomerById(id: string): Promise<{
  data: Customer | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Customer, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching customer'),
    };
  }
}

/**
 * Fetches all orders belonging to a customer.
 */
export async function getCustomerOrders(customerId: string): Promise<{
  data: Order[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as Order[]) || [], error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to fetch customer orders'),
    };
  }
}

/**
 * Creates a new customer record.
 */
export async function createCustomer(
  customerData: Omit<CustomerInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const finalKey = customerData.key?.trim() || generateCustomerKey(customerData.mobile_number);

    const payload: CustomerInsert = {
      name: customerData.name.trim(),
      mobile_number: customerData.mobile_number.trim(),
      email: customerData.email?.trim() || null,
      address: customerData.address?.trim() || null,
      city: customerData.city?.trim() || null,
      city_code: customerData.city_code?.trim() || null,
      loyalty_points: Number(customerData.loyalty_points) || 0,
      referral_code: customerData.referral_code?.trim() || null,
      key: finalKey,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Customer, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to create customer'),
    };
  }
}

/**
 * Updates an existing customer by id.
 */
export async function updateCustomer(
  id: string,
  updates: CustomerUpdate
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const payload: CustomerUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Customer, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update customer'),
    };
  }
}
