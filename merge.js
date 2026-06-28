const fs = require('fs');
const path = require('path');

const updatePath = path.join(__dirname, 'FE/src/pages/adminDashboard/ManageInventoryPage(update).tsx');
const targetPath = path.join(__dirname, 'FE/src/pages/adminDashboard/ManageInventoryPage.tsx');

let content = fs.readFileSync(updatePath, 'utf8');

// 1. Imports
content = content.replace("Minus\n}", "Minus,\n  Play,\n  Square\n}");
if (!content.includes("import apiClient")) {
    content = content.replace("import { inventoryService }", "import apiClient from '@/services/api';\nimport { inventoryService }");
}

// 2. Crawler states
const statesCode = `
  // Crawler states
  const [isCrawling, setIsCrawling] = useState(false);
  const [showCrawlerStopConfirm, setShowCrawlerStopConfirm] = useState(false);
`;
content = content.replace("  // Fetch branches and categories on mount", statesCode + "\n  // Fetch branches and categories on mount");

// 3. Crawler effects
const effectsCode = `
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
`;
content = content.replace("  // Fetch products (all active/inactive) for catalog and receipts", effectsCode + "\n  // Fetch products (all active/inactive) for catalog and receipts");

// 4. Crawler buttons in header (Admin tab)
const headerBtnOld = `          {activeTab === 'catalog' && (
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
          )}`;

const headerBtnNew = `          {activeTab === 'catalog' && (
            <div className="flex gap-2">
              <button
                onClick={handleToggleCrawler}
                className={\`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 \${
                  isCrawling ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'
                }\`}
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
                className={\`inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-opacity-90 active:scale-95 shadow-md hover:shadow-lg \${isCrawling ? 'opacity-50 cursor-not-allowed' : ''}\`}
                type="button"
              >
                <Plus size={18} />
                Thêm sản phẩm mới
              </button>
            </div>
          )}`;

// It's in the header, might be rendered inside `isAdmin && (` block or just `{activeTab === 'catalog' && (` block.
// The code in update file has:
//          {activeTab === 'catalog' && (
//            <button
//              onClick={() => {
content = content.replace(headerBtnOld, headerBtnNew);

// 5. Disable trash button inside table
const trashBtnOld = `                              <button
                                onClick={() => handleToggleProductStatus(product)}
                                className={\`rounded-lg p-2 transition-colors \${isActive
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-success hover:bg-success-container/20'
                                  }\`}
                                title={isActive ? 'Dừng bán sản phẩm' : 'Kích hoạt lại sản phẩm'}
                              >`;

const trashBtnNew = `                              <button
                                onClick={() => handleToggleProductStatus(product)}
                                disabled={isCrawling}
                                className={\`rounded-lg p-2 transition-colors \${isCrawling ? 'opacity-50 cursor-not-allowed' : ''} \${isActive
                                  ? 'text-error hover:bg-error-container/20'
                                  : 'text-success hover:bg-success-container/20'
                                  }\`}
                                title={isActive ? 'Dừng bán sản phẩm' : 'Kích hoạt lại sản phẩm'}
                              >`;
content = content.replace(trashBtnOld, trashBtnNew);

// 6. Crawler Stop Confirm Modal at the bottom
const modalCode = `
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
    </div>
`;
content = content.replace("    </div>\n  )\n}", modalCode + "  )\n}");

// Check if replacements were successful
if (content === fs.readFileSync(updatePath, 'utf8')) {
    console.log("Error: No replacements were made. Please check the replacement strings.");
} else {
    fs.writeFileSync(targetPath, content, 'utf8');
    console.log("Successfully merged the files.");
}
