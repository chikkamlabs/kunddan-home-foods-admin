export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'staff' | 'user';

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'packed'
  | 'shipping'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          mobile: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          email?: string | null;
          mobile?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          mobile?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          mobile_number: string;
          email: string | null;
          address: string | null;
          city: string | null;
          city_code: string | null;
          loyalty_points: number;
          referral_code: string | null;
          key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          mobile_number: string;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          city_code?: string | null;
          loyalty_points?: number;
          referral_code?: string | null;
          key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          mobile_number?: string;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          city_code?: string | null;
          loyalty_points?: number;
          referral_code?: string | null;
          key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          status: boolean;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          status?: boolean;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          status?: boolean;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          product_id: string;
          category_id: string;
          name: string;
          description: string | null;
          notes: string | null;
          list: string | null;
          estimated_delivery: string | null;
          image_url: string | null;
          used_in_txt: string | null;
          benefits: string | null;
          featured: boolean;
          status: boolean;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          category_id?: string;
          name?: string;
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
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          mrp: number;
          selling_price: number;
          status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          mrp: number;
          selling_price: number;
          status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          mrp?: number;
          selling_price?: number;
          status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string | null;
          items_quantity: number;
          amount: number;
          sub_total: number;
          discount: number;
          referral_code: string | null;
          coupon_code: string | null;
          first_name: string;
          last_name: string | null;
          email: string | null;
          mobile: string;
          address_line1: string;
          address_line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id?: string | null;
          items_quantity?: number;
          amount?: number;
          sub_total?: number;
          discount?: number;
          referral_code?: string | null;
          coupon_code?: string | null;
          first_name: string;
          last_name?: string | null;
          email?: string | null;
          mobile: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_id?: string | null;
          items_quantity?: number;
          amount?: number;
          sub_total?: number;
          discount?: number;
          referral_code?: string | null;
          coupon_code?: string | null;
          first_name?: string;
          last_name?: string | null;
          email?: string | null;
          mobile?: string;
          address_line1?: string;
          address_line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          product_variant_id: string;
          mrp: number;
          price: number;
          quantity: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          product_variant_id: string;
          mrp: number;
          price: number;
          quantity?: number;
          line_total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          product_variant_id?: string;
          mrp?: number;
          price?: number;
          quantity?: number;
          line_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_variant_id_fkey';
            columns: ['product_variant_id'];
            isOneToOne: false;
            referencedRelation: 'product_variants';
            referencedColumns: ['id'];
          }
        ];
      };
      coupons: {
        Row: {
          id: string;
          coupon_code: string;
          title: string;
          discount: number;
          min_order: number | null;
          max_discount: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          coupon_code: string;
          title: string;
          discount: number;
          min_order?: number | null;
          max_discount?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          coupon_code?: string;
          title?: string;
          discount?: number;
          min_order?: number | null;
          max_discount?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenient Entity Row Types
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Customer = Database['public']['Tables']['customers']['Row'];
export type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
export type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export type Category = Database['public']['Tables']['categories']['Row'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export type Product = Database['public']['Tables']['products']['Row'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];

export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type ProductVariantInsert = Database['public']['Tables']['product_variants']['Insert'];
export type ProductVariantUpdate = Database['public']['Tables']['product_variants']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update'];

export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
export type CouponUpdate = Database['public']['Tables']['coupons']['Update'];

// Extended / Joined Types commonly used in Admin dashboards
export interface ProductWithCategory extends Product {
  categories?: Category | null;
  product_variants?: ProductVariant[];
}

export interface OrderWithDetails extends Order {
  customers?: Customer | null;
  order_items?: (OrderItem & {
    products?: Product | null;
    product_variants?: ProductVariant | null;
  })[];
}
