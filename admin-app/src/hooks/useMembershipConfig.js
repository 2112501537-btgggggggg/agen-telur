import { useState, useCallback, useEffect } from 'react';
import { getMembershipConfig, updateMembershipConfig } from '../api/membershipConfig.api';
import { useToast } from '../context/ToastContext';

export function useMembershipConfig() {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMembershipConfig();
      setConfig(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Gagal memuat konfigurasi membership');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleUpdate = useCallback(async (data) => {
    setIsSubmitting(true);
    try {
      await updateMembershipConfig(data);
      addToast('Konfigurasi membership berhasil diperbarui');
      await fetchConfig();
      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || 'Gagal memperbarui konfigurasi';
      addToast(msg, 'error');
      return { success: false, message: msg };
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchConfig, addToast]);

  return {
    config,
    isLoading,
    isSubmitting,
    error,
    handleUpdate,
  };
}
