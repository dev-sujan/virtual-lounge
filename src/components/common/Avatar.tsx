import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  color,
  size = 'md',
  isOnline,
  className = '',
}) => {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5 border-[1.5px]',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3 h-3 border-2',
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
      aria-label={name}
      title={name}
    >
      {getInitials(name)}
      
      {isOnline !== undefined && (
        <span 
          className={`absolute bottom-0 right-0 rounded-full border-[#12131a] ${isOnline ? 'bg-green-500' : 'bg-gray-500'} ${dotSizeClasses[size]}`}
          aria-label={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
