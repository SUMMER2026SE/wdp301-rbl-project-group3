# Đề xuất điều chỉnh Logic Backend (Order Service)
Tài liệu này tổng hợp các thay đổi cần thiết ở Backend (`BE/src/modules/order/order.service.ts`) để hỗ trợ việc thay đổi trạng thái linh hoạt (bao gồm cả đi lùi và hủy đơn hàng) mà vẫn đảm bảo tính chính xác của tồn kho (inventory).

---

## 1. Cho phép chuyển đổi trạng thái hai chiều (Bi-directional Transitions)

Hiện tại, ma trận trạng thái đơn hàng khóa cứng theo chiều tiến. Để hỗ trợ sửa sai khi bấm nhầm hoặc thiếu hàng, đề xuất mở rộng `allowedTransitions` như sau:

### Mã nguồn hiện tại (Forward-only):
```typescript
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivering', 'cancelled'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};
```

### Đề xuất cập nhật (Cho phép đi lùi giữa các bước đang xử lý):
```typescript
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['pending', 'preparing', 'cancelled'],
  preparing: ['confirmed', 'delivering', 'cancelled'],
  delivering: ['preparing', 'delivered', 'cancelled'],
  delivered: [], 
  cancelled: [], 
}
```

---

## 2. Đồng bộ hóa việc tăng/giảm tồn kho khi đổi trạng thái (Stock Management)

Khi cho phép đi lùi trạng thái đơn hàng, logic trừ/hoàn kho cần được nâng cấp để tránh:
1. **Trừ trùng lặp** số lượng sản phẩm khi chuyển đổi qua lại giữa các bước trung gian (`confirmed` $\leftrightarrow$ `preparing` $\leftrightarrow$ `delivering`).
2. **Thất thoát kho** khi chuyển lùi đơn hàng về lại trạng thái chưa duyệt (`pending`) hoặc khi hủy đơn (`cancelled`).

### Giải pháp xử lý:
*   Định nghĩa nhóm trạng thái đã trừ kho (gọi là **Processing States**): `['confirmed', 'preparing', 'delivering']`.
*   **Khi đi tiến** (từ `pending` sang bất kỳ Processing State nào): Thực hiện **trừ kho** (giảm số lượng sản phẩm trong kho).
*   **Khi đi lùi hoặc hủy** (từ bất kỳ Processing State nào về `pending` hoặc `cancelled`): Thực hiện **hoàn kho** (tăng lại số lượng sản phẩm trong kho).

### Chi tiết code đề xuất thay đổi trong hàm `updateStatus`:

```diff
  async updateStatus(id: string, status: OrderStatus, staffId: string): Promise<IOrder> {
    const order = await this.getOrderById(id);
    const nextStatuses = allowedTransitions[order.status];

    if (!nextStatuses.includes(status)) {
      throw new AppError(`Cannot change order status from ${order.status} to ${status}`, 400);
    }

    const update: {
      status: OrderStatus;
      confirmedBy?: string;
      confirmedAt?: Date;
    } = { status };

    let stockDecreased = false;
    let stockIncreased = false;

-   if (status === 'confirmed') {
-     await this.ensureStockAvailable(order);
-     await this.decreaseOrderStock(order, staffId);
-     stockDecreased = true;
-     update.confirmedBy = staffId;
-     update.confirmedAt = new Date();
-   }
-
-   if (status === 'cancelled' && ['confirmed', 'preparing'].includes(order.status)) {
-     await this.increaseOrderStock(order, staffId);
-     stockIncreased = true;
-   }

+   const isProcessingState = (s: OrderStatus) => ['confirmed', 'preparing', 'delivering'].includes(s);
+
+   // 1. Khi đi TIẾN từ pending sang trạng thái đang xử lý -> Trừ kho
+   if (order.status === 'pending' && isProcessingState(status)) {
+     await this.ensureStockAvailable(order);
+     await this.decreaseOrderStock(order, staffId);
+     stockDecreased = true;
+     if (status === 'confirmed') {
+       update.confirmedBy = staffId;
+       update.confirmedAt = new Date();
+     }
+   }
+
+   // 2. Khi đi LÙI từ trạng thái đang xử lý về pending hoặc cancelled -> Hoàn kho
+   if (isProcessingState(order.status) && (status === 'pending' || status === 'cancelled')) {
+     await this.increaseOrderStock(order, staffId);
+     stockIncreased = true;
+   }

    let updated: IOrder | null;
    try {
      updated = await orderRepository.updateStatusIfCurrent(id, order.status, update);
    } catch (error) {
      await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
      throw error;
    }

    if (!updated) {
      await this.rollbackStockChange(order, staffId, stockDecreased, stockIncreased);
      throw new AppError('Order status changed by another request. Please reload and try again.', 409);
    }
    return updated;
  }
```
