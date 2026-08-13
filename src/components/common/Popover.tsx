import React, { useEffect, useRef } from 'react';

interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Popover: React.FC<PopoverProps> = ({
  isOpen,
  onClose,
  trigger,
  children,
  position = 'bottom',
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'sm:bottom-full sm:mb-2 sm:top-auto sm:right-0';
      case 'bottom':
        return 'sm:top-full sm:mt-2 sm:bottom-auto sm:right-0';
      case 'left':
        return 'sm:right-full sm:mr-2 sm:top-0';
      case 'right':
        return 'sm:left-full sm:ml-2 sm:top-0';
      default:
        return 'sm:top-full sm:mt-2 sm:bottom-auto sm:right-0';
    }
  };

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <div aria-expanded={isOpen} className="inline-block">
        {trigger}
      </div>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm cursor-pointer" 
            onClick={onClose} 
            aria-hidden="true"
          />
          <div 
            className={`fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto z-[70] bg-[#0a0d19] border border-white/20 rounded-2xl shadow-2xl shadow-black/95 overflow-hidden animate-fadeIn ${getPositionClasses()} ${className}`}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
};
