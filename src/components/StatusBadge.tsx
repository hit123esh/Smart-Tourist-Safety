import { cn } from '@/lib/utils';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

type Status = 'safe' | 'observation' | 'alert';

interface StatusBadgeProps {
  status: Status;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  safe: {
    label: 'Safe',
    icon: CheckCircle,
    className: 'status-safe',
  },
  observation: {
    label: 'Under Observation',
    icon: AlertCircle,
    className: 'status-observation',
  },
  alert: {
    label: 'Alert',
    icon: AlertTriangle,
    className: 'status-alert',
  },
};

const sizeConfig = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
};

const StatusBadge = ({ status, showIcon = true, size = 'md' }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        config.className,
        sizeConfig[size]
      )}
    >
      {showIcon && <Icon size={iconSizes[size]} />}
      {config.label}
    </span>
  );
};

export default StatusBadge;
