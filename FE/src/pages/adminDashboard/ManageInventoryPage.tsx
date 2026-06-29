import { useState, useEffect, useMemo } from 'react'
import {
  Package,
  Plus,
  Search,
  Loader2,
  X,
  AlertCircle,
  Check,
  History,
  Layers,
  AlertTriangle,
  PlusCircle,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Minus,
  Play,
  Square
} from 'lucide-react'
import apiClient from '@/services/api';
import { inventoryService } from '@services/inventoryService'
import { branchService } from '@services/branchService'
import { productService } from '@services/productService'
import { categoryService } from '@services/categoryService'
import { useAuth } from '@hooks/useAuth'
import type { Inventory, ImportReceipt, Branch, Product, Category } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManageInventoryPage = () => {
  const { user, loading: authLoading } = useAuth()
  const isManagerOrStaff = user?.role === 'branch_manager' || user?.role === 'staff'
  const userBranchId = user?.branchId || ''
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState<'stock' | 'import' | 'catalog'>('stock')

  // Master data
  const [branches, setBranches] = useState<Branch[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState<string>('')

  // Tab 1: Stock states
  const [inventoryList, setInventoryList] = useState<Inventory[]>([])
  const [stockLoading, setStockLoading] = useState(false)
  const [stockError, setStockError] = useState<string | null>(null)
  const [stockSearch, setStockSearch] = useState('')
  const [filterLowStock, setFilterLowStock] = useState(false)

  // Tab 2: Import states
  const [receiptsList, setReceiptsList] = useState<ImportReceipt[]>([])
  const [receiptsLoading, setReceiptsLoading] = useState(false)
  const [receiptsError, setReceiptsError] = useState<string | null>(null)
  const [receiptsSearch, setReceiptsSearch] = useState('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Create Receipt Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importBranchId, setImportBranchId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [importNote, setImportNote] = useState('')
  const [importItems, setImportItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([])

  // Optimized Stock-In autocomplete & historical lookup states
  const [activeProducts, setActiveProducts] = useState<Product[]>([])
  const [importBranchInventory, setImportBranchInventory] = useState<Inventory[]>([])

  // Manual Stock Editing states
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false)
  const [editingStockItem, setEditingStockItem] = useState<Inventory | null>(null)
  const [editStockQuantity, setEditStockQuantity] = useState(0)
  const [editStockAvgCost, setEditStockAvgCost] = useState(0)
  const [editStockThreshold, setEditStockThreshold] = useState(10)
  const [editStockError, setEditStockError] = useState<string | null>(null)
  const [editStockLoading, setEditStockLoading] = useState(false)
  const [editStockSuccess, setEditStockSuccess] = useState(false)

  // Delete Inventory Confirm Modal
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<Inventory | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Import zero-cost confirm modal
  const [showZeroCostConfirm, setShowZeroCostConfirm] = useState(false)
  const [zeroCostResolve, setZeroCostResolve] = useState<((v: boolean) => void) | null>(null)

  // Toggle product status confirm modal
  const [toggleProductTarget, setToggleProductTarget] = useState<Product | null>(null)
  const [isToggleConfirmOpen, setIsToggleConfirmOpen] = useState(false)

  // Product form soft-warning modals (zero price / no category)
  type SoftWarnType = 'zeroPrice' | 'noCategory' | null
  const [softWarnType, setSoftWarnType] = useState<SoftWarnType>(null)
  const [softWarnResolve, setSoftWarnResolve] = useState<((v: boolean) => void) | null>(null)

  // Tab 3: Catalog states
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogPage, setCatalogPage] = useState(1)
  const [catalogTotalPages, setCatalogTotalPages] = useState(1)

  // Create / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productLoading, setProductLoading] = useState(false)
  const [productError, setProductError] = useState<string | null>(null)
  const [productSuccess, setProductSuccess] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    costPrice: 0,
    salePrice: 0,
    unit: 'item',
    description: '',
    imageUrl: '',
    categoryId: '',
    status: 'active' as 'active' | 'inactive'
  })



  // Crawler states
  const [isCrawling, setIsCrawling] = useState(false);
  const [showCrawlerStopConfirm, setShowCrawlerStopConfirm] = useState(false);

  // Fetch branches and categories on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.getBranches()
        if (response.success) {
          const activeBranches = response.data.filter(b => b.status === 'active')
          setBranches(activeBranches)
        }
      } catch (err: any) {
        console.error('Failed to load branches:', err)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories({ status: 'active' })
        if (response.success) {
          setCategories(response.data)
        }
      } catch (err: any) {
        console.error('Failed to load categories:', err)
      }
    }

    fetchBranches()
    fetchCategories()
  }, [])

  // Sync selected branch and default values when branches or user changes
  useEffect(() => {
    if (authLoading) return

    if (isManagerOrStaff) {
      if (userBranchId) {
        setSelectedBranchId(userBranchId)
        setImportBranchId(userBranchId)
      }
    } else {
      // For Admin, default to first active branch when branches load and none is selected yet
      if (branches.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branches[0]._id)
        setImportBranchId(branches[0]._id)
      }
    }
  }, [authLoading, isManagerOrStaff, userBranchId, branches])

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCatalogPage(1)
  }, [catalogSearch])


  // Poll Crawler Status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'catalog') {
      const fetchStatus = async () => {
        try {
          const res = await apiClient.get('/api/crawler/status');
          if (res.data?.success) {
            setIsCrawling(res.data.data.isRunning);
          }
        } catch (err) {
          console.error('Failed to fetch crawler status', err);
        }
      }
      fetchStatus();
      interval = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [activeTab]);

  const handleToggleCrawler = async () => {
    try {
      if (isCrawling) {
        setShowCrawlerStopConfirm(true);
      } else {
        await apiClient.post('/api/crawler/start');
        setIsCrawling(true);
      }
    } catch (err) {
      console.error('Crawler toggle error', err);
    }
  };

  const confirmStopCrawler = async () => {
    try {
      await apiClient.post('/api/crawler/stop');
      setIsCrawling(false);
      setShowCrawlerStopConfirm(false);
    } catch (err) {
      console.error('Crawler stop error', err);
    }
  };

  // Fetch products (all active/inactive) for catalog and receipts
  const fetchProducts = async () => {
    try {
      setCatalogLoading(true)
      setCatalogError(null)
      const params: { keyword?: string; page?: number; limit?: number } = {
        page: catalogPage,
        limit: 10
      }
      if (catalogSearch.trim()) {
        params.keyword = catalogSearch.trim()
      }
      const response = await productService.getProducts(params)
      if (response.success) {
        setProducts(response.data)
        if (response.pagination) {
          setCatalogTotalPages(response.pagination.totalPages || 1)
        }
      } else {
        setCatalogError(response.message || 'Failed to fetch catalog products')
      }
    } catch (err: any) {
      setCatalogError(err.message || 'An error occurred while loading products')
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'catalog') {
      const delayDebounce = setTimeout(() => {
        fetchProducts()
      }, 400)
      return () => clearTimeout(delayDebounce)
    } else {
      // Just fetch products quietly for import receipt dropdowns
      productService.getProducts().then((res) => {
        if (res.success) setProducts(res.data)
      })
    }
  }, [activeTab, catalogSearch, catalogPage])

  // Fetch inventory stock for Tab 1
  const fetchInventory = async () => {
    if (!selectedBranchId) return
    try {
      setStockLoading(true)
      setStockError(null)
      const params: { branchId?: string; lowStock?: 'true' | 'false' } = {
        branchId: selectedBranchId
      }
      if (filterLowStock) {
        params.lowStock = 'true'
      }
      const response = await inventoryService.getInventory(params)
      if (response.success) {
        setInventoryList(response.data)
      } else {
        setStockError(response.message || 'Failed to fetch inventory data')
      }
    } catch (err: any) {
      setStockError(err.message || 'An error occurred while fetching inventory')
    } finally {
      setStockLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'stock' && selectedBranchId) {
      fetchInventory()
    }
  }, [activeTab, selectedBranchId, filterLowStock])

  // Fetch import receipts for Tab 2
  const fetchReceipts = async () => {
    if (isManagerOrStaff && !selectedBranchId) return
    try {
      setReceiptsLoading(true)
      setReceiptsError(null)
      const params = selectedBranchId ? { branchId: selectedBranchId } : undefined
      const response = await inventoryService.getImportReceipts(params)
      if (response.success) {
        setReceiptsList(response.data)
      } else {
        setReceiptsError(response.message || 'Failed to fetch import history')
      }
    } catch (err: any) {
      setReceiptsError(err.message || 'An error occurred while fetching import receipts')
    } finally {
      setReceiptsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'import' && (!isManagerOrStaff || selectedBranchId)) {
      fetchReceipts()
    }
  }, [activeTab, selectedBranchId, isManagerOrStaff])

  // Fetch target branch inventory for cost suggestions
  useEffect(() => {
    const fetchImportBranchInventory = async () => {
      if (!isImportModalOpen || !importBranchId) return
      try {
        const response = await inventoryService.getInventory({ branchId: importBranchId })
        if (response.success) {
          setImportBranchInventory(response.data)
        }
      } catch (err) {
        console.error('Failed to load target branch inventory:', err)
      }
    }
    fetchImportBranchInventory()
  }, [importBranchId, isImportModalOpen])

  // Fetch all active products quietly for autocomplete when the modal opens
  useEffect(() => {
    const fetchActiveProducts = async () => {
      if (!isImportModalOpen) return
      try {
        const response = await productService.getProducts({ limit: 1000, status: 'active' })
        if (response.success) {
          setActiveProducts(response.data)
        }
      } catch (err) {
        console.error('Failed to load active products:', err)
      }
    }
    fetchActiveProducts()
  }, [isImportModalOpen])

  // Auto-refresh for stock tab
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'stock') return

    const intervalId = setInterval(() => {
      fetchInventory()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(intervalId)
  }, [autoRefresh, activeTab, selectedBranchId, filterLowStock])

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    // Filter stock locally based on stockSearch keyword
    const filtered = inventoryList.filter((item) => {
      if (!stockSearch.trim()) return true
      const keyword = stockSearch.toLowerCase()
      const nameMatch = item.productId?.productName?.toLowerCase().includes(keyword) || item.productId?.name?.toLowerCase().includes(keyword)
      const skuMatch = item.productId?.sku?.toLowerCase().includes(keyword)
      return nameMatch || skuMatch
    })

    const totalProducts = filtered.length
    const lowStockItems = filtered.filter(item => item.quantity <= item.lowStockThreshold).length
    const totalValue = filtered.reduce((sum, item) => sum + (item.quantity * item.averageCost), 0)
    const outOfStock = filtered.filter(item => item.quantity === 0).length

    return {
      totalProducts,
      lowStockItems,
      totalValue,
      outOfStock,
      filtered
    }
  }, [inventoryList, stockSearch])

  const filteredStock = inventoryStats.filtered

  // Calculate receipts statistics  
  const receiptsStats = useMemo(() => {
    const filteredByDate = receiptsList.filter(rec => {
      if (receiptsSearch.trim()) {
        const keyword = receiptsSearch.toLowerCase()
        const codeMatch = rec.code?.toLowerCase().includes(keyword)
        const supplierMatch = rec.supplierName?.toLowerCase().includes(keyword)
        if (!(codeMatch || supplierMatch)) return false
      }

      if (startDate || endDate) {
        const recDate = new Date(rec.createdAt)
        if (startDate && recDate < new Date(startDate)) return false
        if (endDate) {
          const endDateTime = new Date(endDate)
          endDateTime.setHours(23, 59, 59, 999)
          if (recDate > endDateTime) return false
        }
      }

      return true
    })

    const totalReceipts = filteredByDate.length
    const totalValue = filteredByDate.reduce((sum, rec) => sum + rec.totalCost, 0)
    const totalItems = filteredByDate.reduce((sum, rec) => sum + rec.items.length, 0)

    return {
      totalReceipts,
      totalValue,
      totalItems,
      filtered: filteredByDate
    }
  }, [receiptsList, receiptsSearch, startDate, endDate])

  // Export receipts to CSV
  const exportReceiptsToCSV = () => {
    const headers = ['Mã phiếu', 'Chi nhánh', 'Nhà cung cấp', 'Tổng giá trị', 'Người tạo', 'Ngày nhập']
    const rows = receiptsStats.filtered.map(rec => {
      const branchName = typeof rec.branchId === 'object' ? rec.branchId.name : 'N/A'
      const creatorName = typeof rec.createdBy === 'object' ? rec.createdBy.fullName : 'System'

      return [
        rec.code,
        branchName,
        rec.supplierName || 'N/A',
        rec.totalCost,
        creatorName,
        new Date(rec.createdAt).toLocaleString()
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `import_receipts_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Export stock to CSV
  const exportStockToCSV = () => {
    const headers = ['STT', 'Mã SKU', 'Tên sản phẩm', 'Đơn vị', 'Số lượng tồn', 'Giá bán trung bình', 'Giá nhập gốc', 'Trạng thái']
    const rows = filteredStock.map((item, idx) => {
      const isLow = item.quantity <= item.lowStockThreshold

      return [
        idx + 1,
        item.productId?.sku || 'N/A',
        item.productId?.productName || item.productId?.name || 'N/A',
        item.productId?.unit || 'item',
        item.quantity,
        item.averageCost ?? 0,
        item.productId?.price ?? item.productId?.salePrice ?? 0,
        isLow ? 'Cảnh báo hết' : 'Đủ hàng'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const branchName = branches.find(b => b._id === selectedBranchId)?.name || 'branch'
    link.download = `inventory_${branchName}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // --- ACTIONS ---

  // Quick Add Product to Import List
  const handleQuickAddProduct = (product: Product) => {
    const existingIndex = importItems.findIndex(item => item.productId === product._id)
    if (existingIndex > -1) {
      // Increment quantity
      const updated = [...importItems]
      updated[existingIndex].quantity += 1
      setImportItems(updated)
    } else {
      // Look up historical price in target branch stock
      const historicalItem = importBranchInventory.find(
        inv => {
          const invProdId = typeof inv.productId === 'object' ? inv.productId?._id : inv.productId
          return invProdId === product._id
        }
      )
      // Suggest cost sequence: lastImportCost -> averageCost -> price -> salePrice -> 0
      const suggestedCost = historicalItem?.lastImportCost ?? historicalItem?.averageCost ?? product.price ?? product.salePrice ?? 0

      setImportItems([...importItems, { productId: product._id, quantity: 1, unitCost: suggestedCost }])
    }
  }

  // Remove item row in import builder
  const removeImportItemRow = (index: number) => {
    const updated = [...importItems]
    updated.splice(index, 1)
    setImportItems(updated)
  }

  // Update item row in import builder
  const updateImportItemRow = (index: number, field: string, value: any) => {
    const updated = [...importItems]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setImportItems(updated)
  }

  // Clear all import items
  const handleClearImportItems = () => {
    setImportItems([])
  }



  // Handle edit click
  const handleEditStockClick = (item: Inventory) => {
    setEditingStockItem(item)
    setEditStockQuantity(item.quantity)
    setEditStockAvgCost(item.averageCost)
    setEditStockThreshold(item.lowStockThreshold)
    setEditStockError(null)
    setEditStockSuccess(false)
    setIsEditStockModalOpen(true)
  }

  // Submit manual stock edit
  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStockItem) return
    if (editStockQuantity < 0) {
      setEditStockError('❌ Số lượng tồn kho không được âm.')
      return
    }
    if (editStockAvgCost < 0) {
      setEditStockError('❌ Giá vốn trung bình không được âm.')
      return
    }
    if (editStockThreshold < 0) {
      setEditStockError('❌ Định mức cảnh báo không được âm.')
      return
    }

    try {
      setEditStockLoading(true)
      setEditStockError(null)
      const res = await inventoryService.updateInventory(editingStockItem._id, {
        quantity: Math.floor(editStockQuantity),
        averageCost: editStockAvgCost,
        lowStockThreshold: Math.floor(editStockThreshold),
      })

      if (res.success) {
        setEditStockSuccess(true)
        setTimeout(() => {
          setEditStockSuccess(false)
          setIsEditStockModalOpen(false)
          setEditingStockItem(null)
          fetchInventory() // Refresh stock list
        }, 1500)
      } else {
        setEditStockError('❌ ' + (res.message || 'Không thể cập nhật tồn kho.'))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi cập nhật tồn kho.'
      setEditStockError('❌ ' + msg)
    } finally {
      setEditStockLoading(false)
    }
  }

  // Delete manual stock confirmation and execution
  const handleDeleteStockClick = (item: Inventory) => {
    setDeleteConfirmItem(item)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return
    setIsDeleteConfirmOpen(false)
    try {
      setStockLoading(true)
      const res = await inventoryService.deleteInventory(deleteConfirmItem._id)
      if (res.success) {
        fetchInventory()
      } else {
        setStockError('❌ ' + (res.message || 'Không thể xóa tồn kho.'))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi xóa tồn kho.'
      setStockError('❌ ' + msg)
    } finally {
      setStockLoading(false)
      setDeleteConfirmItem(null)
    }
  }

  // Submit new import receipt
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation 1: Check branch selection
    if (!importBranchId) {
      setImportError('❌ Vui lòng chọn chi nhánh nhập hàng.')
      return
    }

    // Validation 1.5: Check if list has items
    if (importItems.length === 0) {
      setImportError('❌ Vui lòng tìm và chọn ít nhất một sản phẩm để nhập kho.')
      return
    }

    // Validation 2: Check if any product is empty
    const hasEmptyProduct = importItems.some((item) => !item.productId)
    if (hasEmptyProduct) {
      setImportError('❌ Vui lòng chọn đầy đủ sản phẩm cho mỗi dòng nhập.')
      return
    }

    // Validation 3: Check for duplicate products
    const productIds = importItems.map(item => item.productId)
    const hasDuplicates = productIds.some((id, index) => productIds.indexOf(id) !== index)
    if (hasDuplicates) {
      setImportError('❌ Không được chọn trùng sản phẩm. Vui lòng gộp số lượng hoặc xóa dòng trùng.')
      return
    }

    // Validation 4: Check quantity > 0
    const hasInvalidQuantity = importItems.some((item) => item.quantity <= 0)
    if (hasInvalidQuantity) {
      setImportError('❌ Số lượng nhập phải lớn hơn 0.')
      return
    }

    // Validation 5: Check unitCost >= 0
    const hasInvalidCost = importItems.some((item) => item.unitCost < 0)
    if (hasInvalidCost) {
      setImportError('❌ Giá vốn không được âm.')
      return
    }

    // Validation 6: Warning for zero cost
    const hasZeroCost = importItems.some((item) => item.unitCost === 0)
    if (hasZeroCost) {
      const confirmed = await new Promise<boolean>((resolve) => {
        setZeroCostResolve(() => resolve)
        setShowZeroCostConfirm(true)
      })
      if (!confirmed) return
    }

    try {
      setImportLoading(true)
      setImportError(null)
      const res = await inventoryService.createImportReceipt({
        branchId: importBranchId,
        supplierName: supplierName.trim() || undefined,
        note: importNote.trim() || undefined,
        items: importItems.map((it) => ({
          productId: it.productId,
          quantity: Math.floor(it.quantity) || 1,
          unitCost: parseFloat(it.unitCost as any) || 0
        }))
      })

      if (res.success) {
        setImportSuccess(true)
        setSupplierName('')
        setImportNote('')
        setImportItems([])
        setTimeout(() => {
          setImportSuccess(false)
          setIsImportModalOpen(false)
          fetchReceipts() // refresh history
          fetchInventory() // refresh stock
        }, 1500)
      } else {
        setImportError('❌ ' + (res.message || 'Không thể tạo phiếu nhập kho.'))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi tạo phiếu nhập kho.'
      setImportError('❌ ' + msg)
    } finally {
      setImportLoading(false)
    }
  }

  // Click edit button
  const handleEditClick = (product: Product) => {
    setEditingProduct(product)
    const catId = product.categoryId ? (typeof product.categoryId === 'object' ? (product.categoryId as any)._id : String(product.categoryId)) : ''
    setProductForm({
      name: product.productName || product.name || '',
      sku: product.sku || '',
      costPrice: product.costPrice ?? 0,
      salePrice: product.price ?? product.salePrice ?? 0,
      unit: product.unit || 'item',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      categoryId: catId,
      status: (product.status === 'active' || product.status === true) ? 'active' : 'inactive'
    })
    setImageFile(null)
    setProductError(null)
    setProductSuccess(false)
    setIsProductModalOpen(true)
  }

  // Close product modal
  const handleCloseProductModal = () => {
    setIsProductModalOpen(false)
    setEditingProduct(null)
    setImageFile(null)
    setProductForm({
      name: '',
      sku: '',
      costPrice: 0,
      salePrice: 0,
      unit: 'item',
      description: '',
      imageUrl: '',
      categoryId: '',
      status: 'active'
    })
  }


  // Toggle activation status (Dừng bán / Mở bán lại)
  const handleToggleProductStatus = (product: Product) => {
    // Open custom confirm modal instead of window.confirm
    setToggleProductTarget(product)
    setIsToggleConfirmOpen(true)
  }

  const handleConfirmToggleProduct = async () => {
    const product = toggleProductTarget
    if (!product) return
    setIsToggleConfirmOpen(false)
    setToggleProductTarget(null)
    const isActive = product.status === 'active' || product.status === true

    try {
      setCatalogLoading(true)
      setCatalogError(null)

      let res
      if (isActive) {
        // Inactive means calling delete API
        res = await productService.deleteProduct(product._id)
      } else {
        // Active means calling PATCH API with status active
        res = await productService.updateProduct(product._id, { status: 'active' })
      }

      if (res.success) {
        fetchProducts() // refresh catalog list
      } else {
        setCatalogError('❌ ' + (res.message || `Không thể ${isActive ? 'dừng bán' : 'mở bán lại'} sản phẩm.`))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || `Lỗi khi thực hiện thao tác ${isActive ? 'dừng bán' : 'mở bán lại'}.`
      setCatalogError('❌ ' + msg)
    } finally {
      setCatalogLoading(false)
    }
  }

  // Submit new or edited master product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation 1: Required fields
    if (!productForm.name.trim()) {
      setProductError('❌ Tên sản phẩm là bắt buộc.')
      return
    }

    const inputSku = productForm.sku.trim().toUpperCase()
    if (inputSku) {
      // Validation 2: SKU format (chỉ cho phép chữ, số, gạch ngang và gạch dưới)
      const skuPattern = /^[A-Z0-9_-]+$/
      if (!skuPattern.test(inputSku)) {
        setProductError('❌ Mã SKU chỉ được chứa chữ IN HOA, số, gạch ngang (-) và gạch dưới (_).')
        return
      }

      // Validation 3: SKU length
      if (inputSku.length < 3) {
        setProductError('❌ Mã SKU phải có ít nhất 3 ký tự.')
        return
      }

      if (inputSku.length > 50) {
        setProductError('❌ Mã SKU không được quá 50 ký tự.')
        return
      }
    }

    // Validation 4: Product name length
    if (productForm.name.trim().length < 3) {
      setProductError('❌ Tên sản phẩm phải có ít nhất 3 ký tự.')
      return
    }

    if (productForm.name.trim().length > 200) {
      setProductError('❌ Tên sản phẩm không được quá 200 ký tự.')
      return
    }

    // Price validation removed as price is only set per-branch upon import

    // Validation 6: Category selection
    if (!productForm.categoryId) {
      const confirmed = await new Promise<boolean>((resolve) => {
        setSoftWarnResolve(() => resolve)
        setSoftWarnType('noCategory')
      })
      if (!confirmed) return
    }

    // Validation 7: Description length
    if (productForm.description.trim().length > 1000) {
      setProductError('❌ Mô tả sản phẩm không được quá 1000 ký tự.')
      return
    }

    // Validation 8: Image validation (nếu là file upload)
    if (imageFile) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validTypes.includes(imageFile.type)) {
        setProductError('❌ Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.')
        return
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (imageFile.size > maxSize) {
        setProductError('❌ Kích thước ảnh không được vượt quá 5MB.')
        return
      }
    }

    try {
      setProductLoading(true)
      setProductError(null)

      const payload: any = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() ? productForm.sku.trim().toUpperCase() : undefined,
        costPrice: productForm.costPrice,
        salePrice: productForm.salePrice,
        unit: productForm.unit || 'item',
        description: productForm.description.trim(),
        categoryId: productForm.categoryId || undefined,
        status: productForm.status
      }

      if (imageFile) {
        payload.image = imageFile
      } else if (productForm.imageUrl.trim()) {
        payload.imageUrl = productForm.imageUrl.trim()
      } else {
        payload.imageUrl = ''
      }

      let res
      if (editingProduct) {
        res = await productService.updateProduct(editingProduct._id, payload)
      } else {
        res = await productService.createProduct(payload)
      }

      if (res.success) {
        setProductSuccess(true)
        setProductForm({
          name: '',
          sku: '',
          costPrice: 0,
          salePrice: 0,
          unit: 'item',
          description: '',
          imageUrl: '',
          categoryId: '',
          status: 'active'
        })
        setImageFile(null)
        setTimeout(() => {
          setProductSuccess(false)
          setIsProductModalOpen(false)
          setEditingProduct(null)
          fetchProducts() // refresh catalog list
        }, 1500)
      } else {
        setProductError('❌ ' + (res.message || (editingProduct ? 'Không thể cập nhật sản phẩm.' : 'Không thể tạo sản phẩm.')))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (editingProduct ? 'Lỗi khi cập nhật sản phẩm.' : 'Lỗi khi tạo sản phẩm.')
      setProductError('❌ ' + msg)
    } finally {
      setProductLoading(false)
    }
  }

  // Calculate total cost of current import builder items
  const importTotalCost = importItems.reduce((acc, curr) => {
    return acc + (curr.quantity * curr.unitCost)
  }, 0)

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Back-Office</p>
          <h1 className="mt-1 text-2xl font-black text-on-surface sm:text-3xl">
            Quản lý Kho hàng & Nhập kho
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Quản lý tồn kho chi nhánh, phiếu nhập hàng và danh mục sản phẩm gốc.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'stock' && (
            <>
              <button
                onClick={() => {
                  fetchInventory()
                }}
                disabled={stockLoading}
                className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-outline px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={stockLoading ? 'animate-spin' : ''} />
                Làm mới
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${autoRefresh
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-container-low border-outline hover:bg-surface-container-high'
                  }`}
              >
                {autoRefresh ? 'Tự động: Bật' : 'Tự động: Tắt'}
              </button>

              <button
                onClick={exportStockToCSV}
                disabled={filteredStock.length === 0}
                className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-outline px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                Xuất Excel
              </button>


            </>
          )}
          {activeTab === 'import' && (
            <>
              <button
                onClick={exportReceiptsToCSV}
                disabled={receiptsStats.filtered.length === 0}
                className="flex items-center gap-2 rounded-lg bg-surface-container-low border border-outline px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50"
              >
                <Download size={16} />
                Xuất Excel
              </button>
              <button
                onClick={() => {
                  setImportError(null)
                  setImportSuccess(false)
                  setImportItems([])
                  setIsImportModalOpen(true)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 shadow-md hover:shadow-lg"
                type="button"
              >
                <PlusCircle size={18} />
                Tạo phiếu nhập kho
              </button>
            </>
          )}
          {activeTab === 'catalog' && (
            <div className="flex gap-2">
              <button
                onClick={handleToggleCrawler}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 ${isCrawling ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'
                  }`}
                type="button"
              >
                {isCrawling ? <Square size={18} /> : <Play size={18} />}
                {isCrawling ? 'Dừng cào dữ liệu' : 'Bật cào dữ liệu'}
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null)
                  setImageFile(null)
                  setProductForm({
                    name: '',
                    sku: '',
                    costPrice: 0,
                    salePrice: 0,
                    unit: 'item',
                    description: '',
                    imageUrl: '',
                    categoryId: '',
                    status: 'active'
                  })
                  setProductError(null)
                  setProductSuccess(false)
                  setIsProductModalOpen(true)
                }}
                disabled={isCrawling}
                className={`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 shadow-md hover:shadow-lg ${isCrawling ? 'opacity-50 cursor-not-allowed' : ''}`}
                type="button"
              >
                <Plus size={18} />
                Thêm sản phẩm mới
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── STATISTICS CARDS - Show for Stock and Import tabs ── */}
      {activeTab === 'stock' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Tổng SP trong kho
                </p>
                <p className="mt-1 text-2xl font-black text-blue-900">{inventoryStats.totalProducts}</p>
              </div>
              <div className="rounded-full bg-blue-200 p-3">
                <Box size={24} className="text-blue-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Cảnh báo hết hàng
                </p>
                <p className="mt-1 text-2xl font-black text-amber-900">{inventoryStats.lowStockItems}</p>
              </div>
              <div className="rounded-full bg-amber-200 p-3">
                <AlertTriangle size={24} className="text-amber-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  Hết hàng
                </p>
                <p className="mt-1 text-2xl font-black text-rose-900">{inventoryStats.outOfStock}</p>
              </div>
              <div className="rounded-full bg-rose-200 p-3">
                <TrendingDown size={24} className="text-rose-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Giá trị tồn kho
                </p>
                <p className="mt-1 text-lg font-black text-purple-900">{formatVND(inventoryStats.totalValue)}</p>
              </div>
              <div className="rounded-full bg-purple-200 p-3">
                <DollarSign size={24} className="text-purple-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Tổng phiếu nhập
                </p>
                <p className="mt-1 text-2xl font-black text-emerald-900">{receiptsStats.totalReceipts}</p>
              </div>
              <div className="rounded-full bg-emerald-200 p-3">
                <History size={24} className="text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Tổng sản phẩm nhập
                </p>
                <p className="mt-1 text-2xl font-black text-indigo-900">{receiptsStats.totalItems}</p>
              </div>
              <div className="rounded-full bg-indigo-200 p-3">
                <Package size={24} className="text-indigo-700" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-outline-variant bg-gradient-to-br from-purple-50 to-purple-100/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Tổng giá trị nhập
                </p>
                <p className="mt-1 text-lg font-black text-purple-900">{formatVND(receiptsStats.totalValue)}</p>
              </div>
              <div className="rounded-full bg-purple-200 p-3">
                <TrendingUp size={24} className="text-purple-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB SELECTOR ── */}
      <div className="border-b border-outline-variant flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'stock'
            ? 'border-primary text-primary font-black'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <Package size={18} />
          Báo cáo Tồn kho
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'import'
            ? 'border-primary text-primary font-black'
            : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
        >
          <History size={18} />
          Lịch sử Nhập kho
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'catalog'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
          >
            <Layers size={18} />
            Danh mục Sản phẩm gốc
          </button>
        )}
      </div>

      {/* ── TAB 1: STOCK REPORT ── */}
      {activeTab === 'stock' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filters Bar */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
            {/* Branch Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">Chi nhánh:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                disabled={isManagerOrStaff}
                className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Stock */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm tồn kho (tên, SKU)..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            </div>

            {/* Low stock checkbox filter */}
            <label className="flex items-center gap-2 text-sm text-on-surface font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterLowStock}
                onChange={(e) => setFilterLowStock(e.target.checked)}
                className="rounded text-primary focus:ring-primary bg-surface-container-low border-none h-4 w-4"
              />
              <span className="flex items-center gap-1 text-error">
                <AlertTriangle size={16} />
                Cảnh báo hết hàng / Sắp hết
              </span>
            </label>
          </section>

          {/* Table */}
          {stockError && (
            <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{stockError}</p>
            </div>
          )}

          {stockLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <Loader2 size={36} className="text-primary animate-spin mb-3" />
              <p className="text-sm text-on-surface-variant font-medium">Đang kiểm kho chi nhánh...</p>
            </div>
          ) : filteredStock.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
              <Package size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
              <h3 className="text-lg font-bold text-on-surface">Kho hàng rỗng hoặc không khớp bộ lọc</h3>
              <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
                Chưa có tồn kho của sản phẩm tại chi nhánh này, hoặc bộ lọc tìm kiếm của bạn không khớp.
                Thử chuyển qua tab **Lịch sử Nhập kho** để nhập lô hàng đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low/50">
                      <th className="p-4 font-bold text-on-surface-variant">Ảnh</th>
                      <th className="p-4 font-bold text-on-surface-variant">Mã SKU</th>
                      <th className="p-4 font-bold text-on-surface-variant">Tên Sản phẩm</th>
                      <th className="p-4 font-bold text-on-surface-variant">Đơn vị</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Số lượng tồn</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá bán trung bình</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá nhập gốc</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái kho</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {filteredStock.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold
                      return (
                        <tr key={item._id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="p-4">
                            <div className="w-10 h-10 bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
                              {item.productId?.imageUrl ? (
                                <img
                                  src={item.productId.imageUrl}
                                  alt={item.productId.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={18} className="text-on-surface-variant opacity-60" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-on-surface">
                            {item.productId?.sku || 'N/A'}
                          </td>
                          <td className="p-4 font-bold text-on-surface max-w-xs truncate">
                            {item.productId?.productName || item.productId?.name}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {item.productId?.unit || 'item'}
                          </td>
                          <td className={`p-4 font-black text-right text-headline-sm ${isLow ? 'text-error' : 'text-on-surface'}`}>
                            {item.quantity}
                          </td>
                          <td className="p-4 text-right font-semibold text-on-surface-variant">
                            {formatVND(item.averageCost ?? 0)}
                          </td>
                          <td className="p-4 text-right font-semibold text-on-surface-variant">
                            {formatVND(item.productId?.price ?? item.productId?.salePrice ?? 0)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isLow
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-success-container text-on-success-container'
                                }`}
                            >
                              {isLow ? (
                                <>
                                  <AlertTriangle size={12} />
                                  Cảnh báo hết
                                </>
                              ) : (
                                <>
                                  <Check size={12} />
                                  Đủ hàng
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditStockClick(item)}
                                className="rounded-lg p-2 text-primary hover:bg-primary-container/20 transition-colors"
                                title="Chỉnh sửa tồn kho"
                                type="button"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStockClick(item)}
                                className="rounded-lg p-2 text-error hover:bg-error-container/20 transition-colors"
                                title="Xóa tồn kho"
                                type="button"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: IMPORT RECEIPTS HISTORY ── */}
      {activeTab === 'import' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Branch Selector and Search for imports */}
          <section className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">Lọc theo chi nhánh:</span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  disabled={isManagerOrStaff}
                  className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isManagerOrStaff ? null : <option value="">Tất cả chi nhánh</option>}
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Tìm phiếu nhập (mã phiếu, NCC)..."
                  value={receiptsSearch}
                  onChange={(e) => setReceiptsSearch(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition-all text-sm"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
              </div>
            </div>

            {/* Date Range Filter - Collapsible */}
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm overflow-hidden">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-primary" />
                  <span className="text-sm font-bold text-on-surface">Lọc theo thời gian nhập kho</span>
                  {(startDate || endDate) && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Đang áp dụng
                    </span>
                  )}
                </div>
                <Calendar size={16} className={`text-on-surface-variant transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
              </button>

              {showDateFilter && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border-t border-outline-variant bg-surface-container-low/30">
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-lg border border-outline bg-transparent py-2 px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-lg border border-outline bg-transparent py-2 px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setStartDate('')
                        setEndDate('')
                      }}
                      className="w-full rounded-lg border border-outline bg-surface-container-low px-4 py-2 text-sm font-bold hover:bg-surface-container-high transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {receiptsError && (
            <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{receiptsError}</p>
            </div>
          )}

          {receiptsLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <Loader2 size={36} className="text-primary animate-spin mb-3" />
              <p className="text-sm text-on-surface-variant font-medium">Đang tải lịch sử nhập hàng...</p>
            </div>
          ) : receiptsStats.filtered.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
              <History size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
              <h3 className="text-lg font-bold text-on-surface">Chưa có phiếu nhập kho nào</h3>
              <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
                Nhấp vào nút **"Tạo phiếu nhập kho"** ở góc phải màn hình để thực hiện đợt nhập hàng đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low/50">
                      <th className="p-4 font-bold text-on-surface-variant">Mã phiếu</th>
                      <th className="p-4 font-bold text-on-surface-variant">Chi nhánh</th>
                      <th className="p-4 font-bold text-on-surface-variant">Nhà cung cấp</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Tổng giá trị</th>
                      <th className="p-4 font-bold text-on-surface-variant">Người tạo</th>
                      <th className="p-4 font-bold text-on-surface-variant">Ngày nhập</th>
                      <th className="p-4 font-bold text-on-surface-variant">Chi tiết sản phẩm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {receiptsStats.filtered.map((rec) => {
                      const branchName = typeof rec.branchId === 'object' ? rec.branchId.name : 'N/A'
                      const creatorName = typeof rec.createdBy === 'object' ? rec.createdBy.fullName : 'System'
                      return (
                        <tr key={rec._id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">
                            {rec.code}
                          </td>
                          <td className="p-4 font-bold text-on-surface">
                            {branchName}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {rec.supplierName || <span className="italic opacity-50">Không rõ</span>}
                          </td>
                          <td className="p-4 text-right font-black text-primary">
                            {formatVND(rec.totalCost)}
                          </td>
                          <td className="p-4 text-on-surface-variant font-medium">
                            {creatorName}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {new Date(rec.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 max-w-xs">
                            <div className="space-y-1 text-xs">
                              {rec.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between gap-2 text-[11px] text-on-surface-variant">
                                  <span className="truncate font-semibold max-w-[150px]">
                                    {it.productId?.productName || 'Sản phẩm'}
                                  </span>
                                  <span>
                                    x{it.quantity} ({formatVND(it.unitCost)})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PRODUCT CATALOG ── */}
      {activeTab === 'catalog' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Catalog */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Tìm sản phẩm trong danh mục gốc (tên, SKU)..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl py-2.5 px-5 pl-11 focus:ring-2 focus:ring-primary transition-all text-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            </div>
          </section>

          {catalogError && (
            <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{catalogError}</p>
            </div>
          )}

          {catalogLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <Loader2 size={36} className="text-primary animate-spin mb-3" />
              <p className="text-sm text-on-surface-variant font-medium">Đang tải danh mục gốc...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
              <Package size={48} className="mx-auto mb-4 text-on-surface-variant opacity-60" />
              <h3 className="text-lg font-bold text-on-surface">Không có sản phẩm nào</h3>
              <p className="mt-2 text-sm text-on-surface-variant max-w-sm mx-auto">
                Danh mục sản phẩm của hệ thống hiện đang trống. Nhấp nút **"Thêm sản phẩm mới"** để bắt đầu định nghĩa sản phẩm đầu tiên.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low/50">
                      <th className="p-4 font-bold text-on-surface-variant text-center">STT</th>
                      <th className="p-4 font-bold text-on-surface-variant">Ảnh</th>
                      <th className="p-4 font-bold text-on-surface-variant">Mã SKU</th>
                      <th className="p-4 font-bold text-on-surface-variant">Tên Sản phẩm</th>
                      <th className="p-4 font-bold text-on-surface-variant">Danh mục</th>
                      <th className="p-4 font-bold text-on-surface-variant">Đơn vị</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá nhập gốc</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái bán</th>
                      <th className="p-4 font-bold text-on-surface-variant">Mô tả chi tiết</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {products.map((product, idx) => {
                      const isActive = product.status === 'active' || product.status === true
                      const catId = product.categoryId ? (typeof product.categoryId === 'object' ? (product.categoryId as any)._id : String(product.categoryId)) : ''
                      const matchedCat = categories.find(c => c._id === catId)
                      return (
                        <tr key={product._id} className="hover:bg-surface-container-low/20 transition-colors">
                          <td className="p-4 text-center font-semibold text-on-surface-variant">
                            {idx + 1}
                          </td>
                          <td className="p-4">
                            <div className="w-10 h-10 bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={18} className="text-on-surface-variant opacity-60" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-on-surface">
                            {product.sku}
                          </td>
                          <td className="p-4 font-bold text-on-surface max-w-xs truncate">
                            {product.productName}
                          </td>
                          <td className="p-4 text-on-surface-variant font-medium">
                            {matchedCat ? matchedCat.name : <span className="italic opacity-40 text-xs">Chưa phân loại</span>}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {product.unit || 'item'}
                          </td>
                          <td className="p-4 text-right font-black text-primary">
                            {formatVND(product.price ?? 0)}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive
                                ? 'bg-success-container text-on-success-container'
                                : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                            >
                              {isActive ? 'Đang bán' : 'Dừng bán'}
                            </span>
                          </td>
                          <td className="p-4 text-on-surface-variant max-w-xs truncate">
                            {product.description || <span className="italic opacity-40 text-xs">Chưa cập nhật mô tả</span>}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(product)}
                                className="rounded-lg p-2 text-primary hover:bg-primary-container/20 transition-colors"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleToggleProductStatus(product)}
                                disabled={isCrawling}
                                className={`rounded-lg p-2 transition-colors ${isCrawling ? 'opacity-50 cursor-not-allowed' : ''} ${isActive
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-success hover:bg-success-container/20'
                                  }`}
                                title={isActive ? 'Dừng bán sản phẩm' : 'Kích hoạt lại sản phẩm'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
                <div className="text-xs font-semibold text-on-surface-variant">
                  Trang <span className="font-bold text-on-surface">{catalogPage}</span> / {catalogTotalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={catalogPage <= 1 || catalogLoading}
                    onClick={() => setCatalogPage((prev) => Math.max(prev - 1, 1))}
                    className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={catalogPage >= catalogTotalPages || catalogLoading}
                    onClick={() => setCatalogPage((prev) => Math.min(prev + 1, catalogTotalPages))}
                    className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE IMPORT RECEIPT MODAL ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <History size={20} className="text-primary" />
                Lập Phiếu Nhập Kho Mới
              </h2>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {importError && (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{importError}</p>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-3 p-4 bg-success-container text-on-success-container rounded-xl border border-success/20">
                  <Check size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">Tạo phiếu và cập nhật tồn kho thành công!</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chi nhánh nhận */}
                <div className="space-y-1.5">
                  <label htmlFor="importBranchId" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Nhập tại Chi nhánh <span className="text-error">*</span>
                  </label>
                  <select
                    id="importBranchId"
                    value={importBranchId}
                    onChange={(e) => setImportBranchId(e.target.value)}
                    required
                    disabled={isManagerOrStaff}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nhà cung cấp */}
                <div className="space-y-1.5">
                  <label htmlFor="supplierName" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Tên Nhà cung cấp (Supplier)
                  </label>
                  <input
                    type="text"
                    id="supplierName"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Ví dụ: Công ty Cổ phần Thực phẩm CP"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>
              </div>

              {/* Select Product Dropdown */}
              <div className="space-y-1.5">
                <label htmlFor="importProductSelect" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                  <Package size={14} className="text-primary" />
                  Chọn sản phẩm cần nhập <span className="text-error">*</span>
                </label>
                <select
                  id="importProductSelect"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) return
                    const matchedProduct = activeProducts.find((p) => p._id === val)
                    if (matchedProduct) {
                      handleQuickAddProduct(matchedProduct)
                    }
                  }}
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-primary text-sm font-semibold transition-all shadow-sm"
                >
                  <option value="">-- Chọn sản phẩm từ danh sách --</option>
                  {activeProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName || p.name} ({p.sku}) - {p.unit || 'cái'} - {formatVND(p.price || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-sm font-black text-on-surface flex items-center gap-2">
                    Danh sách hàng nhập ({importItems.length} sản phẩm)
                  </span>
                  {importItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearImportItems}
                      className="text-xs font-bold text-error hover:underline flex items-center gap-1.5"
                    >
                      <Trash2 size={12} />
                      Xóa tất cả
                    </button>
                  )}
                </div>

                {importItems.length === 0 ? (
                  <div className="text-center py-10 bg-surface-container-low/20 rounded-2xl border border-dashed border-outline-variant/60 px-4">
                    <Box size={32} className="mx-auto mb-2 text-on-surface-variant opacity-40 animate-pulse" />
                    <p className="text-xs font-medium text-on-surface-variant max-w-sm mx-auto leading-relaxed">
                      Chưa chọn sản phẩm nào. Hãy tìm kiếm sản phẩm bằng thanh tìm kiếm ở trên để thêm vào phiếu nhập kho.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-outline-variant rounded-xl bg-surface-container-lowest shadow-sm">
                    <div className="overflow-x-auto animate-in fade-in duration-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low/50">
                            <th className="p-3 font-bold text-on-surface-variant whitespace-nowrap">Sản phẩm</th>
                            <th className="p-3 font-bold text-on-surface-variant text-center w-24 whitespace-nowrap">Số lượng</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right w-28 whitespace-nowrap">Giá nhập gốc</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right w-28 whitespace-nowrap">Giá gợi ý AI</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right w-32 whitespace-nowrap">Giá bán thực tế (đ)</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right w-28 whitespace-nowrap">Thành tiền</th>
                            <th className="p-3 font-bold text-on-surface-variant text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/50">
                          {importItems.map((item, idx) => {
                            const pInfo = activeProducts.find((p) => p._id === item.productId);
                            const name = pInfo?.productName || 'Sản phẩm';
                            const sku = pInfo?.sku || 'N/A';
                            const unit = pInfo?.unit || 'cái';
                            const costPrice = pInfo?.price || pInfo?.salePrice || 0;
                            const isLoss = item.unitCost > 0 && item.unitCost < costPrice;

                            return (
                              <tr key={idx} className="hover:bg-surface-container-low/20 transition-colors align-middle">
                                {/* Product info */}
                                <td className="p-3 min-w-[180px]">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 bg-surface-container-low rounded overflow-hidden border border-outline-variant flex items-center justify-center shrink-0">
                                      {pInfo?.imageUrl ? (
                                        <img src={pInfo.imageUrl} alt={name} className="w-full h-full object-cover" />
                                      ) : (
                                        <Package size={14} className="text-on-surface-variant opacity-60" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-on-surface truncate max-w-[180px]" title={name}>{name}</p>
                                      <p className="text-[10px] text-on-surface-variant font-mono">{sku} | Đơn vị: {unit}</p>
                                    </div>
                                  </div>
                                </td>

                                {/* Quantity stepper */}
                                <td className="p-3 text-center">
                                  <div className="inline-flex items-center border border-outline rounded-lg overflow-hidden bg-surface-container-low shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => updateImportItemRow(idx, 'quantity', Math.max(1, item.quantity - 1))}
                                      className="p-1.5 hover:bg-surface-container-high text-on-surface-variant active:bg-outline/25 transition-colors border-r border-outline"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <input
                                      type="number"
                                      min="1"
                                      required
                                      value={item.quantity}
                                      onChange={(e) => updateImportItemRow(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-10 bg-transparent border-none text-center font-bold text-xs p-1 focus:ring-0 outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateImportItemRow(idx, 'quantity', item.quantity + 1)}
                                      className="p-1.5 hover:bg-surface-container-high text-on-surface-variant active:bg-outline/25 transition-colors border-l border-outline"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                </td>

                                {/* Static Cost Price (Giá nhập gốc) */}
                                <td className="p-3 text-right font-medium text-on-surface-variant whitespace-nowrap">
                                  {formatVND(costPrice)}
                                </td>

                                {/* AI Suggested Price */}
                                <td className="p-3 text-right font-bold text-secondary font-mono whitespace-nowrap">
                                  {formatVND(pInfo?.suggestedPrice || Math.round(costPrice * 0.95))}
                                </td>

                                {/* Unit Cost input (Giá bán thực tế) */}
                                <td className="p-3 text-right">
                                  <div className="flex flex-col items-end justify-center w-full">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      required
                                      value={item.unitCost}
                                      onChange={(e) => updateImportItemRow(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                                      className="w-24 bg-surface-container-low border border-outline rounded-lg py-1 px-2 text-right font-bold text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                                    />
                                    {isLoss && costPrice > 0 && (
                                      <div className="text-[10px] text-error font-medium flex items-center justify-end gap-1 mt-1 leading-tight whitespace-nowrap animate-pulse">
                                        <AlertTriangle size={10} className="shrink-0" />
                                        Thấp hơn giá nhập ({formatVND(costPrice)})
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Row Subtotal (Quantity * Cost Price) */}
                                <td className="p-3 text-right font-black text-primary text-sm whitespace-nowrap">
                                  {formatVND(item.quantity * costPrice)}
                                </td>

                                {/* Delete Action */}
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeImportItemRow(idx)}
                                    className="rounded-lg p-1.5 text-error hover:bg-error-container/30 hover:text-error transition-colors"
                                    title="Xóa dòng"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Note */}
              <div className="space-y-1.5 pt-2">
                <label htmlFor="importNote" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Ghi chú phiếu nhập
                </label>
                <textarea
                  id="importNote"
                  rows={2}
                  value={importNote}
                  onChange={(e) => setImportNote(e.target.value)}
                  placeholder="Lý do nhập hàng, tên nhân viên giao hàng, ghi chú chất lượng..."
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                />
              </div>

              {/* Summary and Action Buttons */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant">
                <div className="text-sm font-medium">
                  Tổng chi phí đợt nhập: <span className="text-lg font-black text-primary">{formatVND(importTotalCost)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    disabled={importLoading}
                    className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={importLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Đang tạo phiếu...
                      </>
                    ) : (
                      'Xác nhận nhập kho'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE MASTER PRODUCT MODAL ── */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Layers size={20} className="text-primary" />
                {editingProduct ? 'Chỉnh Sửa Thông Tin Sản Phẩm' : 'Thêm Sản Phẩm Mới Vào Hệ Thống'}
              </h2>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {productError && (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{productError}</p>
                </div>
              )}

              {productSuccess && (
                <div className="flex items-center gap-3 p-4 bg-success-container text-on-success-container rounded-xl border border-success/20">
                  <Check size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">
                    {editingProduct ? 'Cập nhật sản phẩm thành công!' : 'Tạo sản phẩm gốc thành công!'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tên sản phẩm */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Tên sản phẩm <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="prod-name"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="Ví dụ: Táo Mỹ Gala"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

                {/* SKU */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-sku" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Mã SKU (Tự sinh nếu để trống)
                  </label>
                  <input
                    type="text"
                    id="prod-sku"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    placeholder="Hệ thống tự động sinh mã nếu bỏ trống"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-mono transition-all"
                  />
                </div>
              </div>

              {/* Price inputs removed: cost/selling prices are set per-branch during import/inventory setup */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Đơn vị tính */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-unit" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    id="prod-unit"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="Ví dụ: túi, kg, hộp"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

                {/* Trạng thái bán */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-status" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Trạng thái bán
                  </label>
                  <select
                    id="prod-status"
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Dừng bán</option>
                  </select>
                </div>
              </div>

              {/* Danh mục sản phẩm */}
              <div className="space-y-1.5">
                <label htmlFor="prod-category" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Danh mục sản phẩm
                </label>
                <select
                  id="prod-category"
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
                >
                  <option value="">-- Chọn danh mục sản phẩm --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name} ({cat.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tải ảnh hoặc Nhập Link ảnh */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="prod-img-file" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Tải ảnh từ máy tính (Upload)
                  </label>
                  <input
                    type="file"
                    id="prod-img-file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImageFile(e.target.files[0])
                        setProductForm({ ...productForm, imageUrl: '' }) // Clear text URL if file chosen
                      }
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl py-2 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="prod-img" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Hoặc dùng Link ảnh trực tiếp
                  </label>
                  <input
                    type="url"
                    id="prod-img"
                    value={productForm.imageUrl}
                    onChange={(e) => {
                      setProductForm({ ...productForm, imageUrl: e.target.value })
                      setImageFile(null) // Clear file if text URL chosen
                    }}
                    placeholder="https://example.com/apple.png"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>
              </div>

              {/* Mô tả */}
              <div className="space-y-1.5">
                <label htmlFor="prod-desc" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Mô tả sản phẩm
                </label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Mô tả thông tin dinh dưỡng, nguồn gốc sản phẩm..."
                  className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  disabled={productLoading}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={productLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {productLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    editingProduct ? 'Lưu thay đổi' : 'Tạo sản phẩm'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── EDIT STOCK MODAL ── */}
      {isEditStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Pencil size={20} className="text-primary" />
                Cập nhật tồn kho sản phẩm
              </h2>
              <button
                type="button"
                onClick={() => setIsEditStockModalOpen(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditStockSubmit} className="p-6 space-y-4">
              {editStockError && (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{editStockError}</p>
                </div>
              )}

              {editStockSuccess && (
                <div className="flex items-center gap-3 p-4 bg-success-container text-on-success-container rounded-xl border border-success/20">
                  <Check size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">Cập nhật thông tin tồn kho thành công!</p>
                </div>
              )}

              {/* Sản phẩm info */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Sản phẩm & Chi nhánh
                </label>
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                  <div className="w-10 h-10 bg-surface rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center shrink-0">
                    {editingStockItem?.productId?.imageUrl ? (
                      <img
                        src={editingStockItem.productId.imageUrl}
                        alt={editingStockItem.productId.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={18} className="text-on-surface-variant opacity-60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {editingStockItem?.productId?.productName || editingStockItem?.productId?.name}
                    </p>
                    <p className="text-xs text-on-surface-variant font-mono">
                      SKU: {editingStockItem?.productId?.sku || 'N/A'} | Chi nhánh: {branches.find(b => b._id === selectedBranchId)?.name || 'Chi nhánh'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thông số tồn kho */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Số lượng - Chỉ đọc */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Số lượng tồn (Chỉ đọc)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editStockQuantity}
                    className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-xl py-3 px-4 text-sm font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                  />
                </div>

                {/* Giá vốn trung bình - Chỉ đọc */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Giá bán trung bình (Chỉ đọc)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formatVND(editStockAvgCost)}
                    className="w-full bg-surface-container-low/50 border border-outline-variant/30 rounded-xl py-3 px-4 text-sm font-bold text-on-surface-variant opacity-75 cursor-not-allowed"
                  />
                </div>

                {/* Định mức cảnh báo */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-threshold" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Cảnh báo tồn ít <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="edit-threshold"
                    min="0"
                    step="1"
                    required
                    value={editStockThreshold}
                    onChange={(e) => setEditStockThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-bold transition-all"
                  />
                </div>
              </div>

              <div className="text-[11px] leading-relaxed text-on-surface-variant font-medium bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                💡 **Lưu ý:** Để đảm bảo lịch sử giao dịch chính xác, số lượng tồn kho và giá vốn chỉ thay đổi khi tạo **Phiếu Nhập Kho** hoặc thực hiện bán hàng/đặt hàng.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsEditStockModalOpen(false)}
                  disabled={editStockLoading}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editStockLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {editStockLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CRAWLER STOP CONFIRM MODAL */}
      {showCrawlerStopConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl">
            <h3 className="mb-2 text-xl font-black text-on-surface">Xác nhận dừng</h3>
            <p className="mb-6 text-on-surface-variant">
              Việc dừng cào dữ liệu sẽ ngắt các tab trình duyệt ngay lập tức. Những sản phẩm đang lấy dở sẽ không được lưu. Bạn có chắc chắn muốn dừng?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCrawlerStopConfirm(false)}
                className="rounded-xl px-4 py-2 font-bold text-on-surface hover:bg-surface-container"
              >
                Hủy
              </button>
              <button
                onClick={confirmStopCrawler}
                className="rounded-xl bg-error px-4 py-2 font-bold text-white hover:bg-error/90 shadow-md"
              >
                Dừng ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Inventory Confirm Modal ── */}
      {isDeleteConfirmOpen && deleteConfirmItem && (() => {
        const productName = deleteConfirmItem.productId?.productName || deleteConfirmItem.productId?.name || 'sản phẩm'
        const branchName = branches.find(b => b._id === selectedBranchId)?.name || 'chi nhánh'
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
                <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                  <Trash2 size={20} className="text-error" />
                  Xác nhận xóa tồn kho
                </h2>
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4">

                {/* Sản phẩm info */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Sản phẩm &amp; Chi nhánh
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                    <div className="w-10 h-10 bg-surface rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center shrink-0">
                      {deleteConfirmItem.productId?.imageUrl ? (
                        <img
                          src={deleteConfirmItem.productId.imageUrl}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={18} className="text-on-surface-variant opacity-60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{productName}</p>
                      <p className="text-xs text-on-surface-variant font-mono">
                        SKU: {deleteConfirmItem.productId?.sku || 'N/A'} | Chi nhánh: {branchName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Warning note */}
                <div className="text-[11px] leading-relaxed text-on-surface-variant font-medium bg-error-container/30 p-3 rounded-xl border border-error/20">
                  ⚠️ **Cảnh báo:** Hành động này sẽ **xóa vĩnh viễn** bản ghi tồn kho của sản phẩm này tại chi nhánh. Số lượng tồn kho, giá vốn và định mức cảnh báo liên quan sẽ **biến mất hoàn toàn** và không thể khôi phục.
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-error px-6 py-3 text-sm font-bold text-white transition-all hover:bg-error/90 active:scale-95"
                  >
                    <Trash2 size={16} />
                    Xóa tồn kho
                  </button>
                </div>
              </div>

            </div>
          </div>
        )
      })()}

      {/* ── Zero Cost Import Confirm ── */}
      {showZeroCostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                Xác nhận giá vốn = 0đ
              </h2>
              <button type="button" onClick={() => { setShowZeroCostConfirm(false); zeroCostResolve?.(false); setZeroCostResolve(null) }} className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-[11px] leading-relaxed text-on-surface-variant font-medium bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                💡 Một số sản phẩm trong phiếu có giá vốn = 0đ. Đây có thể là hàng khuyến mãi hoặc hàng tặng kèm.
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => { setShowZeroCostConfirm(false); zeroCostResolve?.(false); setZeroCostResolve(null) }} className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">Hủy</button>
                <button type="button" onClick={() => { setShowZeroCostConfirm(false); zeroCostResolve?.(true); setZeroCostResolve(null) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95">Tiếp tục</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle Product Status Confirm ── */}
      {isToggleConfirmOpen && toggleProductTarget && (() => {
        const product = toggleProductTarget
        const isActive = product.status === 'active' || product.status === true
        const pName = product.productName || product.name || 'sản phẩm'
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
                <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                  {isActive
                    ? <><Square size={20} className="text-error" /> Dừng bán sản phẩm</>
                    : <><Play size={20} className="text-primary" /> Mở bán lại sản phẩm</>
                  }
                </h2>
                <button type="button" onClick={() => { setIsToggleConfirmOpen(false); setToggleProductTarget(null) }} className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sản phẩm</label>
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/60">
                    <div className="w-10 h-10 bg-surface rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center shrink-0">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={pName} className="w-full h-full object-cover" />
                        : <Package size={18} className="text-on-surface-variant opacity-60" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{pName}</p>
                      <p className="text-xs text-on-surface-variant font-mono">SKU: {product.sku || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className={`text-[11px] leading-relaxed font-medium p-3 rounded-xl border space-y-0.5 ${isActive ? 'bg-error-container/30 border-error/20 text-on-surface-variant' : 'bg-surface-container-low border-outline-variant/60 text-on-surface-variant'}`}>
                  {isActive ? (
                    <><p className="font-bold text-error mb-1">Khi dừng bán:</p><p>• Sản phẩm sẽ bị ẩn khỏi danh sách bán hàng</p><p>• Khách hàng không thể đặt mua sản phẩm này</p><p>• Có thể kích hoạt lại bất cứ lúc nào</p></>
                  ) : (
                    <><p className="font-bold text-primary mb-1">Khi mở bán lại:</p><p>• Sản phẩm sẽ xuất hiện trong danh sách bán hàng</p><p>• Khách hàng có thể đặt mua sản phẩm này</p></>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button type="button" onClick={() => { setIsToggleConfirmOpen(false); setToggleProductTarget(null) }} className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">Hủy</button>
                  <button type="button" onClick={handleConfirmToggleProduct} className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all active:scale-95 ${isActive ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-opacity-90'}`}>
                    {isActive ? <><Square size={16} /> Dừng bán</> : <><Play size={16} /> Mở bán lại</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Product Form Soft Warnings (zero price / no category) ── */}
      {softWarnType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                {softWarnType === 'zeroPrice' ? 'Giá nhập gốc bằng 0đ' : 'Chưa chọn danh mục'}
              </h2>
              <button type="button" onClick={() => { setSoftWarnType(null); softWarnResolve?.(false); setSoftWarnResolve(null) }} className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-[11px] leading-relaxed text-on-surface-variant font-medium bg-surface-container-low p-3 rounded-xl border border-outline-variant/60">
                {softWarnType === 'zeroPrice'
                  ? '💡 Giá nhập gốc đang là 0đ. Sản phẩm này sẽ có giá mặc định là 0đ. Bạn vẫn có thể chỉnh sửa sau khi tạo.'
                  : '💡 Bạn chưa chọn danh mục cho sản phẩm. Sản phẩm không có danh mục sẽ khó quản lý và tìm kiếm hơn.'
                }
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => { setSoftWarnType(null); softWarnResolve?.(false); setSoftWarnResolve(null) }} className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">Quay lại</button>
                <button type="button" onClick={() => { setSoftWarnType(null); softWarnResolve?.(true); setSoftWarnResolve(null) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95">Tiếp tục</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
