import { useState, useCallback, useEffect } from 'react';
import { getAdminOrderById, updateOrderStatus, cancelOrder, confirmCodPayment } from '../api/order.api';
import { useToast } from '../context/ToastContext';

const VALID_TRANSITIONS = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED:    ['DELIVERED'],
  DELIVERED:  [],
  CANCELLED:  [],
};

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];

const STATUS_LABELS = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

export function useOrderDetail(orderId) {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(!!orderId);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { addToast } = useToast();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminOrderById(orderId);
      setOrder(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat detail pesanan');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleUpdateStatus = useCallback(async (newStatus) => {
    setActionLoading('updateStatus');
    try {
      await updateOrderStatus(orderId, newStatus);
      addToast(`Status berhasil diubah ke ${STATUS_LABELS[newStatus] || newStatus}`);
      await fetchOrder();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal mengubah status';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  }, [orderId, fetchOrder, addToast]);

  const handleCancel = useCallback(async () => {
    setActionLoading('cancel');
    try {
      await cancelOrder(orderId);
      addToast('Pesanan berhasil dibatalkan');
      await fetchOrder();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal membatalkan pesanan';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  }, [orderId, fetchOrder, addToast]);

  const handleConfirmCod = useCallback(async () => {
    setActionLoading('confirmCod');
    try {
      await confirmCodPayment(orderId);
      addToast('Pembayaran COD berhasil dikonfirmasi');
      await fetchOrder();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal mengonfirmasi pembayaran';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setActionLoading(null);
    }
  }, [orderId, fetchOrder, addToast]);

  const getValidNextStatuses = useCallback(() => {
    if (!order) return [];
    return VALID_TRANSITIONS[order.status] || [];
  }, [order]);

  const canCancel = useCallback(() => {
    return order && CANCELLABLE_STATUSES.includes(order.status);
  }, [order]);

  const canConfirmCod = useCallback(() => {
    return order && order.paymentType === 'COD' && order.paymentStatus === 'UNPAID';
  }, [order]);

  return {
    order,
    isLoading,
    error,
    actionLoading,
    refetch: fetchOrder,
    handleUpdateStatus,
    handleCancel,
    handleConfirmCod,
    getValidNextStatuses,
    canCancel,
    canConfirmCod,
  };
}
