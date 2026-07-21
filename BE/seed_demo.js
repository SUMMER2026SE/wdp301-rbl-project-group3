/**
 * DEMO SEED SCRIPT — PMAN-Mart
 * Chạy: node seed_demo.js
 * Chuẩn bị toàn bộ data cần thiết cho buổi demo
 */

// DNS override for Windows environments
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://admin:2005huuphuc@cluster0.xbuducm.mongodb.net/minimart_db';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const log = (msg) => console.log(`\n✅ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

async function seed() {
  await mongoose.connect(MONGODB_URI);
  log('Kết nối MongoDB thành công');

  const db = mongoose.connection.db;

  // ──────────────────────────────────────────────────────────────────────────────
  // 1. SYSTEM SETTINGS — Đảm bảo tất cả cài đặt hệ thống tồn tại
  // ──────────────────────────────────────────────────────────────────────────────
  const settings = [
    { key: 'store_name', label: 'Tên cửa hàng', group: 'general', value: 'PMAN-Mart', valueType: 'string', isPublic: true, description: 'Tên hiển thị của cửa hàng' },
    { key: 'hotline', label: 'Hotline', group: 'general', value: '1900 1234', valueType: 'string', isPublic: true, description: 'Số điện thoại hỗ trợ khách hàng' },
    { key: 'support_email', label: 'Email hỗ trợ', group: 'general', value: 'support@pmanmart.vn', valueType: 'string', isPublic: true, description: 'Email liên hệ hỗ trợ' },
    { key: 'maintenance_mode', label: 'Chế độ bảo trì', group: 'general', value: false, valueType: 'boolean', isPublic: true, description: 'Bật để chặn truy cập khách hàng' },
    { key: 'min_order_amount', label: 'Giá trị đơn tối thiểu', group: 'order', value: 50000, valueType: 'number', isPublic: true, description: 'Đơn hàng tối thiểu để đặt (VNĐ)' },
    { key: 'order_cancel_timeout_minutes', label: 'Thời gian hủy đơn (phút)', group: 'order', value: 30, valueType: 'number', isPublic: false, description: 'Thời gian tối đa khách được hủy đơn' },
    { key: 'free_shipping_threshold', label: 'Ngưỡng miễn phí vận chuyển', group: 'delivery', value: 300000, valueType: 'number', isPublic: true, description: 'Đơn từ mức này sẽ miễn phí ship (VNĐ)' },
    { key: 'default_delivery_fee', label: 'Phí giao hàng mặc định', group: 'delivery', value: 25000, valueType: 'number', isPublic: true, description: 'Phí ship khi đơn dưới ngưỡng miễn phí (VNĐ)' },
    { key: 'vat_rate', label: 'Thuế suất VAT (%)', group: 'payment', value: 10, valueType: 'number', isPublic: true, description: 'Thuế VAT cộng vào hóa đơn' },
    { key: 'loyalty_points_per_10k', label: 'Điểm thưởng mỗi 10.000đ', group: 'loyalty', value: 1, valueType: 'number', isPublic: true, description: 'Số điểm tích lũy cho mỗi 10.000đ chi tiêu' },
    { key: 'loyalty_bronze_threshold', label: 'Ngưỡng hạng Đồng (điểm)', group: 'loyalty', value: 100, valueType: 'number', isPublic: true, description: 'Điểm trọn đời để lên hạng Đồng' },
    { key: 'loyalty_silver_threshold', label: 'Ngưỡng hạng Bạc (điểm)', group: 'loyalty', value: 300, valueType: 'number', isPublic: true, description: 'Điểm trọn đời để lên hạng Bạc' },
    { key: 'loyalty_gold_threshold', label: 'Ngưỡng hạng Vàng (điểm)', group: 'loyalty', value: 600, valueType: 'number', isPublic: true, description: 'Điểm trọn đời để lên hạng Vàng' },
    { key: 'loyalty_diamond_threshold', label: 'Ngưỡng hạng Kim Cương (điểm)', group: 'loyalty', value: 1000, valueType: 'number', isPublic: true, description: 'Điểm trọn đời để lên hạng Kim Cương' },
  ];

  for (const s of settings) {
    const exists = await db.collection('systemsettings').findOne({ key: s.key });
    if (!exists) {
      await db.collection('systemsettings').insertOne({ ...s, createdAt: new Date(), updatedAt: new Date() });
      log(`Setting tạo mới: ${s.key} = ${s.value}`);
    } else {
      warn(`Setting đã có: ${s.key} = ${exists.value} (giữ nguyên)`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 2. TÀI KHOẢN DEMO — admin, branch_manager, staff, customer
  // ──────────────────────────────────────────────────────────────────────────────
  const demoUsers = [
    {
      email: 'admin@demo.com',
      password: 'Demo@123',
      fullName: 'Quản Trị Demo',
      role: 'admin',
      isEmailVerified: true,
      memberLevel: 'new',
      points: 0,
      lifetimePoints: 0,
      refreshTokenVersion: 0,
    },
    {
      email: 'manager@demo.com',
      password: 'Demo@123',
      fullName: 'Nguyễn Quản Lý',
      role: 'branch_manager',
      isEmailVerified: true,
      memberLevel: 'new',
      points: 0,
      lifetimePoints: 0,
      refreshTokenVersion: 0,
    },
    {
      email: 'staff@demo.com',
      password: 'Demo@123',
      fullName: 'Trần Nhân Viên',
      role: 'staff',
      isEmailVerified: true,
      memberLevel: 'new',
      points: 0,
      lifetimePoints: 0,
      refreshTokenVersion: 0,
    },
    {
      email: 'customer@demo.com',
      password: 'Demo@123',
      fullName: 'Lê Khách Hàng',
      role: 'customer',
      isEmailVerified: true,
      memberLevel: 'bronze',
      points: 150,
      lifetimePoints: 250,
      refreshTokenVersion: 0,
    },
  ];

  for (const u of demoUsers) {
    const exists = await db.collection('users').findOne({ email: u.email });
    const { password, ...userFields } = u;
    const hash = await bcrypt.hash(password, 10);
    const docData = {
      ...userFields,
      passwordHash: hash,
      status: 'active',
      isLocked: false,
      authProvider: 'local',
      updatedAt: new Date(),
    };
    if (!exists) {
      await db.collection('users').insertOne({
        ...docData,
        createdAt: new Date(),
      });
      log(`User tạo mới: ${u.email} / ${password} [${u.role}]`);
    } else {
      await db.collection('users').updateOne(
        { _id: exists._id },
        { $set: docData }
      );
      warn(`User đã có: ${u.email} [${exists.role}] (cập nhật thông tin & active)`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 3. CATEGORIES — Các danh mục sản phẩm
  // ──────────────────────────────────────────────────────────────────────────────
  const categories = [
    { name: 'Thực phẩm tươi sống', code: 'TUOISONG', description: 'Rau củ, thịt, hải sản tươi sống', minMargin: 20, status: 'active' },
    { name: 'Đồ uống', code: 'DOUONG', description: 'Nước ngọt, nước ép, trà sữa', minMargin: 25, status: 'active' },
    { name: 'Bánh kẹo & Snack', code: 'BANHKEO', description: 'Bánh kẹo, snack, đồ ngọt', minMargin: 30, status: 'active' },
    { name: 'Gia vị & Nước chấm', code: 'GIAVI', description: 'Nước mắm, tương, gia vị nấu ăn', minMargin: 20, status: 'active' },
    { name: 'Chăm sóc cá nhân', code: 'CHAMSOCC', description: 'Sữa tắm, dầu gội, kem đánh răng', minMargin: 35, status: 'active' },
    { name: 'Đồ dùng gia đình', code: 'DODUONG', description: 'Giấy ăn, túi nilon, đồ dùng bếp', minMargin: 25, status: 'active' },
  ];

  const catIds = {};
  for (const cat of categories) {
    const exists = await db.collection('categories').findOne({ name: cat.name });
    if (!exists) {
      const res = await db.collection('categories').insertOne({ ...cat, createdAt: new Date(), updatedAt: new Date() });
      catIds[cat.name] = res.insertedId;
      log(`Category tạo: ${cat.name}`);
    } else {
      catIds[cat.name] = exists._id;
      warn(`Category đã có: ${cat.name}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 4. BRANCHES — Chi nhánh
  // ──────────────────────────────────────────────────────────────────────────────
  const branches = [
    { name: 'Chi nhánh Hải Châu', code: 'HAICHAU', address: '12 Trần Phú, Q.Hải Châu, Đà Nẵng', phone: '0236 1234 5678', status: 'active', openingTime: '07:00', closingTime: '22:00' },
    { name: 'Chi nhánh Thanh Khê', code: 'THANHKHE', address: '88 Điện Biên Phủ, Q.Thanh Khê, Đà Nẵng', phone: '0236 2345 6789', status: 'active', openingTime: '07:00', closingTime: '22:00' },
    { name: 'Chi nhánh Ngũ Hành Sơn', code: 'NGUHANSON', address: '45 Trường Sa, Q.Ngũ Hành Sơn, Đà Nẵng', phone: '0236 3456 7890', status: 'active', openingTime: '07:00', closingTime: '22:00' },
  ];

  const branchIds = [];
  for (const b of branches) {
    const exists = await db.collection('branches').findOne({ code: b.code });
    if (!exists) {
      const res = await db.collection('branches').insertOne({ ...b, createdAt: new Date(), updatedAt: new Date() });
      branchIds.push(res.insertedId);
      log(`Branch tạo: ${b.name}`);
    } else {
      await db.collection('branches').updateOne({ _id: exists._id }, { $set: { ...b, updatedAt: new Date() } });
      branchIds.push(exists._id);
      warn(`Branch đã có: ${b.name} (cập nhật thông tin)`);
    }
  }

  // Gán chi nhánh Hải Châu cho tài khoản manager và staff
  const haichauBranchId = branchIds[0];
  if (haichauBranchId) {
    await db.collection('users').updateMany(
      { email: { $in: ['manager@demo.com', 'staff@demo.com'] } },
      { $set: { branchId: haichauBranchId } }
    );
    log('Đã gán chi nhánh Hải Châu cho tài khoản manager và staff');
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 5. PRODUCTS — Sản phẩm mẫu đủ đa dạng
  // ──────────────────────────────────────────────────────────────────────────────
  const products = [
    // Thực phẩm tươi sống
    { name: 'Rau cải xanh', description: 'Rau cải xanh hữu cơ, tươi ngon', unit: 'bó', costPrice: 8000, salePrice: 12000, categoryName: 'Thực phẩm tươi sống', imageUrl: 'https://via.placeholder.com/300?text=Rau+Cải', status: 'active' },
    { name: 'Thịt ba chỉ heo', description: 'Thịt ba chỉ tươi, nhập hàng ngày', unit: 'kg', costPrice: 90000, salePrice: 125000, categoryName: 'Thực phẩm tươi sống', imageUrl: 'https://via.placeholder.com/300?text=Thịt+Heo', status: 'active' },
    { name: 'Trứng gà ta 10 quả', description: 'Trứng gà ta sạch, 10 quả/khay', unit: 'khay', costPrice: 30000, salePrice: 42000, categoryName: 'Thực phẩm tươi sống', imageUrl: 'https://via.placeholder.com/300?text=Trứng+Gà', status: 'active' },

    // Đồ uống
    { name: 'Coca-Cola 330ml', description: 'Nước ngọt Coca-Cola lon 330ml', unit: 'lon', costPrice: 8000, salePrice: 12000, categoryName: 'Đồ uống', imageUrl: 'https://via.placeholder.com/300?text=Coca-Cola', status: 'active' },
    { name: 'Nước suối Aquafina 500ml', description: 'Nước khoáng Aquafina chai 500ml', unit: 'chai', costPrice: 4000, salePrice: 7000, categoryName: 'Đồ uống', imageUrl: 'https://via.placeholder.com/300?text=Aquafina', status: 'active' },
    { name: 'Trà xanh không độ 450ml', description: 'Trà xanh không đường không calo', unit: 'chai', costPrice: 8000, salePrice: 13000, categoryName: 'Đồ uống', imageUrl: 'https://via.placeholder.com/300?text=Trà+Xanh', status: 'active' },

    // Bánh kẹo
    { name: 'Bánh Oreo chocolate', description: 'Bánh quy Oreo hộp 133g', unit: 'hộp', costPrice: 18000, salePrice: 28000, categoryName: 'Bánh kẹo & Snack', imageUrl: 'https://via.placeholder.com/300?text=Oreo', status: 'active' },
    { name: 'Snack Pringles 165g', description: 'Snack khoai tây Pringles lon 165g', unit: 'lon', costPrice: 45000, salePrice: 65000, categoryName: 'Bánh kẹo & Snack', imageUrl: 'https://via.placeholder.com/300?text=Pringles', status: 'active' },
    { name: 'Kẹo dẻo Haribo', description: 'Kẹo dẻo trái cây Haribo gói 100g', unit: 'gói', costPrice: 22000, salePrice: 35000, categoryName: 'Bánh kẹo & Snack', imageUrl: 'https://via.placeholder.com/300?text=Haribo', status: 'active' },

    // Gia vị
    { name: 'Nước mắm Phú Quốc 500ml', description: 'Nước mắm truyền thống Phú Quốc', unit: 'chai', costPrice: 28000, salePrice: 42000, categoryName: 'Gia vị & Nước chấm', imageUrl: 'https://via.placeholder.com/300?text=Nước+Mắm', status: 'active' },
    { name: 'Dầu ăn Tường An 1L', description: 'Dầu ăn tinh khiết Tường An 1 lít', unit: 'chai', costPrice: 38000, salePrice: 55000, categoryName: 'Gia vị & Nước chấm', imageUrl: 'https://via.placeholder.com/300?text=Dầu+Ăn', status: 'active' },

    // Chăm sóc cá nhân
    { name: 'Sữa tắm Dove 530ml', description: 'Sữa tắm dưỡng ẩm Dove hương sữa', unit: 'chai', costPrice: 65000, salePrice: 95000, categoryName: 'Chăm sóc cá nhân', imageUrl: 'https://via.placeholder.com/300?text=Dove', status: 'active' },
    { name: 'Dầu gội Clear Men 380ml', description: 'Dầu gội sạch gàu Clear Men', unit: 'chai', costPrice: 55000, salePrice: 82000, categoryName: 'Chăm sóc cá nhân', imageUrl: 'https://via.placeholder.com/300?text=Clear', status: 'active' },

    // Đồ dùng
    { name: 'Giấy ăn Bless You 200 tờ', description: 'Giấy ăn mềm dai Bless You hộp 200 tờ', unit: 'hộp', costPrice: 18000, salePrice: 27000, categoryName: 'Đồ dùng gia đình', imageUrl: 'https://via.placeholder.com/300?text=Giấy+Ăn', status: 'active' },
  ];

  const productIds = [];
  for (const p of products) {
    const categoryId = catIds[p.categoryName];
    const { categoryName, ...rest } = p;
    const normalizedName = normalizeString(p.name);
    const normalizedUnit = normalizeString(p.unit);
    const sku = `PM-${normalizedName.toUpperCase().replace(/\s+/g, '')}`;

    const exists = await db.collection('products').findOne({ name: p.name });
    if (!exists) {
      const res = await db.collection('products').insertOne({
        ...rest,
        sku,
        categoryId,
        normalizedName,
        normalizedUnit,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      productIds.push({ id: res.insertedId, costPrice: p.costPrice, name: p.name });
      log(`Product tạo: ${p.name}`);
    } else {
      await db.collection('products').updateOne(
        { _id: exists._id },
        { $set: { sku: exists.sku || sku, normalizedName, normalizedUnit, status: 'active', costPrice: p.costPrice, salePrice: p.salePrice } }
      );
      productIds.push({ id: exists._id, costPrice: exists.costPrice || p.costPrice, name: p.name });
      warn(`Product đã có: ${p.name} (cập nhật thông tin)`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 6. INVENTORY — Tồn kho tại chi nhánh đầu tiên
  // ──────────────────────────────────────────────────────────────────────────────
  const branchId = branchIds[0];
  for (const p of productIds) {
    const exists = await db.collection('inventories').findOne({ productId: p.id, branchId });
    if (!exists) {
      // Một số sản phẩm sắp hết để demo cảnh báo
      const isLow = ['Rau cải xanh', 'Nước suối Aquafina 500ml'].includes(p.name);
      await db.collection('inventories').insertOne({
        productId: p.id,
        branchId,
        quantity: isLow ? 5 : Math.floor(Math.random() * 80 + 20),
        minQuantity: 10,
        averageCost: p.costPrice,
        lastImportCost: p.costPrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      log(`Inventory tạo: ${p.name} tại nhánh ${branchId}`);
    } else {
      warn(`Inventory đã có: ${p.name}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 7. SHIFT TEMPLATES — Ca làm việc mẫu
  // ──────────────────────────────────────────────────────────────────────────────
  const shifts = [
    { name: 'Ca sáng', startTime: '07:00', endTime: '13:00', branchId, description: 'Ca làm buổi sáng 7h-13h', isActive: true },
    { name: 'Ca chiều', startTime: '13:00', endTime: '19:00', branchId, description: 'Ca làm buổi chiều 13h-19h', isActive: true },
    { name: 'Ca tối', startTime: '19:00', endTime: '23:00', branchId, description: 'Ca làm buổi tối 19h-23h', isActive: true },
  ];

  for (const s of shifts) {
    const exists = await db.collection('shifttemplates').findOne({ name: s.name, branchId });
    if (!exists) {
      await db.collection('shifttemplates').insertOne({ ...s, createdAt: new Date(), updatedAt: new Date() });
      log(`ShiftTemplate tạo: ${s.name}`);
    } else {
      warn(`ShiftTemplate đã có: ${s.name}`);
    }
  }
  // ──────────────────────────────────────────────────────────────────────────────
  // 8. PROMOTION — Chương trình khuyến mãi + Voucher mẫu (Sửa đổi theo Schema)
  // ──────────────────────────────────────────────────────────────────────────────
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const adminUser = await db.collection('users').findOne({ role: 'admin' });
  const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

  // 8.1 Promotion Khai Trương (Percentage)
  const promoExists = await db.collection('promotions').findOne({ name: 'KHAI TRUONG PMAN-MART' });
  let promoId;
  if (!promoExists) {
    const res = await db.collection('promotions').insertOne({
      name: 'KHAI TRUONG PMAN-MART',
      description: 'Chương trình ưu đãi khai trương — giảm 20% cho tất cả đơn hàng từ 150.000đ',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 150000,
      maxDiscountAmount: 50000,
      pointCost: 0,
      targetMemberLevel: 'all',
      scope: 'global',
      startDate: now,
      endDate: nextMonth,
      usageCount: 0,
      status: 'active',
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    promoId = res.insertedId;
    log('Promotion tạo: KHAI TRUONG PMAN-MART (giảm 20%)');

    // Tạo vouchers tương ứng (đầy đủ schema thuộc tính của voucher)
    const vouchers = ['KHAI20A', 'KHAI20B', 'KHAI20C', 'DEMO2025', 'PMAN20OFF'];
    for (const code of vouchers) {
      await db.collection('vouchers').insertOne({
        code,
        promotionId: promoId,
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 150000,
        maxDiscountAmount: 50000,
        pointCost: 0,
        targetMemberLevel: 'all',
        expiresAt: nextMonth,
        status: 'active',
        claims: [],
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    log(`Vouchers tạo: ${vouchers.join(', ')}`);
  } else {
    warn('Promotion KHAI TRUONG đã có');
    promoId = promoExists._id;
  }

  // 8.2 Promotion đổi điểm (fixed_amount)
  const pointsPromoExists = await db.collection('promotions').findOne({ name: 'ĐỔI ĐIỂM LẤY VOUCHER 30K' });
  if (!pointsPromoExists) {
    const res2 = await db.collection('promotions').insertOne({
      name: 'ĐỔI ĐIỂM LẤY VOUCHER 30K',
      description: 'Dùng 100 điểm tích lũy để đổi voucher giảm 30.000đ cho đơn từ 200.000đ',
      discountType: 'fixed_amount',
      discountValue: 30000,
      minOrderAmount: 200000,
      maxDiscountAmount: 30000,
      pointCost: 100,
      targetMemberLevel: 'bronze',
      scope: 'global',
      startDate: now,
      endDate: nextMonth,
      usageCount: 0,
      status: 'active',
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const p2id = res2.insertedId;

    await db.collection('vouchers').insertOne({
      code: 'DIEM30K',
      promotionId: p2id,
      discountType: 'fixed_amount',
      discountValue: 30000,
      minOrderAmount: 200000,
      maxDiscountAmount: 30000,
      pointCost: 100,
      targetMemberLevel: 'bronze',
      expiresAt: nextMonth,
      status: 'active',
      claims: [],
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    log('Promotion ĐỔI ĐIỂM tạo + voucher DIEM30K (cần 100 điểm)');
  } else {
    warn('Promotion ĐỔI ĐIỂM đã có');
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 9. BANNER — Banner trang chủ
  // ──────────────────────────────────────────────────────────────────────────────
  const banners = [
    {
      title: 'Khai Trương PMAN-Mart — Giảm 20%',
      description: 'Mừng khai trương, giảm 20% toàn bộ sản phẩm. Áp dụng mã KHAI20A',
      imageUrl: 'https://via.placeholder.com/1200x400/4CAF50/white?text=Khai+Truong+PMAN-Mart',
      linkUrl: '/',
      position: 1,
      isActive: true,
    },
    {
      title: 'Flash Sale Cuối Tuần',
      description: 'Hàng trăm sản phẩm giảm giá sốc mỗi cuối tuần',
      imageUrl: 'https://via.placeholder.com/1200x400/FF5722/white?text=Flash+Sale+Cuoi+Tuan',
      linkUrl: '/',
      position: 2,
      isActive: true,
    },
  ];

  for (const b of banners) {
    const exists = await db.collection('banners').findOne({ title: b.title });
    if (!exists) {
      await db.collection('banners').insertOne({ ...b, createdAt: new Date(), updatedAt: new Date() });
      log(`Banner tạo: ${b.title}`);
    } else {
      warn(`Banner đã có: ${b.title}`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 10. FLASH SALE — Flash sale đang chạy
  // ──────────────────────────────────────────────────────────────────────────────
  const flashExists = await db.collection('flashsales').findOne({ name: 'FLASH SALE DEMO' });
  if (!flashExists) {
    const fsStart = new Date(now.getTime() - 30 * 60 * 1000); // bắt đầu 30 phút trước
    const fsEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // kết thúc sau 2 tiếng

    const colaProduct = productIds.find(p => p.name === 'Coca-Cola 330ml');
    const snackProduct = productIds.find(p => p.name === 'Snack Pringles Original');

    await db.collection('flashsales').insertOne({
      name: 'FLASH SALE DEMO',
      description: 'Flash Sale demo — giá sốc trong 2 giờ!',
      startDate: fsStart,
      endDate: fsEnd,
      branchId,
      isActive: true,
      items: [
        ...(colaProduct ? [{ productId: colaProduct.id, flashSalePrice: 8000, maxQuantity: 50, soldQuantity: 12 }] : []),
        ...(snackProduct ? [{ productId: snackProduct.id, flashSalePrice: 45000, maxQuantity: 30, soldQuantity: 5 }] : []),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    log('FlashSale tạo: FLASH SALE DEMO (đang chạy 2 tiếng)');
  } else {
    warn('FlashSale DEMO đã có');
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // 11. COMPETITOR PRODUCTS — Dữ liệu đối thủ mẫu
  // ──────────────────────────────────────────────────────────────────────────────
  const competitors = [
    { name: 'Coca-Cola 330ml', sku: 'WM-COCA330', unit: 'lon', price: 13000, source: 'Winmart', sourceUrl: 'https://winmart.vn/coca-cola-330ml', scrapedAt: new Date() },
    { name: 'Nước suối Aquafina 500ml', sku: 'WM-AQUA500', unit: 'chai', price: 8000, source: 'Winmart', sourceUrl: 'https://winmart.vn/aquafina-500ml', scrapedAt: new Date() },
    { name: 'Bánh Oreo chocolate', sku: 'WM-OREO133', unit: 'hộp', price: 30000, source: 'Winmart', sourceUrl: 'https://winmart.vn/oreo-chocolate', scrapedAt: new Date() },
    { name: 'Dầu gội Clear Men 380ml', sku: 'WM-CLEAR380', unit: 'chai', price: 85000, source: 'Winmart', sourceUrl: 'https://winmart.vn/clear-men-380ml', scrapedAt: new Date() },
    { name: 'Nước mắm Phú Quốc 500ml', sku: 'WM-MAMM500', unit: 'chai', price: 45000, source: 'Winmart', sourceUrl: 'https://winmart.vn/nuoc-mam-phu-quoc', scrapedAt: new Date() },
    { name: 'Trứng gà ta 10 quả', sku: 'WM-TRUNG10', unit: 'khay', price: 46000, source: 'Winmart', sourceUrl: 'https://winmart.vn/trung-ga-ta', scrapedAt: new Date() },
    { name: 'Sữa tắm Dove 530ml', sku: 'WM-DOVE530', unit: 'chai', price: 98000, source: 'Winmart', sourceUrl: 'https://winmart.vn/sua-tam-dove-530ml', scrapedAt: new Date() },
    { name: 'Snack Pringles 165g', sku: 'WM-PRING165', unit: 'lon', price: 69000, source: 'Winmart', sourceUrl: 'https://winmart.vn/pringles-165g', scrapedAt: new Date() },
  ];

  for (const c of competitors) {
    const normalizedName = normalizeString(c.name);
    const normalizedUnit = normalizeString(c.unit);
    const exists = await db.collection('competitorproducts').findOne({ name: c.name, source: c.source });
    if (!exists) {
      await db.collection('competitorproducts').insertOne({
        ...c,
        normalizedName,
        normalizedUnit,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      log(`CompetitorProduct tạo: ${c.name} = ${c.price}đ (${c.source})`);
    } else {
      await db.collection('competitorproducts').updateOne(
        { _id: exists._id },
        { $set: { normalizedName, normalizedUnit, price: c.price, source: c.source } }
      );
      warn(`CompetitorProduct đã có: ${c.name} (cập nhật thông tin)`);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────────
  // TỔNG KẾT
  // ──────────────────────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅  SEED DEMO HOÀN THÀNH!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 TÀI KHOẢN DEMO:');
  console.log('  👑 Admin        : admin@demo.com    / Demo@123');
  console.log('  🏪 Branch Mgr   : manager@demo.com  / Demo@123');
  console.log('  👷 Staff        : staff@demo.com    / Demo@123');
  console.log('  👤 Customer     : customer@demo.com / Demo@123  [Hạng Đồng, 150 điểm]');
  console.log('\n🎫 MÃ VOUCHER DEMO:');
  console.log('  KHAI20A, KHAI20B, KHAI20C — Giảm 20% (miễn phí)');
  console.log('  DEMO2025, PMAN20OFF        — Giảm 20% (miễn phí)');
  console.log('  DIEM30K                    — Giảm 30k (cần 100 điểm)');
  console.log('\n⚙️  SETTINGS:');
  console.log('  Phí ship: 25.000đ | Miễn phí từ: 300.000đ | VAT: 10%');
  console.log('  Đơn tối thiểu: 50.000đ');
  console.log('\n⚡ FLASH SALE: Đang chạy trong 2 giờ (Coca-Cola, Pringles)');
  console.log('═══════════════════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed thất bại:', err.message);
  process.exit(1);
});
