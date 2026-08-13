import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboardUtils';

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
  successMessage?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label,
  className = '',
  successMessage = 'Copied!',
}) => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (isCopied) {
      timeout = setTimeout(() => setIsCopied(false), 2000);
    }
    return () => clearTimeout(timeout);
  }, [isCopied]);

  const handleCopy = async () => {
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setIsCopied(true);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
      aria-label={isCopied ? successMessage : (label || 'Copy to clipboard')}
      title={isCopied ? successMessage : label}
    >
      {isCopied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-white/70" />
      )}
      {label && <span>{isCopied ? successMessage : label}</span>}
    </button>
  );
};
