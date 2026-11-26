import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../services/api';

// Hook quản lý state danh sách phân trang từ API: { data, items, total, loading, error, page, setPage, reload }.
export function useList(fetcher, deps = [], options = {}) {
  const { initialPage = 1, pageSize = 10, enabled = true } = options;

  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const reload = useCallback(() => {
    setReloadTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError('');

    Promise.resolve(fetcher({ page, pageSize }))
      .then((res) => {
        if (!active) return;
        setData(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Không tải được dữ liệu danh sách.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, page, pageSize, reloadTick, ...deps]);

  return {
    data,
    items: Array.isArray(data?.items) ? data.items : [],
    total: typeof data?.total === 'number' ? data.total : 0,
    loading,
    error,
    page,
    setPage,
    reload,
  };
}
