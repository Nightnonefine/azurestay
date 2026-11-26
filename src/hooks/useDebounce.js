import { useEffect, useState } from 'react';

// Trì hoãn cập nhật giá trị khi người dùng đang gõ để tránh gọi API liên tục.
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
