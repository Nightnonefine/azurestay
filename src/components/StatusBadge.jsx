import { statusLabel, statusVariant } from '../utils/format';

export default function StatusBadge({ status, label = '' }) {
  return (
    <span className={`status-badge ${statusVariant(status)}`}>
      {label || statusLabel(status)}
    </span>
  );
}
