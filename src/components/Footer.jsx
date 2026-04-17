import React from 'react'

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#05060A] border-t border-white/5 py-8 mt-12 relative z-10">
      <div className="max-w-7xl mx-auto px-5 lg:px-28 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <p className="font-mono text-xs text-text-muted">
          &copy; {currentYear} Krishna Raju S. All rights reserved.
        </p>

        <div className="flex items-center gap-2 font-mono text-[10px] text-text-muted uppercase tracking-widest">
           Engineered with <span className="text-color-primary">precision</span>
        </div>

      </div>
    </footer>
  )
}
