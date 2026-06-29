import { SettingGroup, SettingValueType } from '../../models/system-setting.model';

export interface DefaultSetting {
  key: string;
  label: string;
  group: SettingGroup;
  value: string | number | boolean;
  valueType: SettingValueType;
  description?: string;
  isPublic: boolean;
}

export const DEFAULT_SYSTEM_SETTINGS: DefaultSetting[] = [
  {
    key: 'store_name',
    label: 'Store name',
    group: 'general',
    value: 'Mini Mart',
    valueType: 'string',
    description: 'Display name of the system',
    isPublic: true,
  },
  {
    key: 'hotline',
    label: 'Hotline',
    group: 'general',
    value: '1900 0000',
    valueType: 'string',
    isPublic: true,
  },
  {
    key: 'support_email',
    label: 'Support email',
    group: 'general',
    value: 'support@minimart.com',
    valueType: 'string',
    isPublic: true,
  },
  {
    key: 'maintenance_mode',
    label: 'Maintenance mode',
    group: 'general',
    value: false,
    valueType: 'boolean',
    description: 'When enabled, the storefront may show a maintenance notice',
    isPublic: true,
  },
  {
    key: 'min_order_amount',
    label: 'Minimum order amount',
    group: 'order',
    value: 50000,
    valueType: 'number',
    description: 'Minimum order value in VND',
    isPublic: true,
  },
  {
    key: 'order_cancel_timeout_minutes',
    label: 'Order cancel timeout',
    group: 'order',
    value: 30,
    valueType: 'number',
    description: 'Minutes before a pending order can be auto-cancelled',
    isPublic: false,
  },
  {
    key: 'free_shipping_threshold',
    label: 'Free shipping threshold',
    group: 'delivery',
    value: 200000,
    valueType: 'number',
    description: 'Order amount in VND for free shipping',
    isPublic: true,
  },
  {
    key: 'default_delivery_fee',
    label: 'Default delivery fee',
    group: 'delivery',
    value: 15000,
    valueType: 'number',
    description: 'Default delivery fee in VND',
    isPublic: true,
  },
  {
    key: 'low_stock_threshold',
    label: 'Low stock threshold',
    group: 'inventory',
    value: 10,
    valueType: 'number',
    description: 'Quantity at which low-stock alerts are triggered',
    isPublic: false,
  },
  {
    key: 'vat_rate',
    label: 'VAT rate',
    group: 'payment',
    value: 10,
    valueType: 'number',
    description: 'VAT percentage applied to orders',
    isPublic: true,
  },
  // ── Loyalty / Membership thresholds ──────────────────────────────────────
  {
    key: 'loyalty_points_per_10k',
    label: 'Điểm thưởng mỗi 10.000đ',
    group: 'loyalty',
    value: 1,
    valueType: 'number',
    description: 'Số điểm tích lũy khách nhận được cho mỗi 10.000 VND thanh toán',
    isPublic: true,
  },
  {
    key: 'loyalty_bronze_threshold',
    label: 'Ngưỡng hạng Đồng (Bronze)',
    group: 'loyalty',
    value: 100,
    valueType: 'number',
    description: 'Số điểm tích lũy trọn đời tối thiểu để đạt hạng Đồng',
    isPublic: true,
  },
  {
    key: 'loyalty_silver_threshold',
    label: 'Ngưỡng hạng Bạc (Silver)',
    group: 'loyalty',
    value: 300,
    valueType: 'number',
    description: 'Số điểm tích lũy trọn đời tối thiểu để đạt hạng Bạc',
    isPublic: true,
  },
  {
    key: 'loyalty_gold_threshold',
    label: 'Ngưỡng hạng Vàng (Gold)',
    group: 'loyalty',
    value: 600,
    valueType: 'number',
    description: 'Số điểm tích lũy trọn đời tối thiểu để đạt hạng Vàng',
    isPublic: true,
  },
  {
    key: 'loyalty_diamond_threshold',
    label: 'Ngưỡng hạng Kim Cương (Diamond)',
    group: 'loyalty',
    value: 1000,
    valueType: 'number',
    description: 'Số điểm tích lũy trọn đời tối thiểu để đạt hạng Kim Cương',
    isPublic: true,
  },
];

