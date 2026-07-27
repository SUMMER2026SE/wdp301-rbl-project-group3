import React, { useEffect, useState } from 'react'
import { useAuth } from '@hooks/useAuth'
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Building,
  RefreshCw,
} from 'lucide-react'
import shiftService, { ShiftTemplate, ShiftRegistration } from '@services/shiftService'
import { branchService } from '@services/branchService'
import { employeeService } from '@services/employeeService'
import type { Branch, Employee } from '@/types'
import { useSocket } from '../../contexts/SocketContext'
import { notify } from '../../utils/toast'

/**
 * Manages shift templates, registrations, and staff scheduling workflows.
 * Data loading, mutation feedback, and screen-specific state are coordinated at this page boundary.
 */
export const ManageShiftsPage = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const isStaff = user?.role === 'staff'
  const isBranchManager = user?.role === 'branch_manager'
  const isAdmin = user?.role === 'admin'

  // Tabs state
  // Staff: 'my-shifts' (Weekly registration grid)
  // Manager/Admin: 'review' (Approve shifts), 'templates' (Shift templates), 'overview' (Weekly calendar overview for all staff)
  const [activeTab, setActiveTab] = useState<string>('my-shifts')

  // Common data states
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')

  useEffect(() => {
    if (user) {
      setActiveTab(user.role === 'staff' ? 'my-shifts' : 'review')
      setSelectedBranchId(user.branchId || '')
    }
  }, [user])
  const [templates, setTemplates] = useState<ShiftTemplate[]>([])
  const [registrations, setRegistrations] = useState<ShiftRegistration[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Selection states & Pagination
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('pending')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isRegsLoading, setIsRegsLoading] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Date selection states
  // We manage the current viewed date. The weekly grid displays the Monday-Sunday week containing this date.
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Modal registration state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false)
  const [selectedTemplateForRegister, setSelectedTemplateForRegister] = useState<ShiftTemplate | null>(null)
  const [registerDateStr, setRegisterDateStr] = useState<string>('')
  const [registerNote, setRegisterNote] = useState<string>('')
  const [isSubmittingRegister, setIsSubmittingRegister] = useState<boolean>(false)

  // Template Modal Form state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ShiftTemplate | null>(null)
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    maxStaff: 3,
  })
  const [templateFormError, setTemplateFormError] = useState<string>('')
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState<boolean>(false)

  // Review Modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false)
  const [selectedRegForReview, setSelectedRegForReview] = useState<ShiftRegistration | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [reviewManagerNote, setReviewManagerNote] = useState<string>('')
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false)



  // Quick message helper
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 4000)
  }
  const triggerError = (msg: string) => {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 4000)
  }

  // --- WEEK HELPERS ---
  // Get Monday of the week containing date
  const getMonday = (d: Date): Date => {
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(d)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Get Monday to Sunday Dates
  const getWeekDates = (mon: Date): Date[] => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(mon)
      nextDay.setDate(mon.getDate() + i)
      dates.push(nextDay)
    }
    return dates
  }

  const mondayDate = getMonday(currentDate)
  const weekDates = getWeekDates(mondayDate)
  const sundayDate = weekDates[6]

  // Formatter helpers
  const formatDateString = (d: Date): string => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const mondayDateStr = formatDateString(mondayDate)

  const formatDisplayDate = (d: Date): string => {
    const dayStr = String(d.getDate()).padStart(2, '0')
    const monthStr = String(d.getMonth() + 1).padStart(2, '0')
    return `${dayStr}/${monthStr}`
  }

  const getDayName = (index: number): string => {
    const days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
    return days[index]
  }

  // Navigation handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentDate)
    prev.setDate(currentDate.getDate() - 7)
    setCurrentDate(prev)
  }

  const handleNextWeek = () => {
    const next = new Date(currentDate)
    next.setDate(currentDate.getDate() + 7)
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // --- API CALLERS ---
  const loadBranches = async () => {
    if (isStaff) return
    try {
      const res = await branchService.getBranches()
      if (res.success && res.data) {
        setBranches(res.data)
        if (isAdmin && res.data.length > 0 && !selectedBranchId) {
          setSelectedBranchId(res.data[0]._id)
        }
      }
    } catch (err: any) {
      console.error('Failed to load branches:', err)
    }
  }

  const loadEmployees = async () => {
    if (isStaff) return
    if (!selectedBranchId) return
    try {
      const res = await employeeService.listEmployees({
        branchId: selectedBranchId,
        limit: 100,
        status: 'active',
      })
      if (res.success && res.data?.employees) {
        setEmployees(res.data.employees)
      }
    } catch (err: any) {
      console.error('Failed to load employees:', err)
    }
  }

  const loadTemplates = async () => {
    if (!selectedBranchId) return
    setIsLoading(true)
    try {
      const res = await shiftService.getTemplates({ branchId: selectedBranchId })
      if (res.success && res.data?.templates) {
        setTemplates(res.data.templates)
      }
    } catch (err: any) {
      console.error('Failed to load shift templates:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRegistrations = async () => {
    if (!selectedBranchId) return
    setIsRegsLoading(true)
    try {
      // For weekly views, restrict start & end range to load less data
      const startDate = formatDateString(mondayDate)
      const endDate = formatDateString(sundayDate)

      const params: any = {
        branchId: selectedBranchId,
        startDate,
        endDate,
      }

      if (isStaff) {
        // Fetch all registrations in branch so staff can see shift capacity and approved counts
      } else {
        if (filterEmployeeId !== 'all') {
          params.userId = filterEmployeeId
        }
        if (activeTab === 'review') {
          if (filterStatus !== 'all') {
            params.status = filterStatus
          }
        } else if (activeTab === 'overview') {
          params.status = 'approved'
        }
      }

      const res = await shiftService.getRegistrations(params)
      if (res.success && res.data?.registrations) {
        setRegistrations(res.data.registrations)
      }
    } catch (err: any) {
      console.error('Failed to load registrations:', err)
    } finally {
      setIsRegsLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranchId) {
      loadTemplates()
      loadEmployees()
    }
  }, [selectedBranchId])

  useEffect(() => {
    if (selectedBranchId) {
      loadRegistrations()
    }
  }, [selectedBranchId, mondayDateStr, filterEmployeeId, filterStatus, activeTab])

  // Lắng nghe sự kiện ca trực thay đổi thời gian thực
  useEffect(() => {
    if (!socket) return

    const handleShiftUpdated = (data: any) => {
      console.log('Realtime shift update received:', data)
      loadRegistrations()
      
      if (data.action === 'reviewed') {
        notify.success('🔔 Một đơn đăng ký ca làm đã được duyệt mới!')
      } else if (data.action === 'created') {
        notify.success('🔔 Có yêu cầu đăng ký ca làm mới từ nhân viên!')
      } else if (data.action === 'cancelled') {
        notify.success('🔔 Một ca đăng ký đã được hủy bỏ.')
      }
    }

    socket.on('shift:updated', handleShiftUpdated)

    return () => {
      socket.off('shift:updated', handleShiftUpdated)
    }
  }, [socket, selectedBranchId])

  // --- SUBMISSIONS ---
  // Registration Form
  const handleOpenRegisterModal = (tpl: ShiftTemplate, d: Date) => {
    setSelectedTemplateForRegister(tpl)
    setRegisterDateStr(formatDateString(d))
    setRegisterNote('')
    setIsRegisterModalOpen(true)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplateForRegister) return
    setIsSubmittingRegister(true)
    try {
      const res = await shiftService.registerShift({
        date: registerDateStr,
        shiftTemplateId: selectedTemplateForRegister._id,
        note: registerNote,
      })
      if (res.success) {
        triggerSuccess('Đăng ký ca làm thành công! Vui lòng chờ quản lý duyệt.')
        setIsRegisterModalOpen(false)
        loadRegistrations()
      } else {
        triggerError(res.message || 'Không thể đăng ký ca làm')
      }
    } catch (err: any) {
      triggerError(err.message || 'Lỗi hệ thống khi đăng ký ca làm')
    } finally {
      setIsSubmittingRegister(false)
    }
  }

  // Cancel registration
  const handleCancelRegistration = async (regId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đăng ký ca làm này không?')) return
    try {
      const res = await shiftService.cancelRegistration(regId)
      if (res.success) {
        triggerSuccess('Đã hủy đăng ký thành công.')
        loadRegistrations()
      } else {
        triggerError(res.message || 'Không thể hủy đăng ký')
      }
    } catch (err: any) {
      triggerError(err.message || 'Lỗi hệ thống khi hủy đăng ký')
    }
  }

  // Template Form (Create/Edit)
  const handleOpenTemplateModal = (tpl: ShiftTemplate | null = null) => {
    setSelectedTemplate(tpl)
    if (tpl) {
      setTemplateFormData({
        name: tpl.name,
        startTime: tpl.startTime,
        endTime: tpl.endTime,
        maxStaff: tpl.maxStaff,
      })
    } else {
      setTemplateFormData({
        name: '',
        startTime: '08:00',
        endTime: '16:00',
        maxStaff: 3,
      })
    }
    setTemplateFormError('')
    setIsTemplateModalOpen(true)
  }

  const handleTemplateFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTemplateFormError('')
    setIsSubmittingTemplate(true)

    if (!templateFormData.name.trim()) {
      setTemplateFormError('Vui lòng nhập tên ca làm')
      setIsSubmittingTemplate(false)
      return
    }

    try {
      const payload = {
        ...templateFormData,
        branchId: selectedBranchId,
      }

      let res
      if (selectedTemplate) {
        res = await shiftService.updateTemplate(selectedTemplate._id, payload)
      } else {
        res = await shiftService.createTemplate(payload)
      }

      if (res.success) {
        triggerSuccess(selectedTemplate ? 'Cập nhật ca mẫu thành công!' : 'Tạo ca mẫu mới thành công!')
        setIsTemplateModalOpen(false)
        loadTemplates()
      } else {
        setTemplateFormError(res.message || 'Không thể lưu thông tin ca làm')
      }
    } catch (err: any) {
      setTemplateFormError(err.message || 'Lỗi hệ thống khi lưu ca mẫu')
    } finally {
      setIsSubmittingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (tplId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ca làm mẫu này không? Nhân viên sẽ không thể đăng ký theo khung giờ này nữa.')) return
    try {
      const res = await shiftService.deleteTemplate(tplId)
      if (res.success) {
        triggerSuccess('Đã xóa ca mẫu thành công.')
        loadTemplates()
      } else {
        triggerError(res.message || 'Không thể xóa ca mẫu')
      }
    } catch (err: any) {
      triggerError(err.message || 'Lỗi hệ thống khi xóa ca mẫu')
    }
  }

  const handleToggleTemplateStatus = async (tpl: ShiftTemplate) => {
    try {
      const res = await shiftService.updateTemplate(tpl._id, {
        status: tpl.status === 'active' ? 'inactive' : 'active',
      })
      if (res.success) {
        triggerSuccess('Thay đổi trạng thái ca mẫu thành công.')
        loadTemplates()
      }
    } catch (err: any) {
      triggerError(err.message || 'Lỗi khi cập nhật trạng thái')
    }
  }

  // Review (Approve/Reject)
  const handleOpenReviewModal = (reg: ShiftRegistration, status: 'approved' | 'rejected') => {
    setSelectedRegForReview(reg)
    setReviewStatus(status)
    setReviewManagerNote('')
    setIsReviewModalOpen(true)
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegForReview) return
    setIsSubmittingReview(true)
    try {
      const res = await shiftService.reviewRegistration(selectedRegForReview._id, {
        status: reviewStatus,
        managerNote: reviewManagerNote,
      })
      if (res.success) {
        triggerSuccess(`Đã phê duyệt đơn đăng ký ca của ${selectedRegForReview.userId.fullName} thành công!`)
        setIsReviewModalOpen(false)
        loadRegistrations()
      } else {
        triggerError(res.message || 'Không thể cập nhật đơn đăng ký')
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi hệ thống khi xử lý đơn đăng ký'
      triggerError(errorMsg)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Helper metrics
  const getRegsCountByStatus = (status: string) => {
    return registrations.filter((r) => r.status === status).length
  }

  return (
    <div className="space-y-6">
      {/* ── BANNER HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-secondary p-6 text-white shadow-lg md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-white/10 blur-lg" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-2xl font-black md:text-3xl">
              <CalendarIcon className="text-secondary-fixed animate-pulse" />
              Lịch & Ca làm việc
            </h2>
            <p className="text-sm opacity-90">
              Đăng ký ca làm, theo dõi lịch trực và phê duyệt lịch trình nhân sự tại chi nhánh.
            </p>
          </div>
          {/* Branch Selector for Admin */}
          {isAdmin && (
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur-md">
              <Building size={16} />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none [&>option]:text-black"
              >
                <option value="">-- Chọn Chi nhánh --</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── ALERT MESSAGES ── */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-success-container p-4 text-on-success-container shadow-sm border border-success-container/20 animate-fade-in">
          <CheckCircle size={18} className="shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-error-container p-4 text-on-error-container shadow-sm border border-error-container/20 animate-fade-in">
          <AlertTriangle size={18} className="shrink-0" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}


      {/* ── TAB BAR CONTROLS ── */}
      <div className="flex flex-col gap-4 border-b border-outline-variant bg-surface-container-lowest p-2 rounded-xl shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1">
          {isStaff && (
            <button
              onClick={() => setActiveTab('my-shifts')}
              className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                activeTab === 'my-shifts'
                  ? 'bg-primary text-white shadow'
                  : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
              }`}
              type="button"
            >
              Đăng ký ca làm của tôi
            </button>
          )}
          {(isBranchManager || isAdmin) && (
            <>
              <button
                onClick={() => setActiveTab('review')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'review'
                    ? 'bg-primary text-white shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                type="button"
              >
                Phê duyệt đăng ký
                {registrations.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-black text-white animate-pulse">
                    {registrations.filter((r) => r.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-primary text-white shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                type="button"
              >
                Tổng hợp Lịch tuần
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
                  activeTab === 'templates'
                    ? 'bg-primary text-white shadow'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
                type="button"
              >
                Quản lý Ca làm mẫu
              </button>
            </>
          )}
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevWeek}
            className="rounded-lg p-2 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container transition-colors"
            title="Tuần trước"
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleToday}
            className="rounded-lg px-3 py-1.5 border border-outline-variant bg-surface-container-lowest text-xs font-bold hover:bg-surface-container transition-colors"
            type="button"
          >
            Tuần này
          </button>
          <span className="text-xs font-bold px-2 py-1 bg-surface-container-low rounded-lg text-on-surface border border-outline-variant/30">
            {formatDisplayDate(mondayDate)} - {formatDisplayDate(sundayDate)}
          </span>
          <button
            onClick={handleNextWeek}
            className="rounded-lg p-2 border border-outline-variant bg-surface-container-lowest hover:bg-surface-container transition-colors"
            title="Tuần tới"
            type="button"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={loadRegistrations}
            className="rounded-lg p-2 bg-surface-container hover:bg-surface-container-high transition-colors"
            title="Làm mới lịch"
            type="button"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── TAB: STAFF WEEKLY GRID REGISTER ── */}
      {activeTab === 'my-shifts' && (
        <div className="space-y-6">
          {/* Quick instructions & stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">Ca đã duyệt tuần này</p>
                <p className="text-xl font-black text-on-surface">{getRegsCountByStatus('approved')}</p>
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">Đang chờ phê duyệt</p>
                <p className="text-xl font-black text-on-surface">{getRegsCountByStatus('pending')}</p>
              </div>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase">Tổng số giờ làm dự kiến</p>
                <p className="text-xl font-black text-on-surface">
                  {(getRegsCountByStatus('approved') + getRegsCountByStatus('pending')) * 8} giờ
                </p>
              </div>
            </div>
          </div>

          {/* Grid Layout (Monday to Sunday) */}
          {(() => {
            const todayStr = formatDateString(new Date())
            const activeDates = weekDates.filter(d => {
              const dateStr = formatDateString(d)
              const isPast = dateStr < todayStr
              return !isPast
            })

            if (activeDates.length === 0) {
              return (
                <div className="text-center py-12 bg-surface-container-lowest rounded-xl border border-outline-variant text-on-surface-variant font-medium">
                  Tất cả các ngày trong tuần này đã qua. Bạn không thể đăng ký ca làm mới cho tuần này nữa.
                </div>
              )
            }

            const gridColsClass = 
              activeDates.length === 7 ? 'md:grid-cols-7' :
              activeDates.length === 6 ? 'md:grid-cols-6' :
              activeDates.length === 5 ? 'md:grid-cols-5' :
              activeDates.length === 4 ? 'md:grid-cols-4' :
              activeDates.length === 3 ? 'md:grid-cols-3' :
              activeDates.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'

            return (
              <div className={`grid grid-cols-1 gap-4 ${gridColsClass}`}>
                {activeDates.map((dateItem) => {
                  const dateStr = formatDateString(dateItem)
                  const displayDate = formatDisplayDate(dateItem)
                  const originalIdx = weekDates.findIndex(d => formatDateString(d) === dateStr)
                  const dayName = getDayName(originalIdx !== -1 ? originalIdx : 0)

                  // Check if day is today
                  const isToday = todayStr === dateStr
                  const isPast = dateStr < todayStr

                  return (
                    <div
                      key={dateStr}
                      className={`flex flex-col rounded-xl border p-3 shadow-sm transition-all ${
                        isToday
                          ? 'border-primary bg-primary-container/20 ring-2 ring-primary/20'
                          : 'border-outline-variant bg-surface-container-lowest'
                      }`}
                    >
                      {/* Day Header */}
                      <div className="border-b border-outline-variant/60 pb-2 mb-2 flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-black text-on-surface">{dayName}</h4>
                          <p className="text-[11px] font-bold text-on-surface-variant">{displayDate}</p>
                        </div>
                        {isToday && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wider animate-pulse">
                            Hôm nay
                          </span>
                        )}
                      </div>

                      {/* List of slots/shifts */}
                      <div className="flex-1 space-y-2">
                        {templates.length === 0 ? (
                          <p className="text-[11px] text-on-surface-variant italic text-center py-4">
                            Chưa có ca mẫu
                          </p>
                        ) : (
                          templates.map((tpl) => {
                            const userIdStr = String(user?.id || (user as any)?._id)

                            // Find if current user registered for this template on this date
                            const reg = registrations.find(
                              (r) =>
                                r.date.substring(0, 10) === dateStr &&
                                r.shiftTemplateId === tpl._id &&
                                String((r.userId as any)?._id || r.userId) === userIdStr
                            )

                            // Count approved staff for this shift slot
                            const approvedCount = registrations.filter(
                              (r) =>
                                r.date.substring(0, 10) === dateStr &&
                                r.shiftTemplateId === tpl._id &&
                                r.status === 'approved'
                            ).length

                            const isFull = approvedCount >= (tpl.maxStaff || 3)

                            return (
                              <div
                                key={tpl._id}
                                className={`rounded-lg border p-2.5 text-xs transition-colors flex flex-col justify-between gap-2 ${
                                  reg?.status === 'approved'
                                    ? 'bg-success-container/10 border-success/30'
                                    : reg?.status === 'pending'
                                    ? 'bg-amber-100/30 border-amber-500/30'
                                    : reg?.status === 'rejected'
                                    ? 'bg-error-container/15 border-error/20'
                                    : 'bg-surface-container-low/40 border-outline-variant hover:bg-surface-container-low'
                                }`}
                              >
                                {/* Shift info */}
                                <div>
                                  <div className="flex items-center justify-between font-bold">
                                    <span className="text-on-surface truncate pr-1" title={tpl.name}>
                                      {tpl.name}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold shrink-0 ${
                                        isFull ? 'text-error' : 'text-primary'
                                      }`}
                                    >
                                      {approvedCount}/{tpl.maxStaff || 3} người
                                    </span>
                                  </div>
                                  <div className="mt-1 flex items-center gap-1 text-[10px] text-on-surface-variant font-semibold">
                                    <Clock size={11} className="text-on-surface-variant" />
                                    <span>
                                      {tpl.startTime} - {tpl.endTime}
                                    </span>
                                  </div>
                                </div>

                                {/* Status or Register action */}
                                <div className="pt-1.5 border-t border-dashed border-outline-variant">
                                  {reg ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span
                                          className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                            reg.status === 'approved'
                                              ? 'bg-success text-white'
                                              : reg.status === 'pending'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-error text-white'
                                          }`}
                                        >
                                          {reg.status === 'approved'
                                            ? 'Đã duyệt'
                                            : reg.status === 'pending'
                                            ? 'Chờ duyệt'
                                            : 'Từ chối'}
                                        </span>

                                        {/* Cancel for pending */}
                                        {reg.status === 'pending' && (
                                          <button
                                            onClick={() => handleCancelRegistration(reg._id)}
                                            className="text-error hover:underline text-[10px] font-bold"
                                            title="Hủy đăng ký"
                                            type="button"
                                          >
                                            Hủy
                                          </button>
                                        )}
                                      </div>

                                      {reg.note && (
                                        <p className="text-[9px] text-on-surface-variant italic truncate mt-0.5" title={reg.note}>
                                          Họ: "{reg.note}"
                                        </p>
                                      )}
                                      {reg.managerNote && (
                                        <p className="text-[9px] text-error font-semibold leading-tight mt-0.5" title={reg.managerNote}>
                                          Lý do: {reg.managerNote}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenRegisterModal(tpl, dateItem)}
                                      disabled={isPast || isFull}
                                      className={`w-full py-1 rounded text-center text-[10px] font-bold transition-all ${
                                        isPast
                                          ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed'
                                          : isFull
                                          ? 'bg-surface-container-high text-on-surface-variant/60 cursor-not-allowed border border-outline-variant'
                                          : 'bg-primary text-white hover:bg-primary-dark hover:scale-[1.02]'
                                      }`}
                                      type="button"
                                    >
                                      {isPast ? 'Đã qua' : isFull ? `Đã đủ người (${approvedCount}/${tpl.maxStaff})` : 'Đăng ký'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* ── TAB: APPROVE / REVIEW SHIFTS (MANAGER/ADMIN) ── */}
      {activeTab === 'review' && (isBranchManager || isAdmin) && (
        <div className="space-y-4">
          {/* Controls Bar for review */}
          <div className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              {/* Employee filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase">Nhân viên:</span>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                >
                  <option value="all">Tất cả nhân viên</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant uppercase">Trạng thái:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                >
                  <option value="all">Tất cả đơn</option>
                  <option value="pending">Chờ duyệt (Pending)</option>
                  <option value="approved">Đã duyệt (Approved)</option>
                  <option value="rejected">Từ chối (Rejected)</option>
                </select>
              </div>
            </div>
            <div className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg border border-outline-variant/30">
              Tổng số yêu cầu tải về: {registrations.length}
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Nhân viên</th>
                    <th className="px-6 py-4">Ngày đăng ký</th>
                    <th className="px-6 py-4">Ca làm việc</th>
                    <th className="px-6 py-4">Ghi chú nhân viên</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {isRegsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                          <span className="font-medium text-xs">Đang tải danh sách đăng ký...</span>
                        </div>
                      </td>
                    </tr>
                  ) : registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium">
                        Không tìm thấy yêu cầu đăng ký ca làm nào trong tuần được chọn.
                      </td>
                    </tr>
                  ) : (
                    registrations.map((reg) => {
                      const regDate = new Date(reg.date)
                      const regDateStr = reg.date.substring(0, 10)
                      const regDateFormatted = regDate.toLocaleDateString('vi-VN', {
                        weekday: 'long',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })

                      const tpl = templates.find((t) => t._id === reg.shiftTemplateId)
                      const maxStaff = tpl?.maxStaff || 3
                      const approvedCount = registrations.filter(
                        (r) =>
                          r.date.substring(0, 10) === regDateStr &&
                          r.shiftTemplateId === reg.shiftTemplateId &&
                          r.status === 'approved'
                      ).length
                      const isShiftFull = approvedCount >= maxStaff

                      return (
                        <tr key={reg._id} className="group transition-colors hover:bg-surface-container-low/40">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-on-surface text-base">{reg.userId.fullName}</p>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{reg.userId.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-on-surface">
                            {regDateFormatted}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-on-surface text-sm flex items-center gap-1.5">
                                <Clock size={13} className="text-primary" />
                                {reg.shiftName}
                              </p>
                              <p className="text-[11px] text-on-surface-variant font-bold mt-0.5">
                                {reg.startTime} - {reg.endTime} (8 tiếng)
                              </p>
                              {isShiftFull && reg.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold mt-1">
                                  ⚠️ Ca đã đủ {approvedCount}/{maxStaff} người
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {reg.note ? (
                              <p className="text-xs text-on-surface-variant max-w-[200px] truncate italic" title={reg.note}>
                                "{reg.note}"
                              </p>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant/40 italic">Không có ghi chú</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                reg.status === 'approved'
                                  ? 'bg-success-container text-on-success-container'
                                  : reg.status === 'pending'
                                  ? 'bg-surface-container-high text-on-surface-variant animate-pulse'
                                  : 'bg-error-container text-on-error-container opacity-60'
                              }`}
                            >
                              {reg.status === 'approved'
                                ? 'Đã duyệt'
                                : reg.status === 'pending'
                                ? 'Chờ duyệt'
                                : 'Từ chối'}
                            </span>
                            {reg.managerNote && (
                              <p className="text-[10px] text-error font-medium mt-1 leading-tight max-w-[150px] truncate" title={reg.managerNote}>
                                Phản hồi: {reg.managerNote}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {reg.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => {
                                      if (isShiftFull) {
                                        triggerError(`Ca làm này đã đủ số lượng nhân sự tối đa (${approvedCount}/${maxStaff} người). Vui lòng từ chối đơn này hoặc tăng giới hạn nhân sự ca mẫu!`)
                                      } else {
                                        handleOpenReviewModal(reg, 'approved')
                                      }
                                    }}
                                    className={`rounded-lg p-1.5 transition-colors ${
                                      isShiftFull
                                        ? 'bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed border border-outline-variant'
                                        : 'bg-success-container text-on-success-container hover:bg-success hover:text-white'
                                    }`}
                                    title={
                                      isShiftFull
                                        ? `Ca đã đủ ${approvedCount}/${maxStaff} người. Không thể duyệt thêm.`
                                        : 'Duyệt ca làm'
                                    }
                                    type="button"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenReviewModal(reg, 'rejected')}
                                    className="rounded-lg p-1.5 bg-error-container text-on-error-container hover:bg-error hover:text-white transition-colors"
                                    title="Từ chối ca làm"
                                    type="button"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleCancelRegistration(reg._id)}
                                  className="rounded-lg p-1.5 text-error hover:bg-error-container transition-colors"
                                  title="Xóa bản ghi đăng ký này"
                                  type="button"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WEEKLY OVERVIEW (ALL STAFF DIRECTORY CALENDAR) ── */}
      {activeTab === 'overview' && (isBranchManager || isAdmin) && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm p-4">
            <h3 className="text-base font-black text-primary mb-4 flex items-center gap-2">
              <Clock className="text-secondary" />
              Lịch trực chung trong tuần ({formatDisplayDate(mondayDate)} - {formatDisplayDate(sundayDate)})
            </h3>

            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 min-w-[950px]">
                {weekDates.map((dateItem, idx) => {
                  const dateStr = formatDateString(dateItem)
                  const dayName = getDayName(idx)

                  // Filter registrations on this specific day
                  const dayRegs = registrations.filter((r) => {
                    if (r.status !== 'approved') return false
                    const rDateStr = typeof r.date === 'string'
                      ? r.date.substring(0, 10)
                      : new Date(r.date).toISOString().split('T')[0]
                    return rDateStr === dateStr
                  })

                  const isToday = formatDateString(new Date()) === dateStr

                  return (
                    <div
                      key={dateStr}
                      className={`rounded-xl border p-3 min-h-[260px] flex flex-col transition-all ${
                        isToday
                          ? 'border-primary bg-primary-container/15 ring-2 ring-primary/20 shadow-sm'
                          : 'border-outline-variant bg-surface-container-low/30'
                      }`}
                    >
                      <div className="border-b border-outline-variant/60 pb-2 mb-2 text-center">
                        <p className="text-sm font-black text-on-surface flex items-center justify-center gap-1">
                          {dayName}
                        </p>
                        <p className="text-xs font-bold text-on-surface-variant">{formatDisplayDate(dateItem)}</p>
                        {isToday && (
                          <span className="mt-1 inline-block rounded bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                            Hôm nay
                          </span>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        {dayRegs.length === 0 ? (
                          <p className="text-[11px] text-on-surface-variant/40 text-center py-12 italic">
                            Không có ca được duyệt
                          </p>
                        ) : (
                          dayRegs.map((reg) => (
                            <div
                              key={reg._id}
                              className="rounded-xl bg-emerald-50/90 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/60 p-2.5 text-xs shadow-xs space-y-1.5 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <span className="font-extrabold text-on-surface text-xs leading-snug break-words">
                                  {reg.userId.fullName}
                                </span>
                                <span className="inline-flex shrink-0 rounded bg-emerald-600/15 px-1.5 py-0.5 text-[9px] font-black text-emerald-800 dark:text-emerald-200">
                                  {reg.shiftName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                <Clock size={11} className="shrink-0" />
                                <span>
                                  {reg.startTime} - {reg.endTime}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SHIFT TEMPLATES MANAGEMENT (MANAGER/ADMIN) ── */}
      {activeTab === 'templates' && (isBranchManager || isAdmin) && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-black text-primary flex items-center gap-2">
              <Clock className="text-secondary" />
              Khung giờ Ca làm mẫu tại Chi nhánh (8 Tiếng/Ca)
            </h3>
            <button
              onClick={() => handleOpenTemplateModal(null)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow hover:scale-105 hover:bg-primary-dark transition-all"
              type="button"
            >
              <Plus size={16} />
              Thêm ca mẫu mới
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {templates.map((tpl) => (
              <div
                key={tpl._id}
                className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between gap-4 transition-all ${
                  tpl.status === 'active'
                    ? 'border-outline-variant bg-surface-container-lowest'
                    : 'border-outline bg-surface-container-low opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-black text-on-surface">{tpl.name}</h4>
                    <span
                      onClick={() => handleToggleTemplateStatus(tpl)}
                      className={`cursor-pointer rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        tpl.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tpl.status === 'active' ? 'Đang chạy' : 'Đã tắt'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <Clock size={15} className="text-primary" />
                      <span>
                        Thời gian: <strong>{tpl.startTime} - {tpl.endTime}</strong> (8 tiếng)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                      <Users size={15} className="text-secondary" />
                      <span>
                        Số nhân sự tối đa: <strong>{tpl.maxStaff} người/ca</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 pt-3">
                  <button
                    onClick={() => handleOpenTemplateModal(tpl)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    type="button"
                  >
                    <Edit2 size={13} />
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(tpl._id)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-error hover:bg-error-container transition-colors"
                    type="button"
                  >
                    <Trash2 size={13} />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM REGISTER SHIFT ── */}
      {isRegisterModalOpen && selectedTemplateForRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <CalendarIcon className="text-secondary" />
                Đăng ký Ca làm việc
              </h3>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="rounded-xl bg-surface-container-low p-4 space-y-2 border border-outline-variant/30 text-sm">
                <p>
                  Ngày làm việc: <strong>{new Date(registerDateStr).toLocaleDateString('vi-VN')}</strong>
                </p>
                <p>
                  Ca làm mẫu: <strong>{selectedTemplateForRegister.name}</strong>
                </p>
                <p>
                  Khung giờ: <strong>{selectedTemplateForRegister.startTime} - {selectedTemplateForRegister.endTime}</strong> (8 tiếng)
                </p>
              </div>

              <div>
                <label htmlFor="registerNote" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Ghi chú cho quản lý (nếu có)
                </label>
                <textarea
                  id="registerNote"
                  placeholder="Ví dụ: Em xin phép đi học về muộn 15p..."
                  value={registerNote}
                  onChange={(e) => setRegisterNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 px-3.5 text-sm outline-none transition focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRegister}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {isSubmittingRegister ? 'Đang gửi...' : 'Đăng ký ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT SHIFT TEMPLATE ── */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <Clock className="text-secondary" />
                {selectedTemplate ? 'Sửa khung giờ ca mẫu' : 'Thêm ca mẫu mới (8 tiếng)'}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {templateFormError && (
              <div className="flex items-center gap-2 rounded-xl bg-error-container p-3 text-on-error-container text-xs font-bold border border-error-container/20 mb-4">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{templateFormError}</span>
              </div>
            )}

            <form onSubmit={handleTemplateFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="tplName" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Tên ca làm việc *
                </label>
                <input
                  id="tplName"
                  type="text"
                  required
                  placeholder="Ví dụ: Ca 1, Ca sáng, Ca tối..."
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tplStart" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Bắt đầu *
                  </label>
                  <input
                    id="tplStart"
                    type="text"
                    required
                    placeholder="06:00"
                    value={templateFormData.startTime}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, startTime: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-semibold"
                  />
                </div>
                <div>
                  <label htmlFor="tplEnd" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                    Kết thúc *
                  </label>
                  <input
                    id="tplEnd"
                    type="text"
                    required
                    placeholder="14:00"
                    value={templateFormData.endTime}
                    onChange={(e) => setTemplateFormData({ ...templateFormData, endTime: e.target.value })}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-semibold"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tplMax" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  Số nhân sự tối đa trong ca *
                </label>
                <input
                  id="tplMax"
                  type="number"
                  required
                  min={1}
                  value={templateFormData.maxStaff || ''}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, maxStaff: Number(e.target.value) })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2.5 px-3.5 text-sm outline-none transition focus:border-primary font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTemplate}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-primary-dark disabled:opacity-60"
                >
                  {isSubmittingTemplate ? 'Đang lưu...' : 'Lưu ca mẫu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: APPROVE / REJECT SIGNUP FORM ── */}
      {isReviewModalOpen && selectedRegForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4 mb-4">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <UserCheck className="text-secondary" />
                {reviewStatus === 'approved' ? 'Phê duyệt ca làm việc' : 'Từ chối ca làm việc'}
              </h3>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="rounded-full p-1 text-on-surface-variant hover:bg-surface-container-low"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="rounded-xl bg-surface-container-low p-4 space-y-2 border border-outline-variant/30 text-sm">
                <p>
                  Nhân viên: <strong>{selectedRegForReview.userId.fullName}</strong>
                </p>
                <p>
                  Ngày làm việc: <strong>{new Date(selectedRegForReview.date).toLocaleDateString('vi-VN')}</strong>
                </p>
                <p>
                  Ca đăng ký: <strong>{selectedRegForReview.shiftName} ({selectedRegForReview.startTime} - {selectedRegForReview.endTime})</strong>
                </p>
                {selectedRegForReview.note && (
                  <p>
                    Ghi chú của nhân viên: <em>"{selectedRegForReview.note}"</em>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="reviewNote" className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
                  {reviewStatus === 'approved' ? 'Phản hồi / Lưu ý (nếu có)' : 'Lý do từ chối *'}
                </label>
                <textarea
                  id="reviewNote"
                  required={reviewStatus === 'rejected'}
                  placeholder={reviewStatus === 'approved' ? 'Ví dụ: Nhớ đến đúng giờ nhé em...' : 'Ví dụ: Ca này đã đủ nhân sự trực...'}
                  value={reviewManagerNote}
                  onChange={(e) => setReviewManagerNote(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-2 px-3.5 text-sm outline-none transition focus:border-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-outline-variant px-4 py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow transition disabled:opacity-60 ${
                    reviewStatus === 'approved' ? 'bg-primary hover:bg-primary/90' : 'bg-error hover:bg-error/90'
                  }`}
                >
                  {isSubmittingReview ? 'Đang xử lý...' : reviewStatus === 'approved' ? 'Đồng ý Duyệt' : 'Từ Chối Đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
/**
 * Administrative dashboard view that presents and manages a specific back-office feature.
 * UI state, loading behavior, and user actions are kept close to this route boundary.
 */
