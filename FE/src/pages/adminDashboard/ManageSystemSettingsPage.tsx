import { useEffect, useState, useCallback } from 'react'
import {
  Store,
  ShoppingBag,
  Truck,
  CreditCard,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Info,
  Star,
} from 'lucide-react'
import { systemSettingService } from '@/services/systemSettingService'
import type { SystemSetting, SettingGroup } from '@/types'

// ─── Group metadata ──────────────────────────────────────────────────────────
type GroupMeta = {
  key: SettingGroup
  label: string
  description: string
  icon: React.ReactNode
  color: string
  iconBg: string
}

const GROUP_META: GroupMeta[] = [
  {
    key: 'general',
    label: 'Thông tin chung',
    description: 'Tên cửa hàng, hotline, email hỗ trợ và chế độ bảo trì',
    icon: <Store size={20} />,
    color: 'text-primary',
    iconBg: 'bg-primary-container text-on-primary-container',
  },
  {
    key: 'order',
    label: 'Đơn hàng',
    description: 'Giá trị đơn tối thiểu và thời gian timeout hủy đơn',
    icon: <ShoppingBag size={20} />,
    color: 'text-blue-600',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    key: 'delivery',
    label: 'Giao hàng',
    description: 'Ngưỡng miễn phí giao hàng và phí giao hàng mặc định',
    icon: <Truck size={20} />,
    color: 'text-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    key: 'payment',
    label: 'Thanh toán',
    description: 'Thuế VAT áp dụng trên đơn hàng',
    icon: <CreditCard size={20} />,
    color: 'text-purple-600',
    iconBg: 'bg-purple-100 text-purple-600',
  },
  {
    key: 'loyalty',
    label: 'Điểm thưởng & Hạng thành viên',
    description: 'Mốc điểm phân hạng Đồng / Bạc / Vàng / Kim cương',
    icon: <Star size={20} />,
    color: 'text-yellow-600',
    iconBg: 'bg-yellow-100 text-yellow-600',
  },
]

// ─── Value unit labels ───────────────────────────────────────────────────────
const UNIT_LABELS: Record<string, string> = {
  min_order_amount: 'VND',
  free_shipping_threshold: 'VND',
  default_delivery_fee: 'VND',
  vat_rate: '%',
  order_cancel_timeout_minutes: 'phút',
  loyalty_bronze_threshold: 'điểm',
  loyalty_silver_threshold: 'điểm',
  loyalty_gold_threshold: 'điểm',
  loyalty_diamond_threshold: 'điểm',
  loyalty_points_per_10k: 'điểm / 10.000đ',
}

