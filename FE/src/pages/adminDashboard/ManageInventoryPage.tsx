import { useState, useEffect } from 'react'
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
  Pencil
} from 'lucide-react'
import { inventoryService } from '@services/inventoryService'
import { branchService } from '@services/branchService'
import { productService } from '@services/productService'
import { categoryService } from '@services/categoryService'
import type { Inventory, ImportReceipt, Branch, Product, Category } from '@/types'

const formatVND = (num: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(num)
}

export const ManageInventoryPage = () => {
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
  
  // Create Receipt Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [importBranchId, setImportBranchId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [importNote, setImportNote] = useState('')
  const [importItems, setImportItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([
    { productId: '', quantity: 1, unitCost: 0 }
  ])

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
    salePrice: 0,
    unit: 'item',
    description: '',
    imageUrl: '',
    categoryId: '',
    status: 'active' as 'active' | 'inactive'
  })

  // Fetch branches and categories on mount
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await branchService.getBranches()
        if (response.success) {
          const activeBranches = response.data.filter(b => b.status === 'active')
          setBranches(activeBranches)
          if (activeBranches.length > 0) {
            setSelectedBranchId(activeBranches[0]._id)
            setImportBranchId(activeBranches[0]._id)
          }
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

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCatalogPage(1)
  }, [catalogSearch])

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
    if (activeTab === 'import') {
      fetchReceipts()
    }
  }, [activeTab, selectedBranchId])

  // --- ACTIONS ---
  
  // Add item row in import builder
  const addImportItemRow = () => {
    setImportItems([...importItems, { productId: '', quantity: 1, unitCost: 0 }])
  }

  // Remove item row in import builder
  const removeImportItemRow = (index: number) => {
    if (importItems.length === 1) return
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

  // Submit new import receipt
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importBranchId) {
      setImportError('Vui lòng chọn chi nhánh nhập hàng.')
      return
    }
    
    // Check if any product is empty
    const hasEmptyProduct = importItems.some((item) => !item.productId)
    if (hasEmptyProduct) {
      setImportError('Vui lòng chọn đầy đủ sản phẩm cho mỗi dòng nhập.')
      return
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
        setImportItems([{ productId: '', quantity: 1, unitCost: 0 }])
        setTimeout(() => {
          setImportSuccess(false)
          setIsImportModalOpen(false)
          fetchReceipts() // refresh history
          fetchInventory() // refresh stock
        }, 1500)
      } else {
        setImportError(res.message || 'Không thể tạo phiếu nhập kho.')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi hệ thống khi tạo phiếu nhập kho.'
      setImportError(msg)
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
      salePrice: 0,
      unit: 'item',
      description: '',
      imageUrl: '',
      categoryId: '',
      status: 'active'
    })
  }

  // Toggle activation status (Dừng bán / Mở bán lại)
  const handleToggleProductStatus = async (product: Product) => {
    const isActive = product.status === 'active' || product.status === true
    const actionText = isActive ? 'dừng bán' : 'mở bán lại'
    
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} sản phẩm "${product.productName || product.name}" không?`)) {
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
          setCatalogError(res.message || `Không thể ${actionText} sản phẩm.`)
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || `Lỗi khi thực hiện thao tác ${actionText}.`
        setCatalogError(msg)
      } finally {
        setCatalogLoading(false)
      }
    }
  }

  // Submit new or edited master product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name.trim() || !productForm.sku.trim()) {
      setProductError('Tên sản phẩm và SKU là bắt buộc.')
      return
    }

    try {
      setProductLoading(true)
      setProductError(null)

      const payload: any = {
        name: productForm.name.trim(),
        sku: productForm.sku.trim().toUpperCase(),
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
        setProductError(res.message || (editingProduct ? 'Không thể cập nhật sản phẩm.' : 'Không thể tạo sản phẩm.'))
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || (editingProduct ? 'Lỗi khi cập nhật sản phẩm.' : 'Lỗi khi tạo sản phẩm.')
      setProductError(msg)
    } finally {
      setProductLoading(false)
    }
  }

  // Filter stock locally based on stockSearch keyword
  const filteredStock = inventoryList.filter((item) => {
    if (!stockSearch.trim()) return true
    const keyword = stockSearch.toLowerCase()
    const nameMatch = item.productId?.productName?.toLowerCase().includes(keyword) || item.productId?.name?.toLowerCase().includes(keyword)
    const skuMatch = item.productId?.sku?.toLowerCase().includes(keyword)
    return nameMatch || skuMatch
  })

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
          {activeTab === 'import' && (
            <button
              onClick={() => {
                setImportError(null)
                setImportSuccess(false)
                setIsImportModalOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 shadow-md hover:shadow-lg"
              type="button"
            >
              <PlusCircle size={18} />
              Tạo phiếu nhập kho
            </button>
          )}
          {activeTab === 'catalog' && (
            <button
              onClick={() => {
                setEditingProduct(null)
                setImageFile(null)
                setProductForm({
                  name: '',
                  sku: '',
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 shadow-md hover:shadow-lg"
              type="button"
            >
              <Plus size={18} />
              Thêm sản phẩm mới
            </button>
          )}
        </div>
      </section>

      {/* ── TAB SELECTOR ── */}
      <div className="border-b border-outline-variant flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('stock')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'stock'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Package size={18} />
          Báo cáo Tồn kho
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'import'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <History size={18} />
          Lịch sử Nhập kho
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-primary text-primary font-black'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Layers size={18} />
          Danh mục Sản phẩm gốc
        </button>
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
                className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
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
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá nhập gần nhất</th>
                      <th className="p-4 font-bold text-on-surface-variant text-center">Trạng thái kho</th>
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
                            {item.lastImportCost !== undefined ? formatVND(item.lastImportCost) : 'N/A'}
                          </td>
                          <td className="p-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isLow
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
          {/* Branch Selector for imports */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-on-surface-variant whitespace-nowrap">Lọc theo chi nhánh:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-surface-container-low border-none rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
              >
                <option value="">Tất cả chi nhánh</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
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
          ) : receiptsList.length === 0 ? (
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
                    {receiptsList.map((rec) => {
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
                      <th className="p-4 font-bold text-on-surface-variant text-right">Giá Bán Niêm Yết</th>
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
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                isActive
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
                                className={`rounded-lg p-2 transition-colors ${
                                  isActive
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
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-semibold transition-all"
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

              {/* Items List Builder */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-sm font-black text-on-surface">Danh sách hàng nhập</span>
                  <button
                    type="button"
                    onClick={addImportItemRow}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <PlusCircle size={14} />
                    Thêm dòng hàng
                  </button>
                </div>

                {importItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-3 items-end bg-surface-container-low/40 p-3 rounded-xl border border-outline-variant/40">
                    {/* Product Selection */}
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Sản phẩm <span className="text-error">*</span>
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => updateImportItemRow(idx, 'productId', e.target.value)}
                        required
                        className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary text-xs font-medium transition-all"
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.productName} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-full md:w-28 space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Số lượng nhập
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateImportItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary text-xs text-right font-bold transition-all"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="w-full md:w-32 space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Giá vốn (đ)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={item.unitCost}
                        onChange={(e) => updateImportItemRow(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full bg-surface-container-low border-none rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary text-xs text-right font-bold transition-all"
                      />
                    </div>

                    {/* Subtotal calculation */}
                    <div className="w-full md:w-28 space-y-1">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Thành tiền
                      </label>
                      <div className="w-full py-2 text-xs text-right font-bold text-primary">
                        {formatVND(item.quantity * item.unitCost)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => removeImportItemRow(idx)}
                      disabled={importItems.length === 1}
                      className="rounded-lg p-2 text-error hover:bg-error-container/30 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
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
                    Mã SKU <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    id="prod-sku"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: APPLE-GALA"
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm font-mono transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Giá bán niêm yết */}
                <div className="space-y-1.5">
                  <label htmlFor="prod-price" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                    Giá bán (đ) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    id="prod-price"
                    required
                    min="0"
                    step="1"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>

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
    </div>
  )
}
