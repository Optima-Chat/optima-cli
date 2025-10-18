import { createAuthenticatedClient } from './base.js';
import { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';

const COMMERCE_API_BASE_URL = 'https://api.optima.chat';

// ============================================================================
// 类型定义
// ============================================================================

interface Product {
  id?: string;
  product_id?: string;
  title: string;
  name?: string;
  description?: string;
  price: number;
  currency?: string;
  stock?: number;
  quantity?: number;
  sku?: string;
  status?: 'active' | 'inactive' | 'draft' | 'archived';
  category_id?: string;
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

interface Order {
  id?: string;
  order_id?: string;
  customer_name?: string;
  customer_email?: string;
  total?: number;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  shipping_address?: string;
  tracking_number?: string;
  carrier?: string;
  stripe_payment_intent_id?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

interface OrderItem {
  product_id: string;
  product_name?: string;
  name?: string;
  quantity: number;
  price: number;
}

interface InventoryItem {
  product_id: string;
  product_name?: string;
  name?: string;
  stock: number;
  quantity?: number;
  updated_at?: string;
}

interface Merchant {
  id?: string;
  merchant_id?: string;
  name: string;
  email?: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface ShippingZone {
  id?: string;
  zone_id?: string;
  name: string;
  countries: string[];
  created_at?: string;
  updated_at?: string;
}

interface ShippingRate {
  id?: string;
  rate_id?: string;
  zone_id: string;
  min_weight: number;
  max_weight?: number;
  price: number;
  currency?: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id?: string;
  category_id?: string;
  name: string;
  description?: string;
  parent_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Variant {
  id?: string;
  variant_id?: string;
  product_id: string;
  sku?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, string>; // { size: 'S', color: 'White' }
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Commerce API 客户端
// ============================================================================

class CommerceApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createAuthenticatedClient(COMMERCE_API_BASE_URL);
  }

  // ==========================================================================
  // 商品管理 (products)
  // ==========================================================================

  products = {
    /**
     * 创建商品
     */
    create: async (data: Partial<Product>): Promise<Product> => {
      const response = await this.client.post<Product>('/api/products', data);
      return response.data;
    },

    /**
     * 商品列表
     */
    list: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
      category_id?: string;
      search?: string;
    }): Promise<{ products: Product[]; total: number }> => {
      const response = await this.client.get<{ items?: Product[]; products?: Product[]; total?: number; pagination?: any }>('/api/products', { params });
      const data = response.data;

      // 处理不同的响应格式
      if (data.items) {
        // 新格式: { items: [...] }
        return {
          products: data.items,
          total: data.total || data.items.length,
        };
      }

      // 旧格式: { products: [...], total: number }
      return {
        products: data.products || [],
        total: data.total || 0,
      };
    },

    /**
     * 商品详情
     */
    get: async (productId: string): Promise<Product> => {
      const response = await this.client.get<Product>(`/api/products/${productId}`);
      return response.data;
    },

    /**
     * 更新商品
     */
    update: async (productId: string, data: Partial<Product>): Promise<Product> => {
      const response = await this.client.put<Product>(`/api/products/${productId}`, data);
      return response.data;
    },

    /**
     * 删除商品（软删除）
     */
    delete: async (productId: string): Promise<void> => {
      await this.client.delete(`/api/products/${productId}`);
    },

    /**
     * 添加商品图片
     */
    addImages: async (productId: string, imagePaths: string[]): Promise<{ images: string[] }> => {
      const formData = new FormData();

      for (const imagePath of imagePaths) {
        formData.append('images', createReadStream(imagePath));
      }

      const response = await this.client.post<{ images: string[] }>(
        `/api/products/${productId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      return response.data;
    },
  };

  // ==========================================================================
  // 订单管理 (orders)
  // ==========================================================================

  orders = {
    /**
     * 商户订单列表
     */
    list: async (params?: {
      limit?: number;
      offset?: number;
      status?: string;
      start_date?: string;
      end_date?: string;
    }): Promise<{ orders: Order[]; total: number }> => {
      const response = await this.client.get<{ items?: Order[]; orders?: Order[]; total?: number; pagination?: any }>('/api/orders/merchant', { params });
      const data = response.data;

      // 处理不同的响应格式
      if (data.items) {
        // 新格式: { items: [...] }
        return {
          orders: data.items,
          total: data.total || data.items.length,
        };
      }

      // 旧格式: { orders: [...], total: number }
      return {
        orders: data.orders || [],
        total: data.total || 0,
      };
    },

    /**
     * 订单详情
     */
    get: async (orderId: string): Promise<Order> => {
      const response = await this.client.get<Order>(`/api/orders/merchant/${orderId}`);
      return response.data;
    },

    /**
     * 标记订单已发货
     */
    ship: async (orderId: string, data: { tracking_number?: string; carrier?: string }): Promise<Order> => {
      const response = await this.client.post<Order>(`/api/orders/merchant/${orderId}/ship`, data);
      return response.data;
    },

    /**
     * 完成订单
     */
    complete: async (orderId: string): Promise<Order> => {
      const response = await this.client.post<Order>(`/api/orders/merchant/${orderId}/complete`);
      return response.data;
    },

    /**
     * 取消订单
     */
    cancel: async (orderId: string, reason?: string): Promise<Order> => {
      const response = await this.client.post<Order>(`/api/orders/merchant/${orderId}/cancel`, { reason });
      return response.data;
    },

    /**
     * 标记已送达
     */
    markDelivered: async (orderId: string): Promise<Order> => {
      const response = await this.client.post<Order>(`/api/orders/merchant/${orderId}/mark-delivered`, {});
      return response.data;
    },
  };

  // ==========================================================================
  // 库存管理 (inventory)
  // ==========================================================================

  inventory = {
    /**
     * 获取低库存商品
     */
    getLowStock: async (threshold?: number): Promise<InventoryItem[]> => {
      const response = await this.client.get<{ items: InventoryItem[] } | InventoryItem[]>('/api/inventory/low-stock', {
        params: { threshold },
      });
      // 处理不同的响应格式
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      return (data as any).items || [];
    },

    /**
     * 调整商品库存
     */
    updateStock: async (productId: string, quantity: number, reason?: string): Promise<InventoryItem> => {
      const response = await this.client.put<InventoryItem>(`/api/inventory/products/${productId}/stock`, {
        quantity,
        reason: reason || 'Manual adjustment',
      });
      return response.data;
    },

    /**
     * 查看库存变更历史
     */
    getHistory: async (productId: string): Promise<any[]> => {
      const response = await this.client.get<any[]>(`/api/inventory/products/${productId}/history`);
      return response.data;
    },

    /**
     * 预留库存（购物车功能）
     */
    reserveStock: async (productId: string, quantity: number): Promise<any> => {
      const response = await this.client.post<any>(`/api/inventory/products/${productId}/reserve`, {
        quantity,
      });
      return response.data;
    },
  };

  // ==========================================================================
  // 商户管理 (merchant)
  // ==========================================================================

  merchant = {
    /**
     * 获取当前商户信息
     */
    getProfile: async (): Promise<Merchant> => {
      const response = await this.client.get<Merchant>('/api/merchants/me');
      return response.data;
    },

    /**
     * 更新商户资料
     */
    updateProfile: async (data: Partial<Merchant>): Promise<Merchant> => {
      const response = await this.client.put<Merchant>('/api/merchants/me', data);
      return response.data;
    },

    /**
     * 初始化 OAuth 用户的商户资料
     */
    setupProfile: async (data: Partial<Merchant>): Promise<Merchant> => {
      const response = await this.client.post<Merchant>('/api/merchants/me', data);
      return response.data;
    },
  };

  // ==========================================================================
  // 物流管理 (shipping)
  // ==========================================================================

  shipping = {
    /**
     * 更新物流状态
     */
    updateShippingStatus: async (
      orderId: string,
      data: { status: string; note?: string }
    ): Promise<any> => {
      const response = await this.client.post<any>(
        `/api/orders/merchant/${orderId}/update-shipping-status`,
        data
      );
      return response.data;
    },

    /**
     * 获取物流历史
     */
    getShippingHistory: async (orderId: string): Promise<any[]> => {
      const response = await this.client.get<any[]>(`/api/orders/merchant/${orderId}/shipping-history`);
      return response.data;
    },

    /**
     * 添加物流备注
     */
    addShippingNote: async (orderId: string, note: string): Promise<any> => {
      const response = await this.client.post<any>(`/api/orders/merchant/${orderId}/add-shipping-note`, {
        note,
      });
      return response.data;
    },

    /**
     * 获取支持的国家列表
     */
    listCountries: async (): Promise<any[]> => {
      const response = await this.client.get<any[]>('/api/shipping/countries');
      return response.data;
    },

    /**
     * 获取当前物流模式
     */
    getMode: async (): Promise<{ mode: 'fixed' | 'easyship' }> => {
      const response = await this.client.get<{ mode: 'fixed' | 'easyship' }>('/api/shipping/mode');
      return response.data;
    },

    /**
     * 切换物流模式
     */
    setMode: async (mode: 'fixed' | 'easyship'): Promise<void> => {
      await this.client.post('/api/shipping/mode', { mode });
    },
  };

  // ==========================================================================
  // 固定运费配置 (shipping-fixed)
  // ==========================================================================

  shippingFixed = {
    /**
     * 获取固定运费全局配置
     */
    getConfig: async (): Promise<any> => {
      const response = await this.client.get<any>('/api/shipping/fixed/config');
      return response.data;
    },

    /**
     * 更新全局配置
     */
    updateConfig: async (data: any): Promise<any> => {
      const response = await this.client.post<any>('/api/shipping/fixed/config', data);
      return response.data;
    },

    /**
     * 计算订单运费
     */
    calculate: async (data: {
      destination_country: string;
      postal_code?: string;
      weight: number;
      items?: any[];
      merchant_id?: string;
    }): Promise<{ shipping_cost: number; currency: string }> => {
      const response = await this.client.post<{ shipping_cost: number; currency: string }>(
        '/api/shipping/fixed/calculate',
        data
      );
      return response.data;
    },

    /**
     * 获取运费区域列表
     */
    listZones: async (): Promise<ShippingZone[]> => {
      const response = await this.client.get<ShippingZone[]>('/api/shipping/fixed/zones');
      return response.data;
    },

    /**
     * 创建运费区域
     */
    createZone: async (data: { name: string; countries: string[] }): Promise<ShippingZone> => {
      const response = await this.client.post<ShippingZone>('/api/shipping/fixed/zones', data);
      return response.data;
    },

    /**
     * 获取运费区域详情
     */
    getZone: async (zoneId: string): Promise<ShippingZone> => {
      const response = await this.client.get<ShippingZone>(`/api/shipping/fixed/zones/${zoneId}`);
      return response.data;
    },

    /**
     * 更新运费区域
     */
    updateZone: async (zoneId: string, data: Partial<ShippingZone>): Promise<ShippingZone> => {
      const response = await this.client.put<ShippingZone>(`/api/shipping/fixed/zones/${zoneId}`, data);
      return response.data;
    },

    /**
     * 删除运费区域
     */
    deleteZone: async (zoneId: string): Promise<void> => {
      await this.client.delete(`/api/shipping/fixed/zones/${zoneId}`);
    },

    /**
     * 获取区域运费费率
     */
    listRates: async (zoneId: string): Promise<ShippingRate[]> => {
      const response = await this.client.get<ShippingRate[]>(`/api/shipping/fixed/zones/${zoneId}/rates`);
      return response.data;
    },

    /**
     * 创建运费费率
     */
    createRate: async (zoneId: string, data: Partial<ShippingRate>): Promise<ShippingRate> => {
      const response = await this.client.post<ShippingRate>(
        `/api/shipping/fixed/zones/${zoneId}/rates`,
        data
      );
      return response.data;
    },

    /**
     * 更新运费费率
     */
    updateRate: async (zoneId: string, rateId: string, data: Partial<ShippingRate>): Promise<ShippingRate> => {
      const response = await this.client.put<ShippingRate>(
        `/api/shipping/fixed/zones/${zoneId}/rates/${rateId}`,
        data
      );
      return response.data;
    },

    /**
     * 删除运费费率
     */
    deleteRate: async (zoneId: string, rateId: string): Promise<void> => {
      await this.client.delete(`/api/shipping/fixed/zones/${zoneId}/rates/${rateId}`);
    },
  };

  // ==========================================================================
  // 对话管理 (conversations)
  // ==========================================================================

  conversations = {
    /**
     * 获取对话列表（商户收件箱）
     */
    list: async (params?: { limit?: number; offset?: number }): Promise<any[]> => {
      const response = await this.client.get<any[]>('/api/conversations', { params });
      return response.data;
    },

    /**
     * 获取对话详情
     */
    get: async (conversationId: string): Promise<any> => {
      const response = await this.client.get<any>(`/api/conversations/${conversationId}`);
      return response.data;
    },

    /**
     * 获取对话上下文
     */
    getContext: async (conversationId: string): Promise<any> => {
      const response = await this.client.get<any>(`/api/conversations/${conversationId}/context`);
      return response.data;
    },

    /**
     * 获取对话消息列表
     */
    listMessages: async (conversationId: string): Promise<any[]> => {
      const response = await this.client.get<any[]>(`/api/conversations/${conversationId}/messages`);
      return response.data;
    },

    /**
     * 标记消息已读
     */
    markRead: async (conversationId: string): Promise<void> => {
      await this.client.post(`/api/conversations/${conversationId}/messages/mark-read`);
    },
  };

  // ==========================================================================
  // 分类管理 (categories)
  // ==========================================================================

  categories = {
    /**
     * 获取分类列表
     */
    list: async (): Promise<Category[]> => {
      const response = await this.client.get<{ items?: Category[]; categories?: Category[] } | Category[]>('/api/categories');
      const data = response.data;

      // 处理不同的响应格式
      if (Array.isArray(data)) {
        return data;
      }
      if ((data as any).items) {
        return (data as any).items;
      }
      if ((data as any).categories) {
        return (data as any).categories;
      }
      return [];
    },

    /**
     * 创建分类
     */
    create: async (data: Partial<Category>): Promise<Category> => {
      const response = await this.client.post<Category>('/api/categories', data);
      return response.data;
    },

    /**
     * 获取分类详情
     */
    get: async (categoryId: string): Promise<Category> => {
      const response = await this.client.get<Category>(`/api/categories/${categoryId}`);
      return response.data;
    },

    /**
     * 更新分类
     */
    update: async (categoryId: string, data: Partial<Category>): Promise<Category> => {
      const response = await this.client.put<Category>(`/api/categories/${categoryId}`, data);
      return response.data;
    },

    /**
     * 删除分类
     */
    delete: async (categoryId: string): Promise<void> => {
      await this.client.delete(`/api/categories/${categoryId}`);
    },
  };

  // ==========================================================================
  // 商品变体 (variants)
  // ==========================================================================

  variants = {
    /**
     * 获取商品变体列表
     */
    list: async (productId: string): Promise<Variant[]> => {
      const response = await this.client.get<{ items?: Variant[]; variants?: Variant[] } | Variant[]>(`/api/products/${productId}/variants`);
      const data = response.data;

      // 处理不同的响应格式
      if (Array.isArray(data)) {
        return data;
      }
      if ((data as any).items) {
        return (data as any).items;
      }
      if ((data as any).variants) {
        return (data as any).variants;
      }
      return [];
    },

    /**
     * 搜索商品变体
     */
    search: async (productId: string, criteria: any): Promise<Variant[]> => {
      const response = await this.client.post<Variant[]>(`/api/products/${productId}/variants/search`, criteria);
      return response.data;
    },

    /**
     * 创建商品变体
     */
    create: async (productId: string, data: Partial<Variant>): Promise<Variant> => {
      const response = await this.client.post<Variant>(`/api/products/${productId}/variants`, data);
      return response.data;
    },

    /**
     * 获取变体详情
     */
    get: async (productId: string, variantId: string): Promise<Variant> => {
      const response = await this.client.get<Variant>(`/api/products/${productId}/variants/${variantId}`);
      return response.data;
    },

    /**
     * 更新变体
     */
    update: async (productId: string, variantId: string, data: Partial<Variant>): Promise<Variant> => {
      const response = await this.client.put<Variant>(
        `/api/products/${productId}/variants/${variantId}`,
        data
      );
      return response.data;
    },

    /**
     * 删除变体
     */
    delete: async (productId: string, variantId: string): Promise<void> => {
      await this.client.delete(`/api/products/${productId}/variants/${variantId}`);
    },

    /**
     * 添加变体图片
     */
    addImages: async (masterId: string, variantId: string, imagePaths: string[]): Promise<{ images: string[] }> => {
      const formData = new FormData();

      for (const imagePath of imagePaths) {
        formData.append('images', createReadStream(imagePath));
      }

      const response = await this.client.post<{ images: string[] }>(
        `/api/products/${masterId}/variants/${variantId}/images`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );
      return response.data;
    },
  };

  // ==========================================================================
  // 退款管理 (refunds)
  // ==========================================================================

  refunds = {
    /**
     * 创建退款
     */
    create: async (data: { payment_intent_id: string; amount: number; reason?: string }): Promise<any> => {
      const response = await this.client.post<any>('/api/refunds/create', data);
      return response.data;
    },

    /**
     * 获取退款详情
     */
    get: async (refundId: string): Promise<any> => {
      const response = await this.client.get<any>(`/api/refunds/${refundId}`);
      return response.data;
    },
  };

  // ==========================================================================
  // 文件上传 (upload)
  // ==========================================================================

  upload = {
    /**
     * 上传图片
     */
    uploadImage: async (imagePath: string): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('image', createReadStream(imagePath));

      const response = await this.client.post<{ url: string }>('/api/upload/image', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return response.data;
    },

    /**
     * 上传视频
     */
    uploadVideo: async (videoPath: string): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('video', createReadStream(videoPath));

      const response = await this.client.post<{ url: string }>('/api/upload/video', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return response.data;
    },

    /**
     * 上传文件
     */
    uploadFile: async (filePath: string): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append('file', createReadStream(filePath));

      const response = await this.client.post<{ url: string }>('/api/upload/file', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return response.data;
    },
  };
}

// 导出单例实例
export const commerceApi = new CommerceApiClient();

// 导出类型
export type {
  Product,
  Order,
  OrderItem,
  InventoryItem,
  Merchant,
  ShippingZone,
  ShippingRate,
  Category,
  Variant,
};
