import { supabase } from '@/lib/supabase';
import type {
  Order,
  OrderStatus,
  OrderWithDetails,
} from '@/lib/datatypes';

export interface OrderFilterParams {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  searchQuery?: string;
  status?: OrderStatus | 'ALL';
}

/**
 * Returns default date range filter for the last 1 week:
 * fromDate: 7 days ago (YYYY-MM-DD)
 * toDate: today (YYYY-MM-DD)
 */
export function getDefaultDateRange(): { fromDate: string; toDate: string } {
  const today = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(today.getDate() - 7);

  const format = (d: Date) => d.toISOString().split('T')[0];

  return {
    fromDate: format(oneWeekAgo),
    toDate: format(today),
  };
}

/**
 * Fetches total count of all orders in the database.
 */
export async function getTotalOrdersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching orders count:', error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.error('Error in getTotalOrdersCount:', err);
    return 0;
  }
}

/**
 * Fetches orders with joined customer data and order items.
 * Supports date range (fromDate, toDate) and search query (order_id, customer name).
 */
export async function getOrders(params?: OrderFilterParams): Promise<{
  data: OrderWithDetails[] | null;
  error: Error | null;
}> {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers (
          id,
          name,
          mobile_number,
          email,
          loyalty_points
        ),
        order_items (
          id,
          order_id,
          product_id,
          product_variant_id,
          mrp,
          price,
          quantity,
          line_total,
          products (
            id,
            product_id,
            name,
            image_url
          ),
          product_variants (
            id,
            size,
            mrp,
            selling_price
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Date range filter
    if (params?.fromDate) {
      // Start of the fromDate day (00:00:00 UTC)
      const fromTimestamp = `${params.fromDate}T00:00:00.000Z`;
      query = query.gte('created_at', fromTimestamp);
    }

    if (params?.toDate) {
      // End of the toDate day (23:59:59.999 UTC)
      const toTimestamp = `${params.toDate}T23:59:59.999Z`;
      query = query.lte('created_at', toTimestamp);
    }

    // Status filter
    if (params?.status && params.status !== 'ALL') {
      query = query.eq('status', params.status);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    let ordersList = (data as unknown as OrderWithDetails[]) || [];

    // Client-side search for customer name or order_id if supplied
    if (params?.searchQuery) {
      const q = params.searchQuery.trim().toLowerCase();
      ordersList = ordersList.filter((ord) => {
        const matchesOrderId = ord.order_id?.toLowerCase().includes(q);
        const matchesCustomerName = ord.customers?.name?.toLowerCase().includes(q);
        const matchesFullName = `${ord.first_name || ''} ${ord.last_name || ''}`
          .toLowerCase()
          .includes(q);
        return matchesOrderId || matchesCustomerName || matchesFullName;
      });
    }

    return { data: ordersList, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching orders'),
    };
  }
}

/**
 * Fetches a single order by its UUID or order_id string with full items, products, variants, and customer.
 */
export async function getOrderById(idOrOrderId: string): Promise<{
  data: OrderWithDetails | null;
  error: Error | null;
}> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      idOrOrderId
    );

    const query = supabase
      .from('orders')
      .select(`
        *,
        customers (*),
        order_items (
          *,
          products (*),
          product_variants (*)
        )
      `);

    const { data, error } = isUuid
      ? await query.eq('id', idOrOrderId).single()
      : await query.eq('order_id', idOrOrderId).single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: (data as unknown as OrderWithDetails) || null, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unknown error fetching order'),
    };
  }
}

/**
 * Updates order status (e.g. pending, approved, packed, shipping, delivered, rejected, cancelled).
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{ data: Order | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as Order, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update order status'),
    };
  }
}
