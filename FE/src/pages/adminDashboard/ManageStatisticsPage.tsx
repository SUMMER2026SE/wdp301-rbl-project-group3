import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Users,
  Building2,
  Calendar,
  Layers,
  AlertTriangle,
  Award,
  RefreshCw,
  Clock,
  Tag
} from 'lucide-react'
import { statisticsService } from '@services/statisticsService'
import { branchService } from '@services/branchService'
import { useAuth } from '@hooks/useAuth'
import type { Branch } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManageStatisticsPage = () => {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.role === 'admin'

  // Filter States
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')
  const [groupBy, setGroupBy] = useState<'day' | 'month'>('day')
  const [presetRange, setPresetRange] = useState<string>('30days')
  
  // Date states
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')

  // Data States
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [adminData, setAdminData] = useState<any | null>(null)
  const [branchData, setBranchData] = useState<any | null>(null)

  // Hover states for custom chart tooltips
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null)
  const [hoveredBar, setHoveredBar] = useState<{ x: number; y: number; label: string; value: string } | null>(null)

  // Resolve branch name for branch manager
  const managerBranchName = useMemo(() => {
    if (!user?.branchId || branches.length === 0) return 'Đang tải...'
    const branch = branches.find(b => b._id === user.branchId)
    return branch ? branch.name : 'Chi nhánh liên kết'
  }, [user?.branchId, branches])

  // Fetch active branches on mount for admin dropdown selection and manager branch name resolution
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await branchService.getBranches()
        if (res.success) {
          setBranches(res.data.filter((b) => b.status === 'active'))
        }
      } catch (err) {
        console.error('Failed to load branches:', err)
      }
    }
    fetchBranches()
  }, [])

  // Sync date range presets
  useEffect(() => {
    const today = new Date()
    let start = new Date()

    if (presetRange === 'today') {
      // Start is today
    } else if (presetRange === '7days') {
      start.setDate(today.getDate() - 7)
    } else if (presetRange === '30days') {
      start.setDate(today.getDate() - 30)
    } else if (presetRange === 'custom') {
      return // keep custom dates
    }

    setFromDate(start.toISOString().split('T')[0])
    setToDate(today.toISOString().split('T')[0])
  }, [presetRange])

  // Fetch Dashboard statistics data based on filters and roles
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      setAdminData(null)
      setBranchData(null)

      const params: any = {}
      if (fromDate) params.from = fromDate
      if (toDate) params.to = toDate
      if (groupBy) params.groupBy = groupBy

      if (isAdmin && !selectedBranchId) {
        // Admin overview dashboard
        const res = await statisticsService.getAdminDashboard(params)
        if (res.success) {
          setAdminData(res.data)
        } else {
          setError(res.message || 'Không thể lấy dữ liệu thống kê tổng hợp.')
        }
      } else {
        // Branch manager or specific branch selected by Admin
        const branchParam = selectedBranchId || user?.branchId
        if (branchParam) {
          params.branchId = branchParam
        }
        const res = await statisticsService.getBranchDashboard(params)
        if (res.success) {
          setBranchData(res.data)
        } else {
          setError(res.message || 'Không thể lấy dữ liệu thống kê chi nhánh.')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  // Load statistics when date filters, groupBy, branch or presets change
  useEffect(() => {
    if (authLoading || !user) return

    if (fromDate && toDate) {
      loadDashboardData()
    }
  }, [selectedBranchId, fromDate, toDate, groupBy, user, authLoading])

  // Calculate dynamic stats
  const kpis = useMemo(() => {
    if (adminData) {
      const { cards } = adminData
      return [
        {
          label: 'Doanh thu hệ thống',
          value: formatVND(cards.totalRevenue),
          desc: 'Tổng số tiền bán hàng',
          icon: DollarSign,
          color: 'text-primary bg-primary/10 border-primary/20'
        },
        {
          label: 'Tổng đơn hàng',
          value: cards.totalOrders.toLocaleString('vi-VN'),
          desc: `Giá trị trung bình: ${formatVND(cards.totalOrders > 0 ? cards.totalRevenue / cards.totalOrders : 0)}`,
          icon: ShoppingBag,
          color: 'text-secondary bg-secondary/10 border-secondary/20'
        },
        {
          label: 'Tổng giá trị kho',
          value: formatVND(cards.totalInventoryValue),
          desc: `Số lượng hàng: ${cards.totalInventoryQuantity.toLocaleString('vi-VN')} món`,
          icon: Layers,
          color: 'text-tertiary bg-tertiary/10 border-tertiary/20'
        },
        {
          label: 'Khách hàng thân thiết',
          value: cards.totalCustomers.toLocaleString('vi-VN'),
          desc: `Mạng lưới: ${cards.totalBranches} siêu thị`,
          icon: Users,
          color: 'text-success bg-success/10 border-success/20'
        }
      ]
    } else if (branchData) {
      const { cards } = branchData
      return [
        {
          label: 'Doanh thu chi nhánh',
          value: formatVND(cards.totalRevenue),
          desc: 'Doanh số bán lẻ tại quầy & online',
          icon: DollarSign,
          color: 'text-primary bg-primary/10 border-primary/20'
        },
        {
          label: 'Số lượng đơn hàng',
          value: cards.totalOrders.toLocaleString('vi-VN'),
          desc: `Bình quân đơn: ${formatVND(cards.totalOrders > 0 ? cards.totalRevenue / cards.totalOrders : 0)}`,
          icon: ShoppingBag,
          color: 'text-secondary bg-secondary/10 border-secondary/20'
        },
        {
          label: 'Giá trị tồn kho',
          value: formatVND(cards.totalInventoryValue),
          desc: `Tồn kho: ${cards.totalInventoryQuantity.toLocaleString('vi-VN')} sản phẩm`,
          icon: Layers,
          color: 'text-tertiary bg-tertiary/10 border-tertiary/20'
        },
        {
          label: 'Khách hàng đã phục vụ',
          value: cards.totalCustomers.toLocaleString('vi-VN'),
          desc: `Đội ngũ: ${cards.totalStaff} nhân sự`,
          icon: Users,
          color: 'text-success bg-success/10 border-success/20'
        }
      ]
    }
    return []
  }, [adminData, branchData])

  const chartData = useMemo(() => {
    if (adminData) return adminData.charts
    if (branchData) return branchData.charts
    return null
  }, [adminData, branchData])

  const topLists = useMemo(() => {
    if (adminData) return adminData.lists
    if (branchData) return branchData.lists
    return null
  }, [adminData, branchData])

  // Custom SVG Area Chart calculation
  const areaChartSvgPoints = useMemo(() => {
    if (!chartData?.revenueTrend?.data || chartData.revenueTrend.data.length === 0) return null

    const data: Array<{ _id: string; totalRevenue: number; orderCount: number }> = chartData.revenueTrend.data
    const maxVal = Math.max(...data.map(d => d.totalRevenue), 1)
    
    // Width and height of viewbox
    const w = 600
    const h = 220
    const paddingLeft = 60
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 40
    
    const chartW = w - paddingLeft - paddingRight
    const chartH = h - paddingTop - paddingBottom

    const points = data.map((item, index) => {
      const x = paddingLeft + (index / (data.length - 1 || 1)) * chartW
      const y = h - paddingBottom - (item.totalRevenue / maxVal) * chartH
      return { x, y, label: item._id, value: formatVND(item.totalRevenue), orders: item.orderCount }
    })

    // Construct path commands
    let pathD = ''
    let fillD = ''

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`
      }
      fillD = `${pathD} L ${points[points.length - 1].x} ${h - paddingBottom} L ${points[0].x} ${h - paddingBottom} Z`
    }

    return { points, pathD, fillD, w, h, paddingLeft, paddingRight, paddingTop, paddingBottom, chartW, chartH, maxVal }
  }, [chartData])

  // Custom SVG Bar Chart calculation for Branch Revenue comparison
  const barChartSvgPoints = useMemo(() => {
    if (!chartData?.revenueByBranch || chartData.revenueByBranch.length === 0) return null

    const data: Array<{ _id: string; branchName: string; totalRevenue: number; orderCount: number }> = chartData.revenueByBranch
    const maxVal = Math.max(...data.map(d => d.totalRevenue), 1)
    
    const w = 600
    const h = 220
    const paddingLeft = 60
    const paddingRight = 20
    const paddingTop = 20
    const paddingBottom = 40
    
    const chartW = w - paddingLeft - paddingRight
    const chartH = h - paddingTop - paddingBottom
    const barWidth = Math.min(30, (chartW / data.length) * 0.5)

    const bars = data.map((item, index) => {
      const centerX = paddingLeft + (index / (data.length || 1)) * chartW + (chartW / (data.length * 2))
      const x = centerX - barWidth / 2
      const barH = (item.totalRevenue / maxVal) * chartH
      const y = h - paddingBottom - barH
      return {
        x,
        y,
        width: barWidth,
        height: barH,
        label: item.branchName || 'Chi nhánh ẩn',
        value: formatVND(item.totalRevenue),
        orders: item.orderCount
      }
    })

    return { bars, w, h, paddingLeft, paddingRight, paddingTop, paddingBottom, chartW, chartH, maxVal }
  }, [chartData])

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary font-mono">Back-Office</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl flex items-center gap-2">
            <TrendingUp size={28} className="text-primary" />
            Báo cáo & Thống kê Quản trị
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Theo dõi chi tiết hiệu suất kinh doanh, tồn kho và tăng trưởng hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container-highest transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer border border-outline-variant/30"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Làm mới số liệu
        </button>
      </section>

      {/* ── FILTER CONTROLS BAR ── */}
      <section className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          {/* Branch Dropdown selector (only for Admin) */}
          {isAdmin ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                <Building2 size={13} className="text-primary" />
                Chọn chi nhánh
              </label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full bg-surface-container-low border border-outline rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-semibold transition-all"
              >
                <option value="">Toàn bộ hệ thống</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5 bg-surface-container-low/40 p-2.5 rounded-xl border border-outline-variant/30">
              <p className="text-[10px] font-black text-primary uppercase">Chi nhánh phụ trách</p>
              <p className="text-sm font-bold text-on-surface mt-0.5">
                {managerBranchName}
              </p>
            </div>
          )}

          {/* Date range presets selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <Calendar size={13} className="text-primary" />
              Khoảng thời gian nhanh
            </label>
            <select
              value={presetRange}
              onChange={(e) => setPresetRange(e.target.value)}
              className="w-full bg-surface-container-low border border-outline rounded-xl py-2 px-3 focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-semibold transition-all"
            >
              <option value="today">Hôm nay</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="custom">Tùy chọn...</option>
            </select>
          </div>

          {/* GroupBy option */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
              <Clock size={13} className="text-primary" />
              Gom nhóm số liệu
            </label>
            <div className="grid grid-cols-2 gap-1 bg-surface-container-low p-1 rounded-xl border border-outline">
              {(['day', 'month'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGroupBy(mode)}
                  className={`py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                    groupBy === mode
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {mode === 'day' ? 'Ngày' : 'Tháng'}
                </button>
              ))}
            </div>
          </div>

          {/* Date range view/manual filter */}
          {presetRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant">Từ ngày</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl py-1.5 px-2 text-xs focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-on-surface-variant">Đến ngày</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl py-1.5 px-2 text-xs focus:ring-1 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── ERROR MESSAGE ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-container text-on-error-container rounded-2xl border border-error/20">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* ── KPIS CARDS ── */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant animate-pulse h-28" />
          ))}
        </div>
      ) : kpis.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <div
                key={idx}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all hover:shadow"
              >
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-bold text-on-surface-variant tracking-wide block">{kpi.label}</span>
                  <span className="text-2xl font-black text-on-surface block tracking-tight truncate">
                    {kpi.value}
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-medium block truncate">
                    {kpi.desc}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${kpi.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* ── CHARTS BLOCK ── */}
      {!loading && chartData && (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          {/* Revenue Trend Area Chart */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4 relative">
            <div>
              <h3 className="text-sm font-black text-on-surface">Xu hướng doanh thu</h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5">Biểu đồ biểu diễn tổng giá trị bán hàng theo thời gian</p>
            </div>

            {areaChartSvgPoints && areaChartSvgPoints.points.length > 0 ? (
              <div className="relative">
                <svg
                  viewBox={`0 0 ${areaChartSvgPoints.w} ${areaChartSvgPoints.h}`}
                  className="w-full h-64 overflow-visible"
                >
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6750A4" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6750A4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                    const y = areaChartSvgPoints.paddingTop + r * areaChartSvgPoints.chartH
                    const val = areaChartSvgPoints.maxVal * (1 - r)
                    return (
                      <g key={idx} className="opacity-20">
                        <line
                          x1={areaChartSvgPoints.paddingLeft}
                          y1={y}
                          x2={areaChartSvgPoints.w - areaChartSvgPoints.paddingRight}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="4 4"
                          strokeWidth={1}
                        />
                        <text
                          x={areaChartSvgPoints.paddingLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          fontSize="9"
                          fontWeight="bold"
                          className="fill-on-surface-variant font-mono"
                        >
                          {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                        </text>
                      </g>
                    )
                  })}

                  {/* Filled area */}
                  <path d={areaChartSvgPoints.fillD} fill="url(#areaGradient)" />

                  {/* Line path */}
                  <path
                    d={areaChartSvgPoints.pathD}
                    fill="none"
                    stroke="#6750A4"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Interactive points */}
                  {areaChartSvgPoints.points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint?.label === pt.label ? 6 : 4}
                      className="fill-primary stroke-white stroke-2 cursor-pointer hover:fill-primary-fixed-dim transition-all"
                      onMouseEnter={(e) => {
                        const target = e.target as SVGCircleElement;
                        const rect = target.getBoundingClientRect();
                        setHoveredPoint({
                          x: rect.left + window.scrollX - 70,
                          y: rect.top + window.scrollY - 75,
                          label: pt.label,
                          value: pt.value
                        });
                      }}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>

                {/* SVG Label Axis X */}
                <div className="flex justify-between pl-[60px] pr-[20px] text-[9px] font-bold text-on-surface-variant/75 font-mono">
                  {areaChartSvgPoints.points.filter((_, i, arr) => i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1).map((pt, idx) => (
                    <span key={idx}>{pt.label}</span>
                  ))}
                </div>

                {/* HTML Floating Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-surface-container-high text-on-surface p-2.5 rounded-lg border border-outline-variant shadow-lg text-[11px] font-black z-10 pointer-events-none"
                    style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y}px`, transform: 'translate(0, 0)' }}
                  >
                    <p className="text-on-surface-variant font-mono">{hoveredPoint.label}</p>
                    <p className="text-primary text-xs mt-0.5">{hoveredPoint.value}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-60 flex items-center justify-center border border-dashed border-outline-variant/60 rounded-xl">
                <p className="text-xs text-on-surface-variant italic">Không có dữ liệu xu hướng doanh thu trong thời gian này.</p>
              </div>
            )}
          </div>

          {/* Revenue By Branch Bar Chart (Admin overview only) */}
          {isAdmin && !selectedBranchId ? (
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4 relative">
              <div>
                <h3 className="text-sm font-black text-on-surface">Doanh thu theo siêu thị</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">So sánh doanh số thực tế giữa các chi nhánh siêu thị</p>
              </div>

              {barChartSvgPoints && barChartSvgPoints.bars.length > 0 ? (
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${barChartSvgPoints.w} ${barChartSvgPoints.h}`}
                    className="w-full h-64 overflow-visible"
                  >
                    {/* Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
                      const y = barChartSvgPoints.paddingTop + r * barChartSvgPoints.chartH
                      const val = barChartSvgPoints.maxVal * (1 - r)
                      return (
                        <g key={idx} className="opacity-20">
                          <line
                            x1={barChartSvgPoints.paddingLeft}
                            y1={y}
                            x2={barChartSvgPoints.w - barChartSvgPoints.paddingRight}
                            y2={y}
                            stroke="currentColor"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                          />
                          <text
                            x={barChartSvgPoints.paddingLeft - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="9"
                            fontWeight="bold"
                            className="fill-on-surface-variant font-mono"
                          >
                            {val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
                          </text>
                        </g>
                      )
                    })}

                    {/* Bars */}
                    {barChartSvgPoints.bars.map((bar, idx) => (
                      <g key={idx} className="group/bar">
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={bar.height}
                          rx="4"
                          className="fill-tertiary/75 hover:fill-tertiary transition-all cursor-pointer"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredBar({
                              x: rect.left + window.scrollX - 70,
                              y: rect.top + window.scrollY - 75,
                              label: bar.label,
                              value: bar.value
                            });
                          }}
                          onMouseLeave={() => setHoveredBar(null)}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* SVG Label Axis X for Branches */}
                  <div className="flex justify-between pl-[60px] pr-[20px] text-[8px] font-black text-on-surface-variant truncate">
                    {barChartSvgPoints.bars.map((bar, idx) => (
                      <span
                        key={idx}
                        className="truncate text-center block"
                        style={{ width: `${100 / barChartSvgPoints.bars.length}%` }}
                        title={bar.label}
                      >
                        {bar.label.split(' ')[0]} {/* Shorten label */}
                      </span>
                    ))}
                  </div>

                  {/* HTML Floating Tooltip */}
                  {hoveredBar && (
                    <div
                      className="absolute bg-surface-container-high text-on-surface p-2.5 rounded-lg border border-outline-variant shadow-lg text-[11px] font-black z-10 pointer-events-none"
                      style={{ left: `${hoveredBar.x}px`, top: `${hoveredBar.y}px` }}
                    >
                      <p className="text-on-surface-variant">{hoveredBar.label}</p>
                      <p className="text-tertiary text-xs mt-0.5">{hoveredBar.value}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center border border-dashed border-outline-variant/60 rounded-xl">
                  <p className="text-xs text-on-surface-variant italic">Không có dữ liệu chi nhánh.</p>
                </div>
              )}
            </div>
          ) : (
            // If branch manager or specific branch selected, show a promotion analytics overview
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-on-surface">Phân tích khuyến mãi</h3>
                <p className="text-[11px] text-on-surface-variant mt-0.5">Mức đóng góp và hiệu quả sử dụng voucher khuyến mãi</p>
              </div>

              {branchData?.cards && (
                <div className="grid grid-cols-2 gap-4 h-60 items-center">
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-center space-y-2">
                    <Tag className="mx-auto text-primary" size={24} />
                    <p className="text-xs font-bold text-on-surface-variant">Doanh thu có mã ưu đãi</p>
                    <p className="text-lg font-black text-primary">
                      {formatVND(branchData.cards.promotionRevenue || 0)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      Chiếm {branchData.cards.totalRevenue > 0 ? Math.round((branchData.cards.promotionRevenue / branchData.cards.totalRevenue) * 100) : 0}% tổng doanh thu
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-center space-y-2">
                    <Award className="mx-auto text-secondary" size={24} />
                    <p className="text-xs font-bold text-on-surface-variant">Tổng Voucher được áp dụng</p>
                    <p className="text-lg font-black text-secondary">
                      {branchData.cards.vouchersUsed || 0} lần
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      Tối ưu chi tiêu & kích thích mua sắm
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── DETAILS LISTS BLOCK ── */}
      {!loading && topLists && (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Top Selling Products */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
              <Award size={18} className="text-primary" />
              Top 5 sản phẩm bán chạy nhất
            </h3>

            {topLists.topSellingProducts && topLists.topSellingProducts.length > 0 ? (
              <div className="divide-y divide-outline-variant/40 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/20">
                {topLists.topSellingProducts.map((p: any, idx: number) => (
                  <div key={p.productId || idx} className="flex gap-4 p-3.5 items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{p.productName || 'Sản phẩm'}</p>
                        <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">SKU: {p.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-on-surface">Đã bán: {p.quantitySold} {p.unit || 'món'}</p>
                      <p className="text-[10px] font-bold text-primary mt-0.5">{formatVND(p.totalRevenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-6 text-center">Không có sản phẩm bán chạy.</p>
            )}
          </div>

          {/* Low Stock Warning Products */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
            <h3 className="text-sm font-black text-error flex items-center gap-1.5">
              <AlertTriangle size={18} />
              Cảnh báo tồn kho (Hết/Sắp hết hàng)
            </h3>

            {topLists.lowStockProducts && topLists.lowStockProducts.length > 0 ? (
              <div className="divide-y divide-outline-variant/40 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/20">
                {topLists.lowStockProducts.slice(0, 5).map((p: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-3.5 items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-error/10 text-error flex items-center justify-center text-xs font-black">
                        !
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{p.productName || 'Sản phẩm'}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">Mã SKU: {p.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-error">Tồn: {p.quantity}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">Hạn mức: {p.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-success font-semibold py-8 text-center flex flex-col items-center justify-center gap-1">
                <span>✅ Tất cả sản phẩm đều đủ hàng.</span>
                <span className="text-[10px] text-on-surface-variant font-medium font-normal">Không có cảnh báo mức tồn kho thấp</span>
              </p>
            )}
          </div>

          {/* Top Customers (Spending) */}
          {topLists.topCustomers && topLists.topCustomers.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
                <Users size={18} className="text-primary" />
                Khách hàng mua sắm nhiều nhất
              </h3>

              <div className="divide-y divide-outline-variant/40 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/20">
                {topLists.topCustomers.map((c: any, idx: number) => (
                  <div key={c.customerId || idx} className="flex gap-4 p-3.5 items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{c.fullName || 'Khách hàng'}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">SĐT: {c.phone || 'N/A'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-on-surface">{formatVND(c.totalSpent)}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant mt-0.5">{c.orderCount} đơn hàng</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Staff (Order processing) */}
          {topLists.topStaff && topLists.topStaff.length > 0 && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant shadow-sm space-y-4">
              <h3 className="text-sm font-black text-on-surface flex items-center gap-1.5">
                <Award size={18} className="text-primary" />
                Nhân viên xử lý đơn xuất sắc nhất
              </h3>

              <div className="divide-y divide-outline-variant/40 border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-low/20">
                {topLists.topStaff.map((s: any, idx: number) => (
                  <div key={s.staffId || idx} className="flex gap-4 p-3.5 items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{s.fullName || 'Nhân viên'}</p>
                      <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Vai trò: {s.email || 'Staff'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-on-surface">{s.processedOrderCount} đơn hoàn thành</p>
                      <p className="text-[10px] font-bold text-primary mt-0.5">Thu về: {formatVND(s.totalProcessedRevenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
