import { statusLabel, statusVariant } from '../utils/format';

export default function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${statusVariant(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