// ─── Format VND helper ───────────────────────────────────────────────────────
const formatVND = (val: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

// ─── Toggle Switch component ─────────────────────────────────────────────────
const ToggleSwitch = ({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  id: string
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      checked ? 'bg-primary' : 'bg-surface-container-high'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
)

// ─── Main Page ───────────────────────────────────────────────────────────────
export const ManageSystemSettingsPage = () => {
  const [groups, setGroups] = useState<Partial<Record<SettingGroup, SystemSetting[]>>>({})
  const [localValues, setLocalValues] = useState<Record<string, string | number | boolean>>({})
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettingGroup>('general')

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await systemSettingService.getSettingsByGroup()
      if (res.success && res.data?.groups) {
        setGroups(res.data.groups)
        // Initialize local values from fetched data
        const initialValues: Record<string, string | number | boolean> = {}
        for (const settings of Object.values(res.data.groups)) {
          for (const s of settings) {
            initialValues[s.key] = s.value
          }
        }
        setLocalValues(initialValues)
        setDirtyKeys(new Set())
      } else {
        setError(res.message || 'Không thể tải cài đặt hệ thống.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleValueChange = (key: string, value: string | number | boolean) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }))
    setDirtyKeys((prev) => new Set(prev).add(key))
    setSuccessMsg(null)
  }

  const handleSave = async () => {
    if (dirtyKeys.size === 0) return
    try {
      setSaving(true)
      setError(null)
      setSuccessMsg(null)

      const payload = Array.from(dirtyKeys).map((key) => ({
        key,
        value: localValues[key],
      }))

      const res = await systemSettingService.bulkUpdate(payload)
      if (res.success) {
        setDirtyKeys(new Set())
        setSuccessMsg(`Đã lưu ${payload.length} cài đặt thành công!`)
        // Refresh to sync server state
        await fetchSettings()
        setTimeout(() => setSuccessMsg(null), 4000)
      } else {
        setError(res.message || 'Không thể lưu cài đặt.')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to original fetched values
    fetchSettings()
  }

  const activeGroup = GROUP_META.find((g) => g.key === activeTab)!
  const activeSettings = groups[activeTab] ?? []

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Quản trị hệ thống</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Cài đặt hệ thống
          </h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Quản lý các thông số vận hành của hệ thống. Chỉ Admin mới có quyền thay đổi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {dirtyKeys.size > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm font-bold text-on-surface-variant transition hover:bg-surface-container-high"
            >
              <RefreshCw size={15} />
              Hủy thay đổi
            </button>
          )}
          <button
            id="system-settings-save-btn"
            type="button"
            onClick={handleSave}
            disabled={saving || dirtyKeys.size === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save size={15} />
            )}
            {saving ? 'Đang lưu...' : `Lưu thay đổi${dirtyKeys.size > 0 ? ` (${dirtyKeys.size})` : ''}`}
          </button>
        </div>
      </section>

      {/* ── Status banners ── */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-error/20 bg-error-container/20 px-4 py-3 text-sm font-bold text-error">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-on-surface-variant">Đang tải cài đặt hệ thống...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* ── Group Tab Sidebar ── */}
          <nav className="space-y-1">
            {GROUP_META.map((group) => {
              const settings = groups[group.key] ?? []
              const dirtyCount = settings.filter((s) => dirtyKeys.has(s.key)).length
              const isActive = activeTab === group.key
              return (
                <button
                  key={group.key}
                  type="button"
                  onClick={() => setActiveTab(group.key)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                      isActive ? 'bg-white/40' : group.iconBg
                    }`}
                  >
                    {group.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{group.label}</span>
                    <span className="block text-xs opacity-70">{settings.length} cài đặt</span>
                  </span>
                  {dirtyCount > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-black text-white">
                      {dirtyCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* ── Settings Panel ── */}
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
            {/* Panel header */}
            <div className={`flex items-center gap-4 border-b border-outline-variant px-6 py-5`}>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${activeGroup.iconBg}`}>
                {activeGroup.icon}
              </div>
              <div>
                <h2 className="text-lg font-black text-on-surface">{activeGroup.label}</h2>
                <p className="text-xs text-on-surface-variant">{activeGroup.description}</p>
              </div>
            </div>

            {/* Settings rows */}
            <div className="divide-y divide-outline-variant/50">
              {activeSettings.length === 0 ? (
                <div className="py-16 text-center text-sm text-on-surface-variant">
                  Không có cài đặt nào trong nhóm này.
                </div>
              ) : (
                activeSettings.map((setting) => {
                  const isDirty = dirtyKeys.has(setting.key)
                  const unit = UNIT_LABELS[setting.key]
                  const currentValue = localValues[setting.key] ?? setting.value

                  return (
                    <div
                      key={setting.key}
                      className={`flex flex-col gap-4 px-6 py-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                        isDirty ? 'bg-amber-50/40' : 'hover:bg-surface-container-low/50'
                      }`}
                    >
                      {/* Setting info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`setting-${setting.key}`}
                            className="text-sm font-bold text-on-surface cursor-pointer"
                          >
                            {setting.label}
                          </label>
                          {isDirty && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-700">
                              Đã thay đổi
                            </span>
                          )}
                          {setting.isPublic && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700 border border-emerald-500/20">
                              Public
                            </span>
                          )}
                        </div>
                        {setting.description && (
                          <p className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <Info size={11} className="shrink-0 opacity-60" />
                            {setting.description}
                          </p>
                        )}
                        <code className="text-[10px] font-mono text-on-surface-variant/60">
                          {setting.key}
                        </code>
                      </div>

                      {/* Setting input */}
                      <div className="flex items-center gap-3 shrink-0">
                        {setting.valueType === 'boolean' ? (
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold ${currentValue ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {currentValue ? 'Đang bật' : 'Đang tắt'}
                            </span>
                            <ToggleSwitch
                              id={`setting-${setting.key}`}
                              checked={Boolean(currentValue)}
                              onChange={(v) => handleValueChange(setting.key, v)}
                            />
                          </div>
                        ) : setting.valueType === 'number' ? (
                          <div className="flex items-center gap-2">
                            <input
                              id={`setting-${setting.key}`}
                              type="number"
                              min={0}
                              value={String(currentValue)}
                              onChange={(e) =>
                                handleValueChange(setting.key, parseFloat(e.target.value) || 0)
                              }
                              className={`w-36 rounded-xl border py-2 px-3 text-right text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                                isDirty
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 focus:border-amber-400'
                                  : 'border-outline-variant bg-surface-container-low text-on-surface focus:border-primary/40'
                              }`}
                            />
                            {unit && (
                              <span className="shrink-0 whitespace-nowrap text-xs font-bold text-on-surface-variant">
                                {unit}
                              </span>
                            )}
                          </div>
                        ) : (
                          <input
                            id={`setting-${setting.key}`}
                            type="text"
                            value={String(currentValue)}
                            onChange={(e) => handleValueChange(setting.key, e.target.value)}
                            className={`w-56 rounded-xl border py-2 px-3 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                              isDirty
                                ? 'border-amber-400 bg-amber-50 text-amber-900 focus:border-amber-400'
                                : 'border-outline-variant bg-surface-container-low text-on-surface focus:border-primary/40'
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Panel footer */}
            {activeTab === 'loyalty' ? (
              /* ── Tier hierarchy preview ── */
              <div className="border-t border-outline-variant/50 bg-gradient-to-br from-yellow-50/60 to-amber-50/40 px-6 py-5">
                <p className="mb-3 text-xs font-black uppercase tracking-wide text-amber-700">
                  🏆 Xem trước phân hạng (dựa theo giá trị hiện tại)
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      key: 'loyalty_bronze_threshold',
                      label: 'Đồng',
                      emoji: '🥉',
                      from: 0,
                      color: 'from-orange-200 to-amber-300',
                      text: 'text-amber-800',
                      border: 'border-amber-300',
                    },
                    {
                      key: 'loyalty_silver_threshold',
                      label: 'Bạc',
                      emoji: '🥈',
                      from: 0,
                      color: 'from-slate-200 to-gray-300',
                      text: 'text-slate-700',
                      border: 'border-slate-300',
                    },
                    {
                      key: 'loyalty_gold_threshold',
                      label: 'Vàng',
                      emoji: '🥇',
                      from: 0,
                      color: 'from-yellow-300 to-amber-400',
                      text: 'text-yellow-900',
                      border: 'border-yellow-400',
                    },
                    {
                      key: 'loyalty_diamond_threshold',
                      label: 'Kim Cương',
                      emoji: '💎',
                      from: 0,
                      color: 'from-sky-200 to-indigo-300',
                      text: 'text-indigo-800',
                      border: 'border-indigo-300',
                    },
                  ].map((tier, idx, arr) => {
                    const minPts = Number(localValues[tier.key] ?? 0)
                    const nextKey = arr[idx + 1]?.key
                    const maxPts = nextKey ? Number(localValues[nextKey] ?? '∞') - 1 : null
                    return (
                      <div
                        key={tier.key}
                        className={`rounded-xl border bg-gradient-to-br ${tier.color} ${tier.border} p-3 text-center shadow-sm`}
                      >
                        <div className="text-2xl mb-1">{tier.emoji}</div>
                        <div className={`text-sm font-black ${tier.text}`}>{tier.label}</div>
                        <div className={`mt-1 text-[11px] font-bold ${tier.text} opacity-80`}>
                          ≥ {minPts.toLocaleString('vi-VN')} điểm
                        </div>
                        {maxPts !== null && (
                          <div className={`text-[10px] ${tier.text} opacity-60`}>
                            đến {maxPts.toLocaleString('vi-VN')} điểm
                          </div>
                        )}
                        {maxPts === null && (
                          <div className={`text-[10px] ${tier.text} opacity-60`}>Hạng cao nhất</div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-[10px] text-amber-700/70 italic">
                  * Hạng thành viên được tính theo điểm tích lũy trọn đời (lifetime points), không bị trừ khi dùng điểm.
                </p>
              </div>
            ) : activeSettings.some(
              (s) => s.valueType === 'number' && UNIT_LABELS[s.key] === 'VND'
            ) ? (
              <div className="border-t border-outline-variant/50 bg-surface-container-low px-6 py-3">
                <p className="text-[11px] text-on-surface-variant font-medium">
                  💡 Xem trước:&nbsp;
                  {activeSettings
                    .filter((s) => s.valueType === 'number' && UNIT_LABELS[s.key] === 'VND')
                    .map((s) => (
                      <span key={s.key} className="mr-3">
                        <strong>{s.label}</strong>:{' '}
                        {formatVND(Number(localValues[s.key] ?? s.value))}
                      </span>
                    ))}
                </p>
              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* ── Unsaved changes reminder ── */}
      {dirtyKeys.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-50 px-5 py-3 shadow-lg">
          <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <span className="text-sm font-bold text-amber-800">
            Có {dirtyKeys.size} thay đổi chưa lưu
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="ml-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            Lưu ngay
          </button>
        </div>
      )}
    </div>
  )
}
