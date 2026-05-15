'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [shouldAnimate, setShouldAnimate] = useState(true);
  useEffect(() => {
    setShouldAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    console.error('CRITICAL_SYSTEM_ERROR:', error);
  }, [error]);

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.4, ease: "easeInOut" as const }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 space-y-6">
      <motion.div 
        variants={shouldAnimate ? shakeVariants : {}}
        animate="shake"
        className="relative group"
      >
        <div className="absolute -inset-1 bg-red-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative p-4 bg-black/40 border border-red-500/50 rounded-full backdrop-blur-xl">
          <AlertCircle className="w-12 h-12 text-red-500 animate-pulse" />
        </div>
      </motion.div>
...

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-mono text-red-500 tracking-tighter uppercase tracking-widest">
          {">"} UPLINK_FAILED
        </h2>
        <p className="text-red-400/70 font-mono text-sm max-w-md">
          A critical failure has occurred in the neural network bridge. 
          Data transmission interrupted. Error code: {error.digest || '0xDEADC0DE'}
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="flex items-center space-x-2 px-6 py-2 bg-red-500/10 border border-red-500/50 text-red-500 font-mono hover:bg-red-500 hover:text-black transition-all duration-300 group shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      >
        <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
        <span>RE-ESTABLISH LINK</span>
      </button>
      
      <div className="mt-8 font-mono text-[10px] text-red-900/40 uppercase tracking-[0.2em]">
        System monitoring enabled. All errors logged to central core.
      </div>
    </div>
  );
}
