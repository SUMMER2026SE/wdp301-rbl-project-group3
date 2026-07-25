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
  Play,
  Square,
  Bot,
  Minus,
  Sparkles,
  Clock,
  UserCheck,
  ShieldCheck,
  ShieldX,
  ShieldAlert
} from 'lucide-react'
import apiClient from '@/services/api';
import { inventoryService } from '@services/inventoryService'
import { branchService } from '@services/branchService'
import { productService } from '@services/productService'
import { categoryService } from '@services/categoryService'
import { competitorProductService } from '@services/competitorProductService'
import { useAuth } from '@hooks/useAuth'
import type { Inventory, ImportReceipt, Branch, Product, Category, CompetitorProduct } from '@/types'
import { notify } from '../../utils/toast';
import { useSocket } from '../../contexts/SocketContext';

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManageInventoryPage = () => {
  const { user, loading: authLoading } = useAuth()
  const { socket } = useSocket()
  const isManagerOrStaff = user?.role === 'branch_manager' || user?.role === 'staff'
  const userBranchId = user?.branchId || ''
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState<'stock' | 'import' | 'catalog' | 'crawled'>('stock')

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
  const [importProductSearch, setImportProductSearch] = useState('')
  const [importItems, setImportItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([])

  // Optimized Stock-In autocomplete & historical lookup states
  const [activeProducts, setActiveProducts] = useState<Product[]>([])
  const [importBranchInventory, setImportBranchInventory] = useState<Inventory[]>([])

  // Verification states
  const [viewingReceipt, setViewingReceipt] = useState<ImportReceipt | null>(null)
  const [verifiedQuantities, setVerifiedQuantities] = useState<Record<string, number>>({})
  const [verificationNote, setVerificationNote] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Approval states (Admin only) — UC mới: duyệt/từ chối phiếu nhập kho
  const [approveLoading, setApproveLoading] = useState(false)
  const [approveError, setApproveError] = useState<string | null>(null)
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)
  const [rejectError, setRejectError] = useState<string | null>(null)

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
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false)
  const [suggestReason, setSuggestReason] = useState('')

  // Crawler states
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledCount, setCrawledCount] = useState<number>(0);
  const [lastCrawledProduct, setLastCrawledProduct] = useState<string>('');
  const [showCrawlerStopConfirm, setShowCrawlerStopConfirm] = useState(false);

  // Tab 4: Crawled Products states
  const [crawledProducts, setCrawledProducts] = useState<CompetitorProduct[]>([])
  const [crawledLoading, setCrawledLoading] = useState(false)
  const [crawledError, setCrawledError] = useState<string | null>(null)
  const [crawledKeyword, setCrawledKeyword] = useState('')
  const [crawledPage, setCrawledPage] = useState(1)
  const [crawledTotalPages, setCrawledTotalPages] = useState(1)
  const [crawledTotalItems, setCrawledTotalItems] = useState(0)

  const [crawledSelectedIds, setCrawledSelectedIds] = useState<string[]>([])
  const [crawledImporting, setCrawledImporting] = useState(false)
  const [crawledImportSuccessMsg, setCrawledImportSuccessMsg] = useState<string | null>(null)

  // Bulk price suggestion states
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([])
  const [isBulkSuggesting, setIsBulkSuggesting] = useState(false)
  const [showBulkSuggestModal, setShowBulkSuggestModal] = useState(false)
  const [bulkSuggestResults, setBulkSuggestResults] = useState<Array<{
    productId: string;
    productName: string;
    costPrice: number;
    currentPrice: number;
    suggestedPrice: number;
    confidence: number;
    reason: string;
    floorPrice: number;
    categoryId: string;
    sku?: string;
    selected: boolean;
  }>>([])
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false)

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


  // Lắng nghe sự kiện cào dữ liệu thời gian thực từ Socket.io
  useEffect(() => {
    if (!socket) return

    const handleCrawlerStatus = (data: { isRunning: boolean; crawledCount: number; error?: string }) => {
      console.log('Realtime crawler status:', data)
      setIsCrawling(data.isRunning)
      if (data.crawledCount !== undefined) {
        setCrawledCount(data.crawledCount)
      }
      if (data.error) {
        notify.error(`Lỗi Bot Cào: ${data.error}`)
      } else if (!data.isRunning) {
        notify.success('Bot cào dữ liệu đã hoàn thành nhiệm vụ!')
      }
      
      if (activeTab === 'crawled') {
        fetchCrawledProducts(1, crawledKeyword)
      }
    }

    const handleCrawlerProgress = (data: { isRunning: boolean; crawledCount: number; lastCrawledProduct: string }) => {
      console.log('Realtime crawler progress:', data)
      setIsCrawling(data.isRunning)
      setCrawledCount(data.crawledCount)
      setLastCrawledProduct(data.lastCrawledProduct)
      
      if (activeTab === 'crawled') {
        fetchCrawledProducts(1, crawledKeyword)
      }
    }

    const handleImportReceiptUpdated = (data: any) => {
      console.log('Realtime import receipt update received:', data)
      fetchReceipts()
      fetchInventory()
    }

    socket.on('crawler:status', handleCrawlerStatus)
    socket.on('crawler:progress', handleCrawlerProgress)
    socket.on('import_receipt:updated', handleImportReceiptUpdated)
    socket.on('inventory:updated', handleImportReceiptUpdated)

    return () => {
      socket.off('crawler:status', handleCrawlerStatus)
      socket.off('crawler:progress', handleCrawlerProgress)
      socket.off('import_receipt:updated', handleImportReceiptUpdated)
      socket.off('inventory:updated', handleImportReceiptUpdated)
    }
  }, [socket, activeTab, crawledKeyword, selectedBranchId]);

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

  // --- Crawled Products Logic ---
  const fetchCrawledProducts = async (currentPage = crawledPage, searchKeyword = crawledKeyword) => {
    setCrawledLoading(true)
    setCrawledError(null)
    try {
      const res = await competitorProductService.getCompetitorProducts({
        page: currentPage,
        limit: 10,
        keyword: searchKeyword || undefined,
      })
      if (res.success) {
        setCrawledProducts(res.data)
        if (res.pagination) {
          setCrawledTotalPages(res.pagination.totalPages || 1)
          setCrawledTotalItems(res.pagination.total || 0)
        }
      } else {
        setCrawledError(res.message || 'Không thể lấy danh sách sản phẩm cào.')
      }
    } catch (err: any) {
      console.error(err)
      setCrawledError(err.response?.data?.message || 'Có lỗi xảy ra khi lấy danh sách sản phẩm.')
    } finally {
      setCrawledLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'crawled') {
      fetchCrawledProducts(crawledPage, crawledKeyword)
    }
  }, [activeTab])

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCrawledPage(1)
  }, [crawledKeyword])

  const handleCrawledPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= crawledTotalPages) {
      setCrawledPage(newPage)
      fetchCrawledProducts(newPage, crawledKeyword)
    }
  }

  const toggleCrawledSelect = (id: string) => {
    setCrawledSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const toggleCrawledSelectAll = () => {
    const currentPageIds = crawledProducts.map(p => p._id)
    const allSelected = currentPageIds.every(id => crawledSelectedIds.includes(id))

    if (allSelected) {
      setCrawledSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)))
    } else {
      setCrawledSelectedIds(prev => {
        const uniqueIds = new Set([...prev, ...currentPageIds])
        return Array.from(uniqueIds)
      })
    }
  }

  const handleCrawledImport = async () => {
    if (crawledSelectedIds.length === 0) return
    setCrawledImporting(true)
    setCrawledImportSuccessMsg(null)
    setCrawledError(null)
    try {
      const res = await competitorProductService.importToCatalog(crawledSelectedIds)
      if (res.success) {
        setCrawledImportSuccessMsg(`Đã đưa thành công ${res.data?.importedCount} sản phẩm vào danh mục hệ thống.`);
        setCrawledSelectedIds([]) // Clear selection
        // Automatically hide success message after 5 seconds
        setTimeout(() => setCrawledImportSuccessMsg(null), 5000)
      } else {
        setCrawledError(res.message || 'Có lỗi xảy ra khi import sản phẩm.')
      }
    } catch (err: any) {
      console.error(err)
      setCrawledError(err.response?.data?.message || 'Có lỗi xảy ra khi import sản phẩm.')
    } finally {
      setCrawledImporting(false)
    }
  }
  // --- End Crawled Products Logic ---

  const [bulkSuggestError, setBulkSuggestError] = useState<string | null>(null)

  const handleBulkPriceSuggest = () => {
    if (selectedCatalogIds.length === 0) return;
    if (selectedCatalogIds.length > 10) {
      notify.error('Bạn chỉ được chọn tối đa 10 sản phẩm để gợi ý giá hàng loạt.');
      return;
    }

    const selectedProducts = products.filter(p => selectedCatalogIds.includes(p._id));

    // Initialize results list without calling API immediately
    const initialResults = selectedProducts.map(prod => {
      const catId = prod.categoryId ? (typeof prod.categoryId === 'object' ? (prod.categoryId as any)._id : String(prod.categoryId)) : '';
      return {
        productId: prod._id,
        productName: prod.productName || prod.name || 'Sản phẩm',
        costPrice: prod.costPrice || 0,
        currentPrice: prod.salePrice || 0,
        suggestedPrice: 0,
        confidence: 0,
        reason: '',
        floorPrice: 0,
        categoryId: catId,
        sku: prod.sku,
        selected: true
      };
    });

    setBulkSuggestResults(initialResults);
    setBulkSuggestError(null);
    setShowBulkSuggestModal(true);
  };

  const handleBulkImportFromCatalog = () => {
    if (selectedCatalogIds.length === 0) return;

    const selectedProducts = products.filter(p => selectedCatalogIds.includes(p._id));
    const newItems = selectedProducts.map(prod => {
      const historicalItem = importBranchInventory.find(
        inv => {
          const invProdId = typeof inv.productId === 'object' ? inv.productId?._id : inv.productId;
          return invProdId === prod._id;
        }
      );

      let suggestedCost = 0;
      if (historicalItem && historicalItem.lastImportCost && historicalItem.lastImportCost > 0) {
        suggestedCost = historicalItem.lastImportCost;
      } else if (prod.salePrice && prod.salePrice > 0) {
        suggestedCost = prod.salePrice;
      } else if (prod.costPrice && prod.costPrice > 0) {
        suggestedCost = prod.costPrice;
      }

      return {
        productId: prod._id,
        quantity: 1,
        unitCost: suggestedCost
      };
    });

    setImportItems(prev => {
      const updated = [...prev];
      newItems.forEach(item => {
        if (!updated.some(u => u.productId === item.productId)) {
          updated.push(item);
        }
      });
      return updated;
    });

    setSelectedCatalogIds([]);
    setIsImportModalOpen(true);
  };



  const runBulkAIPriceSuggest = async () => {
    // Validate that all items have costPrice and categoryId
    const invalidItems = bulkSuggestResults.filter(r => !r.costPrice || r.costPrice <= 0 || !r.categoryId);
    if (invalidItems.length > 0) {
      const names = invalidItems.map(r => r.productName).join(', ');
      notify.error(`Các sản phẩm sau chưa có Giá vốn hoặc chưa chọn Danh mục: ${names}. Vui lòng nhập đầy đủ để chạy AI.`);
      return;
    }

    setIsBulkSuggesting(true);
    setBulkSuggestError(null);

    try {
      const payload = bulkSuggestResults.map(r => ({
        costPrice: r.costPrice,
        categoryId: r.categoryId,
        name: r.productName,
        sku: r.sku
      }));

      const res = await productService.suggestPriceBulk(payload);
      if (res.success && Array.isArray(res.data)) {
        setBulkSuggestResults(prev => prev.map((item, index) => {
          const aiResult = res.data[index];
          return {
            ...item,
            suggestedPrice: aiResult.suggestedPrice,
            confidence: aiResult.confidence,
            reason: aiResult.reason,
            floorPrice: aiResult.floorPrice
          };
        }));
      } else {
        setBulkSuggestError(res.message || 'Không thể tạo gợi ý giá hàng loạt.');
      }
    } catch (err: any) {
      console.error(err);
      setBulkSuggestError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi gọi AI.');
    } finally {
      setIsBulkSuggesting(false);
    }
  };

  const handleApplyBulkPrices = async () => {
    const toApply = bulkSuggestResults.filter(r => r.selected);
    if (toApply.length === 0) {
      notify.error('Không có sản phẩm nào được chọn để áp dụng giá.');
      return;
    }

    // Validate if any price is below floor price
    const belowFloorItems = toApply.filter(r => r.suggestedPrice > 0 && r.suggestedPrice < r.floorPrice);
    if (belowFloorItems.length > 0) {
      const names = belowFloorItems.map(r => r.productName).join(', ');
      const confirmMsg = `Các sản phẩm sau có Giá đề xuất thấp hơn Giá sàn quy định (biên lợi nhuận tối thiểu): ${names}.\n\nBạn có chắc chắn vẫn muốn lưu mức giá này không?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    setBulkUpdateLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of toApply) {
        try {
          // Update both salePrice, costPrice and categoryId in catalog!
          const res = await productService.updateProduct(item.productId, {
            salePrice: item.suggestedPrice || item.currentPrice,
            costPrice: item.costPrice,
            categoryId: item.categoryId
          });
          if (res.success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (e) {
          console.error('Failed to update product details:', item.productName, e);
          failCount++;
        }
      }

      notify.success(`Đã áp dụng thành công cho ${successCount} sản phẩm.${failCount > 0 ? ` Thất bại: ${failCount} sản phẩm.` : ''}`);
      setShowBulkSuggestModal(false);
      setSelectedCatalogIds([]);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      notify.error('Đã xảy ra lỗi trong quá trình áp dụng giá hàng loạt.');
    } finally {
      setBulkUpdateLoading(false);
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
        item.productId?.salePrice ?? 0,
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
      // Suggest cost sequence: lastImportCost -> salePrice -> costPrice -> 0
      let suggestedCost = 0
      if (historicalItem && historicalItem.lastImportCost && historicalItem.lastImportCost > 0) {
        suggestedCost = historicalItem.lastImportCost
      } else if (product.salePrice && product.salePrice > 0) {
        suggestedCost = product.salePrice
      } else if (product.costPrice && product.costPrice > 0) {
        suggestedCost = product.costPrice
      }

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

  // Open receipt detail and prepare verification checklist
  const handleOpenReceiptDetail = (rec: ImportReceipt) => {
    setViewingReceipt(rec)
    setVerificationNote(rec.verificationNote || '')
    setVerifyError(null)
    setApproveError(null)
    setRejectError(null)

    const initialQuantities: Record<string, number> = {}
    rec.items.forEach((it) => {
      const prodId = typeof it.productId === 'object' ? it.productId._id : (it.productId as any)
      if (rec.verificationStatus === 'pending' || !rec.verificationStatus) {
        initialQuantities[prodId] = it.quantity
      } else {
        initialQuantities[prodId] = it.verifiedQuantity || 0
      }
    })
    setVerifiedQuantities(initialQuantities)
  }

  // Set quantity input directly
  const handleSetProductVerifiedQuantity = (prodId: string, qty: number) => {
    setVerifiedQuantities((prev) => ({
      ...prev,
      [prodId]: qty
    }))
  }

  // Toggle "received in full" checkbox
  const handleToggleProductVerified = (prodId: string, expectedQty: number) => {
    setVerifiedQuantities((prev) => {
      const current = prev[prodId] ?? 0
      return {
        ...prev,
        [prodId]: current === expectedQty ? 0 : expectedQty
      }
    })
  }

  // Submit checklist verification
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!viewingReceipt) return

    try {
      setVerifyLoading(true)
      setVerifyError(null)

      const verifiedItems = Object.entries(verifiedQuantities).map(([productId, verifiedQuantity]) => ({
        productId,
        verifiedQuantity,
      }))

      const res = await inventoryService.verifyImportReceipt(viewingReceipt._id, {
        verifiedItems,
        note: verificationNote,
      })

      if (res.success && res.data) {
        setViewingReceipt(res.data)
        // Refresh receipts list
        fetchReceipts()
        notify.success('Gửi báo cáo kiểm hàng thành công.')
      } else {
        setVerifyError(res.message || 'Không thể xác nhận kiểm hàng.')
      }
    } catch (err: any) {
      setVerifyError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi khi gửi xác nhận.')
    } finally {
      setVerifyLoading(false)
    }
  }

  // ── UC mới: Admin duyệt phiếu nhập kho ────────────────────────────────────
  const handleApproveReceipt = async (id: string) => {
    try {
      setApproveLoading(true)
      setApproveError(null)
      const res = await inventoryService.approveImportReceipt(id)
      if (res.success && res.data) {
        if (viewingReceipt && viewingReceipt._id === id) {
          setViewingReceipt(res.data)
        }
        notify.success('Đã duyệt phiếu nhập kho thành công.')
        fetchReceipts()
      } else {
        setApproveError(res.message || 'Không thể duyệt phiếu nhập kho.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi duyệt phiếu.'
      setApproveError(msg)
    } finally {
      setApproveLoading(false)
    }
  }

  // ── UC mới: Mở modal nhập lý do từ chối ───────────────────────────────────
  const handleOpenRejectModal = (id: string) => {
    setRejectTargetId(id)
    setRejectReason('')
    setRejectError(null)
    setShowRejectModal(true)
  }

  // ── UC mới: Admin từ chối phiếu nhập kho ──────────────────────────────────
  const handleRejectSubmit = async () => {
    if (!rejectTargetId) return
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối.')
      return
    }

    try {
      setRejectLoading(true)
      setRejectError(null)
      const res = await inventoryService.rejectImportReceipt(rejectTargetId, rejectReason.trim())
      if (res.success && res.data) {
        if (viewingReceipt && viewingReceipt._id === rejectTargetId) {
          setViewingReceipt(res.data)
        }
        notify.success('Đã từ chối phiếu nhập kho.')
        setShowRejectModal(false)
        setRejectTargetId(null)
        setRejectReason('')
        fetchReceipts()
      } else {
        setRejectError(res.message || 'Không thể từ chối phiếu nhập kho.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi từ chối phiếu.'
      setRejectError(msg)
    } finally {
      setRejectLoading(false)
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
    setSuggestReason('')
    setEditingProduct(product)
    const catId = product.categoryId ? (typeof product.categoryId === 'object' ? (product.categoryId as any)._id : String(product.categoryId)) : ''
    setProductForm({
      name: product.productName || product.name || '',
      sku: product.sku || '',
      costPrice: product.costPrice ?? 0,
      salePrice: product.salePrice ?? 0,
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
    setSuggestReason('')
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
                onClick={() => {
                  setSuggestReason('')
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
          <>
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
            <button
              onClick={() => setActiveTab('crawled')}
              className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${activeTab === 'crawled'
                ? 'border-primary text-primary font-black'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
            >
              <Bot size={18} />
              Danh mục Sản phẩm cào
            </button>
          </>
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
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá vốn trung bình</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá bán</th>
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
                          <td className="p-4 text-right font-bold text-primary">
                            {formatVND(item.productId?.salePrice ?? 0)}
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
                      <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái duyệt</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái kiểm</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {receiptsStats.filtered.map((rec) => {
                      const branchName = typeof rec.branchId === 'object' ? rec.branchId.name : 'N/A'
                      const creatorName = typeof rec.createdBy === 'object' ? rec.createdBy.fullName : 'System'
                      const vStatus = rec.verificationStatus || 'pending'
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
                          <td className="p-4 text-center">
                            {rec.status === 'pending_approval' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={12} />
                                Chờ duyệt
                              </span>
                            )}
                            {rec.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <ShieldX size={12} />
                                Đã từ chối
                              </span>
                            )}
                            {rec.status === 'active' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <ShieldCheck size={12} />
                                Đã duyệt
                              </span>
                            )}
                            {rec.status === 'cancelled' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant">
                                Đã hủy
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {vStatus === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock size={12} />
                                Chờ kiểm hàng
                              </span>
                            )}
                            {vStatus === 'verified' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check size={12} />
                                Đã nhận đủ
                              </span>
                            )}
                            {vStatus === 'partially_verified' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle size={12} />
                                Nhận thiếu
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {rec.status === 'pending_approval' && isAdmin && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveReceipt(rec._id)}
                                    disabled={approveLoading}
                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
                                  >
                                    <ShieldCheck size={14} />
                                    Duyệt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectModal(rec._id)}
                                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                                  >
                                    <ShieldX size={14} />
                                    Từ chối
                                  </button>
                                </>
                              )}
                              {rec.status === 'pending_approval' && !isAdmin && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                                  <Clock size={12} />
                                  Chờ Admin duyệt
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenReceiptDetail(rec)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
                              >
                                <Layers size={14} />
                                {rec.status === 'active' ? 'Xem & Kiểm hàng' : 'Xem chi tiết'}
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

            {selectedCatalogIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-low border border-outline-variant px-3 py-2 rounded-xl">
                  Đã chọn: <span className="font-bold text-primary">{selectedCatalogIds.length}/10</span>
                </span>
                <button
                  type="button"
                  onClick={handleBulkImportFromCatalog}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary hover:bg-opacity-90 active:scale-95 px-4 py-2.5 text-sm font-bold text-white shadow transition-all bg-[#007f5f]"
                >
                  <PlusCircle size={14} />
                  Tạo phiếu nhập kho hàng loạt
                </button>
                <button
                  type="button"
                  onClick={handleBulkPriceSuggest}
                  className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-opacity-90 active:scale-95 px-4 py-2.5 text-sm font-bold text-white shadow transition-all"
                >
                  <Sparkles size={14} />
                  Gợi ý giá hàng loạt (AI)
                </button>
              </div>
            )}
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
                      <th className="p-4 font-bold text-on-surface-variant text-center w-12">
                        <input
                          type="checkbox"
                          checked={products.length > 0 && selectedCatalogIds.length === products.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCatalogIds(products.map(p => p._id));
                            } else {
                              setSelectedCatalogIds([]);
                            }
                          }}
                          className="rounded border-outline-variant focus:ring-primary text-primary bg-surface-container-lowest"
                        />
                      </th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">STT</th>
                      <th className="p-4 font-bold text-on-surface-variant">Ảnh</th>
                      <th className="p-4 font-bold text-on-surface-variant">Mã SKU</th>
                      <th className="p-4 font-bold text-on-surface-variant">Tên Sản phẩm</th>
                      <th className="p-4 font-bold text-on-surface-variant">Danh mục</th>
                      <th className="p-4 font-bold text-on-surface-variant">Đơn vị</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá nhập</th>
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá bán</th>
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
                          <td className="p-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCatalogIds.includes(product._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCatalogIds([...selectedCatalogIds, product._id]);
                                } else {
                                  setSelectedCatalogIds(selectedCatalogIds.filter(id => id !== product._id));
                                }
                              }}
                              className="rounded border-outline-variant focus:ring-primary text-primary bg-surface-container-lowest"
                            />
                          </td>
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
                          <td className="p-4 text-right font-medium text-on-surface-variant">
                            {formatVND(product.costPrice ?? 0)}
                          </td>
                          <td className="p-4 text-right font-black text-primary">
                            {formatVND(product.salePrice ?? 0)}
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

      {/* ── TAB 4: CRAWLED PRODUCTS ── */}
      {activeTab === 'crawled' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header & Crawler Controls */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-on-surface flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Sản phẩm đối thủ (Winmart)
              </h2>
              <p className="text-on-surface-variant text-sm mt-1">
                Quản lý danh sách sản phẩm thô cào được từ đối thủ Winmart và đưa vào danh mục hệ thống.
              </p>
              {isCrawling && lastCrawledProduct && (
                <p className="text-xs text-primary font-bold animate-pulse mt-1.5 flex items-center gap-1.5 bg-primary/5 px-2.5 py-1 rounded-lg w-fit border border-primary/10">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Đang cào: {lastCrawledProduct}
                </p>
              )}
            </div>

            {/* Crawler Status Box */}
            <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`relative flex h-3.5 w-3.5`}>
                  {isCrawling && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isCrawling ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  Bot Cào: {isCrawling ? `Đang hoạt động (${crawledCount})` : 'Tắt'}
                </span>
              </div>

              <div className="h-4 w-px bg-outline-variant" />

              {isCrawling ? (
                <button
                  onClick={() => setShowCrawlerStopConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-error-container px-3 py-1.5 text-xs font-semibold text-on-error-container transition hover:bg-error-container/80"
                >
                  <Square className="h-3 w-3 fill-error" />
                  Dừng cào
                </button>
              ) : (
                <button
                  onClick={handleToggleCrawler}
                  className="flex items-center gap-1.5 rounded-lg bg-success-container px-3 py-1.5 text-xs font-semibold text-on-success-container transition hover:bg-success-container/80"
                >
                  <Play className="h-3 w-3 fill-success" />
                  Cào thủ công
                </button>
              )}
            </div>
          </div>

          {/* Main Alert Message */}
          {crawledImportSuccessMsg && (
            <div className="flex items-center gap-3 rounded-xl bg-success-container border border-success/20 p-4 text-on-success-container shadow-sm transition-all duration-300">
              <Check className="h-5 w-5 text-success flex-shrink-0" />
              <span className="text-sm font-medium">{crawledImportSuccessMsg}</span>
            </div>
          )}

          {crawledError && (
            <div className="flex items-center gap-3 rounded-xl bg-error-container border border-error/20 p-4 text-on-error-container shadow-sm">
              <AlertCircle className="h-5 w-5 text-error flex-shrink-0" />
              <span className="text-sm font-medium">{crawledError}</span>
            </div>
          )}

          {/* Table Container card */}
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            {/* Filters and search header */}
            <div className="flex flex-col gap-4 border-b border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-on-surface-variant">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tìm theo tên, SKU hoặc thương hiệu..."
                  value={crawledKeyword}
                  onChange={(e) => setCrawledKeyword(e.target.value)}
                  className="w-full rounded-xl border-none bg-surface-container-low pl-9 pr-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchCrawledProducts(crawledPage, crawledKeyword)}
                  disabled={crawledLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-outline bg-surface hover:bg-surface-container-high px-4 py-2 text-sm font-bold text-on-surface transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${crawledLoading ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>

                {crawledSelectedIds.length > 0 && (
                  <button
                    onClick={handleCrawledImport}
                    disabled={crawledImporting}
                    className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-opacity-90 active:scale-95 px-4 py-2 text-sm font-bold text-white shadow transition disabled:opacity-50"
                  >
                    {crawledImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Đưa vào hệ thống ({crawledSelectedIds.length})
                  </button>
                )}
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {crawledLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-on-surface-variant font-medium">Đang tải dữ liệu...</p>
                </div>
              ) : crawledProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant border-dashed border-outline-variant border-t">
                  <Bot className="h-12 w-12 text-on-surface-variant opacity-40 mb-3" />
                  <h3 className="text-lg font-bold text-on-surface">Không tìm thấy sản phẩm cào nào</h3>
                  <p className="mt-2 text-sm">Hãy đảm bảo đã bật Bot Cào hoặc cào thủ công để lấy dữ liệu.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant bg-surface-container-low/50 font-bold text-on-surface-variant">
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={crawledProducts.length > 0 && crawledProducts.every(p => crawledSelectedIds.includes(p._id))}
                          onChange={toggleCrawledSelectAll}
                          className="rounded border-outline-variant text-primary outline-none transition focus:ring-primary cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th className="p-4">Ảnh</th>
                      <th className="p-4">SKU Đối thủ</th>
                      <th className="p-4">Tên sản phẩm</th>
                      <th className="p-4">Thương hiệu</th>
                      <th className="p-4">Đơn vị</th>
                      <th className="p-4 text-right">Giá đối thủ</th>
                      <th className="p-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {crawledProducts.map((p) => {
                      const isSelected = crawledSelectedIds.includes(p._id)
                      return (
                        <tr
                          key={p._id}
                          className={`hover:bg-surface-container-low/20 transition cursor-pointer ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : ''
                            }`}
                          onClick={() => toggleCrawledSelect(p._id)}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCrawledSelect(p._id)}
                              className="rounded border-outline-variant text-primary outline-none transition focus:ring-primary cursor-pointer w-4 h-4"
                            />
                          </td>
                          <td className="p-4">
                            <div className="w-10 h-10 bg-surface-container-low rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={18} className="text-on-surface-variant opacity-60" />
                              )}
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-on-surface">
                            {p.sku}
                          </td>
                          <td className="p-4 font-bold text-on-surface max-w-xs">
                            <div className="truncate" title={p.name}>{p.name}</div>
                            {p.description && (
                              <div className="text-xs text-on-surface-variant font-normal truncate max-w-[200px]" title={p.description}>
                                {p.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-on-surface-variant font-medium">
                            {p.brand || '---'}
                          </td>
                          <td className="p-4 text-on-surface-variant">
                            {p.unit}
                          </td>
                          <td className="p-4 text-right font-black text-emerald-600">
                            {formatVND(p.price)}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={async () => {
                                setCrawledImporting(true)
                                setCrawledImportSuccessMsg(null)
                                setCrawledError(null)
                                try {
                                  const res = await competitorProductService.importToCatalog([p._id])
                                  if (res.success) {
                                    setCrawledImportSuccessMsg(`Đã đưa thành công "${p.name}" vào danh mục hệ thống.`);
                                    setTimeout(() => setCrawledImportSuccessMsg(null), 5000)
                                  } else {
                                    setCrawledError(res.message || 'Có lỗi xảy ra.')
                                  }
                                } catch (err: any) {
                                  console.error(err)
                                  setCrawledError(err.response?.data?.message || 'Có lỗi xảy ra.')
                                } finally {
                                  setCrawledImporting(false)
                                }
                              }}
                              disabled={crawledImporting}
                              className="text-primary hover:text-primary-hover hover:underline text-xs font-bold transition flex items-center gap-1"
                            >
                              Đưa vào hệ thống
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {!crawledLoading && crawledProducts.length > 0 && (
              <div className="flex items-center justify-between border-t border-outline-variant bg-surface-container-low/30 px-6 py-4">
                <div className="text-xs font-semibold text-on-surface-variant">
                  Hiển thị <span className="font-bold text-on-surface">{crawledProducts.length}</span> trên {crawledTotalItems}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-on-surface-variant mr-2">
                    Trang <span className="font-bold text-on-surface">{crawledPage}</span> / {crawledTotalPages}
                  </div>
                  <button
                    type="button"
                    disabled={crawledPage <= 1}
                    onClick={() => handleCrawledPageChange(crawledPage - 1)}
                    className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={crawledPage >= crawledTotalPages}
                    onClick={() => handleCrawledPageChange(crawledPage + 1)}
                    className="inline-flex items-center justify-center rounded-xl border border-outline px-4 py-2 text-xs font-bold text-on-surface bg-surface hover:bg-surface-container-high active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE IMPORT RECEIPT MODAL ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Tìm & Thêm sản phẩm nhanh */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <Package size={14} className="text-primary" />
                    Tìm & Thêm sản phẩm nhanh <span className="text-error">*</span>
                  </label>
                  <div className="border border-outline-variant rounded-xl p-3 bg-surface-container-low/50 space-y-3">
                    <input
                      type="text"
                      placeholder="Nhập tên sản phẩm hoặc mã SKU để tìm kiếm..."
                      value={importProductSearch}
                      onChange={(e) => setImportProductSearch(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/60 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-2 divide-y divide-outline-variant/40 pr-1 text-xs">
                      {activeProducts
                        .filter(p =>
                          (p.productName || p.name || '').toLowerCase().includes(importProductSearch.toLowerCase()) ||
                          (p.sku || '').toLowerCase().includes(importProductSearch.toLowerCase())
                        )
                        .slice(0, 15)
                        .map((p, idx) => {
                          const isAdded = importItems.some(item => item.productId === p._id);
                          return (
                            <div key={p._id} className={`flex items-center justify-between py-2 ${idx > 0 ? 'border-t border-outline-variant/40' : ''}`}>
                              <div className="min-w-0 pr-4">
                                <p className="font-bold text-on-surface truncate max-w-[200px]">{p.productName || p.name}</p>
                                <p className="text-[10px] text-on-surface-variant font-mono">
                                  SKU: {p.sku} | Vốn: {formatVND(p.costPrice || 0)} | Bán: {formatVND(p.salePrice || 0)}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAdded) {
                                    const index = importItems.findIndex(item => item.productId === p._id);
                                    if (index > -1) removeImportItemRow(index);
                                  } else {
                                    handleQuickAddProduct(p);
                                  }
                                }}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all border shrink-0 ${isAdded
                                  ? 'bg-success/15 border-success/30 text-success hover:bg-success/20'
                                  : 'bg-primary border-primary text-white hover:bg-opacity-90 active:scale-95'
                                  }`}
                              >
                                {isAdded ? 'Đã thêm ✓' : 'Thêm +'}
                              </button>
                            </div>
                          );
                        })}
                      {activeProducts.filter(p =>
                        (p.productName || p.name || '').toLowerCase().includes(importProductSearch.toLowerCase()) ||
                        (p.sku || '').toLowerCase().includes(importProductSearch.toLowerCase())
                      ).length === 0 && (
                          <div className="text-center py-4 text-on-surface-variant opacity-60">
                            Không tìm thấy sản phẩm nào khớp từ khóa.
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Thêm nhanh theo Danh mục */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                    <Layers size={14} className="text-primary" />
                    Nạp nhanh sản phẩm theo Danh mục (50 - 100+ sp)
                  </label>
                  <div className="border border-outline-variant rounded-xl p-3 bg-surface-container-low/50 flex flex-col justify-between h-[218px] text-xs">
                    <div className="space-y-2 text-on-surface-variant leading-relaxed">
                      <p>Nạp nhanh tất cả các sản phẩm thuộc một danh mục cụ thể vào phiếu nhập kho cùng một lúc.</p>
                      <p className="font-semibold text-primary">Các bước thực hiện:</p>
                      <ul className="list-decimal pl-4 space-y-1">
                        <li>Chọn danh mục hàng hóa muốn nạp ở danh sách phía dưới.</li>
                        <li>Bấm nút "Nạp toàn bộ sản phẩm".</li>
                        <li>Hệ thống tự động thêm tất cả sản phẩm thuộc danh mục đó vào phiếu nhập.</li>
                      </ul>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <select
                        id="importCategoryQuickSelect"
                        className="flex-1 bg-surface border border-outline-variant/60 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm font-semibold"
                        defaultValue=""
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const catSelect = document.getElementById('importCategoryQuickSelect') as HTMLSelectElement;
                          const catId = catSelect?.value;
                          if (!catId) {
                            notify.error('Vui lòng chọn một danh mục.');
                            return;
                          }
                          const matchedProducts = activeProducts.filter(p => {
                            const pCatId = p.categoryId ? (typeof p.categoryId === 'object' ? (p.categoryId as any)._id : String(p.categoryId)) : '';
                            return pCatId === catId;
                          });
                          if (matchedProducts.length === 0) {
                            notify.error('Không có sản phẩm nào thuộc danh mục này.');
                            return;
                          }

                          const newItems = matchedProducts.map(prod => {
                            const historicalItem = importBranchInventory.find(
                              inv => (typeof inv.productId === 'object' ? inv.productId?._id : inv.productId) === prod._id
                            );
                            let suggestedCost = 0;
                            if (historicalItem && historicalItem.lastImportCost && historicalItem.lastImportCost > 0) {
                              suggestedCost = historicalItem.lastImportCost;
                            } else if (prod.salePrice && prod.salePrice > 0) {
                              suggestedCost = prod.salePrice;
                            } else if (prod.costPrice && prod.costPrice > 0) {
                              suggestedCost = prod.costPrice;
                            }
                            return { productId: prod._id, quantity: 1, unitCost: suggestedCost };
                          });

                          setImportItems(prev => {
                            const updated = [...prev];
                            newItems.forEach(item => {
                              if (!updated.some(u => u.productId === item.productId)) {
                                updated.push(item);
                              }
                            });
                            return updated;
                          });
                          notify.success(`Đã thêm thành công ${newItems.length} sản phẩm của danh mục này vào phiếu.`);
                        }}
                        className="py-2 px-3 bg-primary hover:bg-opacity-95 text-white font-black rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
                      >
                        Nạp toàn bộ sản phẩm
                      </button>
                    </div>
                  </div>
                </div>
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
                            <th className="p-3 font-bold text-on-surface-variant text-right w-32 whitespace-nowrap">Giá bán ở cửa hàng (đ)</th>
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
                            const costPrice = pInfo?.costPrice || 0;
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

                                {/* Unit Cost input (Giá bán ở cửa hàng) */}
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

                                {/* Row Subtotal (Quantity * unitCost) */}
                                <td className="p-3 text-right font-black text-primary text-sm whitespace-nowrap">
                                  {formatVND(item.quantity * item.unitCost)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Giá nhập cơ sở */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-costPrice" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Giá nhập cơ sở
                  </label>
                  <input
                    type="number"
                    id="prod-costPrice"
                    min="0"
                    value={productForm.costPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })}
                    placeholder="VD: 10000"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

                {/* Giá bán chung */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="prod-salePrice" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Giá bán chung
                    </label>
                    <button
                      type="button"
                      disabled={isSuggestingPrice || !productForm.costPrice || !productForm.categoryId}
                      onClick={async () => {
                        setIsSuggestingPrice(true);
                        setSuggestReason('');
                        try {
                          const payload = {
                            costPrice: productForm.costPrice,
                            categoryId: productForm.categoryId,
                            name: productForm.name,
                            sku: productForm.sku,
                          };
                          const res = await productService.suggestPrice(payload);
                          if (res.success && res.data) {
                            setProductForm(prev => ({ ...prev, salePrice: res.data.suggestedPrice }));
                            setSuggestReason(`🪄 ${res.data.reason} (Độ tin cậy: ${res.data.confidence}%, Giá sàn: ${formatVND(res.data.floorPrice)})`);
                          }
                        } catch (err: any) {
                          setSuggestReason('⚠️ Lỗi: ' + (err.response?.data?.message || err.message || 'Không thể gợi ý giá.'));
                        } finally {
                          setIsSuggestingPrice(false);
                        }
                      }}
                      className="text-xs font-bold text-primary hover:bg-primary-container px-2 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Chỉ khả dụng khi đã điền Giá vốn và chọn Danh mục"
                    >
                      {isSuggestingPrice ? (
                        <><RefreshCw size={12} className="animate-spin" /> Đang tính...</>
                      ) : (
                        <><Sparkles size={12} /> Gợi ý giá bằng AI</>
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    id="prod-salePrice"
                    min="0"
                    value={productForm.salePrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: Number(e.target.value) })}
                    placeholder="VD: 15000"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                  {suggestReason && (
                    <p className={`text-xs mt-1 font-medium ${suggestReason.startsWith('⚠️') ? 'text-error' : 'text-emerald-600'}`}>
                      {suggestReason}
                    </p>
                  )}
                </div>
              </div>

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

      {/* ── IMPORT RECEIPT DETAIL & VERIFICATION CHECKLIST MODAL ── */}
      {viewingReceipt && (() => {
        const branchName = typeof viewingReceipt.branchId === 'object' ? viewingReceipt.branchId.name : 'Chi nhánh'
        const creatorName = typeof viewingReceipt.createdBy === 'object' ? viewingReceipt.createdBy.fullName : 'System'
        const vStatus = viewingReceipt.verificationStatus || 'pending'
        const isPending = vStatus === 'pending'
        const canVerify = viewingReceipt.status === 'active' && isPending
        const isAwaitingApproval = viewingReceipt.status === 'pending_approval'
        const isRejected = viewingReceipt.status === 'rejected'

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
                <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                  <UserCheck size={20} className="text-primary" />
                  Chi tiết & Kiểm hàng Phiếu #{viewingReceipt.code}
                </h2>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleVerifySubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {verifyError && (
                  <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{verifyError}</p>
                  </div>
                )}

                {approveError && (
                  <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{approveError}</p>
                  </div>
                )}

                {/* Info summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
                  <div className="space-y-1 text-xs">
                    <p className="text-on-surface-variant uppercase font-bold tracking-wider">Thông tin chung</p>
                    <p className="text-sm text-on-surface font-semibold">Chi nhánh: <span className="text-primary">{branchName}</span></p>
                    <p className="text-sm text-on-surface font-semibold">Nhà cung cấp: <span>{viewingReceipt.supplierName || 'N/A'}</span></p>
                    <p className="text-sm text-on-surface font-semibold">Ngày tạo: <span>{new Date(viewingReceipt.createdAt).toLocaleString()}</span></p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-on-surface-variant uppercase font-bold tracking-wider">Người tạo & Tổng cộng</p>
                    <p className="text-sm text-on-surface font-semibold">Người tạo: <span className="font-bold text-on-surface">{creatorName}</span></p>
                    <p className="text-sm text-on-surface font-semibold">Tổng giá trị: <span className="text-primary font-black">{formatVND(viewingReceipt.totalCost)}</span></p>
                    <p className="text-sm text-on-surface font-semibold">
                      Trạng thái duyệt:
                      <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${viewingReceipt.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        viewingReceipt.status === 'cancelled' ? 'bg-surface-container-high text-on-surface-variant' :
                          viewingReceipt.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                        }`}>
                        {viewingReceipt.status === 'pending_approval' ? 'Chờ duyệt' :
                          viewingReceipt.status === 'active' ? 'Đã duyệt' :
                            viewingReceipt.status === 'rejected' ? 'Đã từ chối' :
                              viewingReceipt.status === 'cancelled' ? 'Đã hủy' : viewingReceipt.status}
                      </span>
                    </p>
                  </div>
                </div>

                {/* UC mới: Banner chờ duyệt / đã từ chối / khu vực nút Duyệt-Từ chối cho Admin */}
                {isAwaitingApproval && isAdmin && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert size={14} />
                      Phiếu này đang chờ bạn duyệt
                    </p>
                    <p className="text-xs text-amber-900">
                      Kiểm tra thông tin phiếu nhập trước khi duyệt. Sau khi duyệt, nhân viên chi nhánh mới có thể kiểm hàng và cập nhật tồn kho.
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={approveLoading}
                        onClick={() => handleApproveReceipt(viewingReceipt._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow transition-all disabled:opacity-50"
                      >
                        {approveLoading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Duyệt phiếu
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRejectModal(viewingReceipt._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow transition-all"
                      >
                        <ShieldX size={14} />
                        Từ chối phiếu
                      </button>
                    </div>
                  </div>
                )}

                {isAwaitingApproval && !isAdmin && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-800 flex items-center gap-1.5">
                      <Clock size={14} />
                      Đang chờ Admin duyệt phiếu này
                    </p>
                    <p className="text-xs text-amber-900 mt-1">
                      Bạn sẽ có thể kiểm hàng sau khi phiếu được Admin duyệt. Vui lòng quay lại kiểm tra sau.
                    </p>
                  </div>
                )}

                {isRejected && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide text-rose-800 flex items-center gap-1.5">
                      <ShieldX size={14} />
                      Phiếu đã bị từ chối
                    </p>
                    {viewingReceipt.rejectedBy && (
                      <p className="text-xs text-rose-900">
                        Người từ chối: <strong>{viewingReceipt.rejectedBy.fullName}</strong>
                        {viewingReceipt.rejectedAt && <> · {new Date(viewingReceipt.rejectedAt).toLocaleString()}</>}
                      </p>
                    )}
                    {viewingReceipt.rejectionReason && (
                      <p className="text-xs text-rose-900 italic mt-1 bg-surface/60 p-2 rounded-lg border border-rose-200/60">
                        Lý do: &ldquo;{viewingReceipt.rejectionReason}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Audit verification report details if verified */}
                {!isPending && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl space-y-2">
                    <p className="text-xs font-black uppercase tracking-wide text-emerald-800 flex items-center gap-1.5">
                      <Check size={14} />
                      Báo cáo kiểm hàng (Đã xử lý)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-950 font-medium">
                      <p>Người kiểm kho: <strong className="text-on-surface">{viewingReceipt.verifiedBy?.fullName || 'Nhân viên'}</strong></p>
                      <p>Thời gian kiểm: <span className="text-on-surface">{viewingReceipt.verifiedAt ? new Date(viewingReceipt.verifiedAt).toLocaleString() : 'N/A'}</span></p>
                    </div>
                    {viewingReceipt.verificationNote && (
                      <p className="text-xs text-on-surface-variant mt-1.5 italic bg-surface/50 p-2.5 rounded-lg border border-outline-variant/40">
                        &ldquo;{viewingReceipt.verificationNote}&rdquo;
                      </p>
                    )}
                  </div>
                )}

                {/* Product items table / checklist */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    {canVerify ? 'Checklist Kiểm hàng (Tích chọn sản phẩm nhận đủ)' : 'Danh sách sản phẩm trong phiếu'}
                  </p>

                  <div className="border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant/60">
                    {viewingReceipt.items.map((it) => {
                      const prod = it.productId
                      const prodId = typeof prod === 'object' ? prod._id : (prod as any)
                      const actualQty = verifiedQuantities[prodId] ?? 0
                      const isTicked = actualQty === it.quantity
                      const isItemVerified = !isPending ? it.verified : isTicked

                      return (
                        <div key={prodId} className={`flex items-center gap-4 p-3 transition-colors ${canVerify ? (isItemVerified ? 'bg-emerald-50/15' : 'bg-rose-50/10') : ''
                          }`}>

                          {/* Image */}
                          <div className="w-10 h-10 bg-surface rounded overflow-hidden border border-outline-variant flex items-center justify-center shrink-0">
                            {prod?.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={18} className="text-on-surface-variant opacity-60" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{prod?.productName || 'Sản phẩm'}</p>
                            <p className="text-xs text-on-surface-variant font-mono">
                              SKU: {prod?.sku} | Đơn vị: {prod?.unit || 'cái'}
                            </p>
                          </div>

                          {/* Quantity & price info */}
                          <div className="text-right shrink-0">
                            {!isPending ? (
                              <p className="text-xs font-bold text-on-surface">SL nhập: {it.quantity}</p>
                            ) : (
                              <p className="text-xs text-on-surface-variant">SL: {it.quantity} · Đơn giá: {formatVND(it.unitCost)}</p>
                            )}
                            {!isPending && (
                              <p className="text-[11px] text-on-surface-variant">Đơn giá: {formatVND(it.unitCost)}</p>
                            )}
                          </div>

                          {/* Checkbox or verification badge */}
                          <div className="flex items-center gap-3 shrink-0 pl-2">
                            {canVerify ? (
                              <>
                                {/* Number input */}
                                <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant/60 rounded-xl px-2.5 py-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={it.quantity}
                                    value={actualQty}
                                    onChange={(e) => handleSetProductVerifiedQuantity(prodId, Math.min(it.quantity, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-10 bg-transparent text-center font-black text-sm text-primary outline-none"
                                  />
                                  <span className="text-xs text-on-surface-variant font-bold opacity-60">/ {it.quantity}</span>
                                </div>

                                {/* Checkbox */}
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isTicked}
                                    onChange={() => handleToggleProductVerified(prodId, it.quantity)}
                                    className="w-4 h-4 rounded border-outline text-primary focus:ring-primary focus:ring-offset-0"
                                  />
                                  <span className="text-xs font-bold text-on-surface-variant select-none">Nhận đủ</span>
                                </label>
                              </>
                            ) : isPending ? (
                              // Trường hợp status khác 'active' (pending_approval / rejected) — chưa kiểm hàng, chỉ đọc
                              <span className="text-xs font-bold text-on-surface-variant italic opacity-70">
                                Chưa kiểm hàng
                              </span>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${it.verified ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                  {it.verified ? 'Nhận đủ' : 'Thiếu/Hỏng'}
                                </span>
                                <span className="text-xs font-bold text-on-surface-variant">
                                  Thực nhận: <span className={it.verified ? 'text-emerald-600' : 'text-rose-600'}>{it.verifiedQuantity || 0}</span> / {it.quantity}
                                </span>
                                {!it.verified && (
                                  <span className="text-[10px] font-bold text-error">
                                    (Thiếu {it.quantity - (it.verifiedQuantity || 0)})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Verification Note input for pending */}
                {canVerify && (
                  <div className="space-y-1.5">
                    <label htmlFor="verify-note" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                      Ghi chú kiểm kho
                    </label>
                    <textarea
                      id="verify-note"
                      rows={2}
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      placeholder="Ví dụ: Đã nhận đủ hàng, không có hư hỏng / Thiếu 2 thùng Coca do va đập..."
                      className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                  <button
                    type="button"
                    onClick={() => setViewingReceipt(null)}
                    className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                  >
                    Đóng
                  </button>
                  {canVerify && (
                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50"
                    >
                      {verifyLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        'Xác nhận & Gửi báo cáo'
                      )}
                    </button>
                  )}
                </div>

              </form>

            </div>
          </div>
        )
      })()}

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
                    Sản phẩm & Chi nhánh
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

      {/* ── UC mới: Reject Import Receipt Modal (nhập lý do từ chối) ── */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <ShieldX size={20} className="text-rose-600" />
                Từ chối phiếu nhập kho
              </h2>
              <button
                type="button"
                onClick={() => { setShowRejectModal(false); setRejectTargetId(null); setRejectReason(''); setRejectError(null) }}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {rejectError && (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm font-semibold">{rejectError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="reject-reason" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Lý do từ chối <span className="text-error">*</span>
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Số lượng không khớp với hóa đơn nhà cung cấp..."
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => { setShowRejectModal(false); setRejectTargetId(null); setRejectReason(''); setRejectError(null) }}
                  disabled={rejectLoading}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  disabled={rejectLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                >
                  {rejectLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Xác nhận từ chối'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk AI Price Suggestion Modal ── */}
      {showBulkSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-6xl bg-surface rounded-2xl border border-outline-variant shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-6 py-4">
              <h2 className="text-lg font-black text-on-surface flex items-center gap-2">
                <Sparkles size={20} className="text-primary animate-pulse" />
                Gợi ý giá hàng loạt bằng AI
              </h2>
              <button
                type="button"
                disabled={bulkUpdateLoading || isBulkSuggesting}
                onClick={() => setShowBulkSuggestModal(false)}
                className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {isBulkSuggesting ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={48} className="text-primary animate-spin mb-4" />
                  <p className="text-sm font-bold text-on-surface">Đang tính toán giá gợi ý bằng AI...</p>
                  <p className="text-xs text-on-surface-variant mt-1.5">AI Gemini đang đối chiếu giá vốn, quy định lợi nhuận và giá đối thủ để đề xuất giá bán tối ưu.</p>
                </div>
              ) : bulkSuggestError ? (
                <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20">
                  <AlertCircle size={20} className="shrink-0" />
                  <div className="text-sm font-medium">{bulkSuggestError}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-surface-container-low p-3.5 rounded-xl border border-outline-variant text-xs text-on-surface-variant leading-relaxed">
                    💡 Hãy xem xét các mức giá được AI đề xuất dưới đây. Bạn có thể tích chọn/bỏ chọn từng sản phẩm để chỉ áp dụng cho những sản phẩm mong muốn. Giá đề xuất luôn đảm bảo không thấp hơn giá sàn quy định.
                  </div>

                  <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                    <div className="overflow-x-auto max-h-[45vh]">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low/50 sticky top-0">
                            <th className="p-3 font-bold text-on-surface-variant text-center w-12">
                              <input
                                type="checkbox"
                                checked={bulkSuggestResults.length > 0 && bulkSuggestResults.every(r => r.selected)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setBulkSuggestResults(prev => prev.map(r => ({ ...r, selected: checked })));
                                }}
                                className="rounded border-outline-variant focus:ring-primary text-primary bg-surface-container-lowest"
                              />
                            </th>
                            <th className="p-3 font-bold text-on-surface-variant">Sản phẩm</th>
                            <th className="p-3 font-bold text-on-surface-variant">Danh mục</th>
                            <th className="p-3 font-bold text-on-surface-variant">Giá vốn</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right">Giá hiện tại</th>
                            <th className="p-3 font-bold text-on-surface-variant text-right text-primary">Giá đề xuất (AI)</th>
                            <th className="p-3 font-bold text-on-surface-variant text-center">Độ tin cậy</th>
                            <th className="p-3 font-bold text-on-surface-variant">Lý do gợi ý</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/60">
                          {bulkSuggestResults.map((result) => (
                            <tr key={result.productId} className="hover:bg-surface-container-low/20 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={result.selected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setBulkSuggestResults(prev => prev.map(r => r.productId === result.productId ? { ...r, selected: checked } : r));
                                  }}
                                  className="rounded border-outline-variant focus:ring-primary text-primary bg-surface-container-lowest"
                                />
                              </td>
                              <td className="p-3 font-medium text-on-surface">
                                <div className="max-w-[150px] truncate" title={result.productName}>{result.productName}</div>
                                <div className="text-[10px] text-on-surface-variant font-mono">{result.sku || 'Chưa có SKU'}</div>
                              </td>
                              <td className="p-3">
                                <select
                                  value={result.categoryId || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBulkSuggestResults(prev => prev.map(r => r.productId === result.productId ? { ...r, categoryId: val } : r));
                                  }}
                                  className="bg-surface-container-low border border-outline-variant rounded-lg py-1 px-2 focus:ring-1 focus:ring-primary text-xs w-36"
                                >
                                  <option value="">-- Chọn danh mục --</option>
                                  {categories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={result.costPrice || ''}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setBulkSuggestResults(prev => prev.map(r => r.productId === result.productId ? { ...r, costPrice: val } : r));
                                  }}
                                  placeholder="Nhập giá vốn"
                                  className="bg-surface-container-low border border-outline-variant rounded-lg py-1 px-2 focus:ring-1 focus:ring-primary text-xs font-mono w-24"
                                />
                              </td>
                              <td className="p-3 text-right font-mono text-on-surface-variant">{formatVND(result.currentPrice)}</td>
                              <td className="p-3 text-right">
                                {result.suggestedPrice > 0 ? (
                                  <div className="flex flex-col items-end gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      value={result.suggestedPrice || ''}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setBulkSuggestResults(prev => prev.map(r => r.productId === result.productId ? { ...r, suggestedPrice: val } : r));
                                      }}
                                      placeholder="Giá gợi ý"
                                      className={`bg-surface-container-low border rounded-lg py-1 px-2 focus:ring-1 text-xs font-mono w-24 font-bold text-right ${result.suggestedPrice < result.floorPrice ? 'border-error text-error focus:ring-error' : 'border-primary/40 text-primary focus:ring-primary'
                                        }`}
                                    />
                                    {result.floorPrice > 0 && (
                                      <span className={`text-[10px] ${result.suggestedPrice < result.floorPrice ? 'text-error font-semibold' : 'text-on-surface-variant'}`}>
                                        Sàn: {formatVND(result.floorPrice)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="font-mono text-on-surface-variant text-right block w-24">---</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                {result.confidence > 0 ? (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${result.confidence >= 80 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                    }`}>
                                    {result.confidence}%
                                  </span>
                                ) : '---'}
                              </td>
                              <td className="p-3 text-xs text-on-surface-variant leading-relaxed min-w-[280px] break-words whitespace-normal">
                                {result.reason || 'Chưa chạy phân tích'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
              <button
                type="button"
                disabled={bulkUpdateLoading}
                onClick={() => setShowBulkSuggestModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Hủy
              </button>
              {!bulkSuggestError && (
                <button
                  type="button"
                  disabled={isBulkSuggesting || bulkUpdateLoading}
                  onClick={runBulkAIPriceSuggest}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-on-secondary hover:bg-opacity-95 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isBulkSuggesting ? (
                    <><RefreshCw size={14} className="animate-spin" /> Đang phân tích...</>
                  ) : (
                    <><Sparkles size={14} /> Phân tích & Gợi ý giá (AI)</>
                  )}
                </button>
              )}
              {!bulkSuggestError && !isBulkSuggesting && bulkSuggestResults.some(r => r.suggestedPrice > 0) && (
                <button
                  type="button"
                  disabled={bulkUpdateLoading || !bulkSuggestResults.some(r => r.selected)}
                  onClick={handleApplyBulkPrices}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkUpdateLoading ? (
                    <><RefreshCw size={14} className="animate-spin" /> Đang cập nhật...</>
                  ) : (
                    <><Check size={14} /> Áp dụng giá đã chọn</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
