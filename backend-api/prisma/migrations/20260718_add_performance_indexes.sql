-- Add indexes for performance optimization
-- Issue #39: Performance Optimization

-- Order indexes (frequently filtered/sorted)
CREATE INDEX idx_order_userId ON `Order`(userId);
CREATE INDEX idx_order_status ON `Order`(status);
CREATE INDEX idx_order_paymentStatus ON `Order`(paymentStatus);
CREATE INDEX idx_order_createdAt ON `Order`(createdAt DESC);
CREATE INDEX idx_order_userId_status ON `Order`(userId, status);

-- Address indexes
CREATE INDEX idx_address_userId ON `Address`(userId);

-- ProductVariant indexes
CREATE INDEX idx_productVariant_productId ON `ProductVariant`(productId);
CREATE INDEX idx_productVariant_stockKg ON `ProductVariant`(stockKg);

-- Product indexes
CREATE INDEX idx_product_categoryId ON `Product`(categoryId);
CREATE INDEX idx_product_isActive ON `Product`(isActive);
CREATE INDEX idx_product_categoryId_isActive ON `Product`(categoryId, isActive);

-- OrderItem indexes
CREATE INDEX idx_orderItem_orderId ON `OrderItem`(orderId);
CREATE INDEX idx_orderItem_productVariantId ON `OrderItem`(productVariantId);

-- StockIn indexes
CREATE INDEX idx_stockIn_productVariantId ON `StockIn`(productVariantId);
CREATE INDEX idx_stockIn_supplierId ON `StockIn`(supplierId);
CREATE INDEX idx_stockIn_createdAt ON `StockIn`(createdAt DESC);

-- StockAdjustment indexes
CREATE INDEX idx_stockAdjustment_productVariantId ON `StockAdjustment`(productVariantId);
CREATE INDEX idx_stockAdjustment_createdAt ON `StockAdjustment`(createdAt DESC);

-- PriceHistory indexes
CREATE INDEX idx_priceHistory_productVariantId ON `PriceHistory`(productVariantId);
CREATE INDEX idx_priceHistory_changedAt ON `PriceHistory`(changedAt DESC);

-- ServiceArea indexes (for faster lookup during checkout)
CREATE INDEX idx_serviceArea_city ON `ServiceArea`(city);
CREATE INDEX idx_serviceArea_isActive ON `ServiceArea`(isActive);
CREATE INDEX idx_serviceArea_city_kecamatan ON `ServiceArea`(city, kecamatan);
