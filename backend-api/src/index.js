const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const { publicRouter: categoryPublicRoutes, adminRouter: categoryAdminRoutes } = require('./routes/category.routes');
const addressRoutes = require('./routes/address.routes');
const { publicRouter: productPublicRoutes, adminRouter: productAdminRoutes } = require('./routes/product.routes');
const { publicRouter: serviceAreaPublicRoutes, adminRouter: serviceAreaAdminRoutes } = require('./routes/serviceArea.routes');
const membershipConfigRoutes = require('./routes/membershipConfig.routes');
const priceRoutes = require('./routes/price.routes');
const supplierRoutes = require('./routes/supplier.routes');
const stockInRoutes = require('./routes/stockIn.routes');
const orderRoutes = require('./routes/order.routes');
const unitConversionRoutes = require('./routes/unitConversion.routes');
const paymentRoutes = require('./routes/payment.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reviewRoutes = require('./routes/review.routes');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryPublicRoutes);
app.use('/api/admin/categories', categoryAdminRoutes);
app.use('/api/users/me/addresses', addressRoutes);
app.use('/api/products', productPublicRoutes);
app.use('/api/admin/products', productAdminRoutes);
app.use('/api/admin/products', priceRoutes);
app.use('/api/admin/suppliers', supplierRoutes);
app.use('/api/admin/stock-in', stockInRoutes);
app.use('/api/service-areas', serviceAreaPublicRoutes);
app.use('/api/admin/service-areas', serviceAreaAdminRoutes);
app.use('/api/admin/membership-config', membershipConfigRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/unit-conversions', unitConversionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', dashboardRoutes);
app.use('/api', reviewRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

