import React from 'react';

interface AlertProps {
  variant?: 'destructive' | 'success' | 'warning';
  className?: string;
  children?: React.ReactNode;
}

const Alert: React.FC<AlertProps> = ({ children, variant, className }) => {
  const classes = [
    'rounded',
    'p-4',
    'text-sm',
    variant === 'destructive' ? 'bg-red-100 border border-red-400 text-red-700' : '',
    variant === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : '',
    variant === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div role="alert" className={classes}>
      {children}
    </div>
  );
};

interface AlertDescriptionProps {
  children: React.ReactNode;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => {
  return <div>{children}</div>;
};

export { Alert, AlertDescription };