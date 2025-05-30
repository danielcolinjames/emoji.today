import { ReactNode } from 'react';

interface PageLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function PageLayout({ title, subtitle, children, showBackButton, onBack }: PageLayoutProps) {
  return (
    <div className="flex flex-col items-center justify-start text-white bg-[#050505] pt-4 sm:pt-10 md:pt-12 lg:pt-16">
      {/* Main Content Area */}
      <main className="flex flex-col items-center justify-start w-full container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        {/* Back Button - absolutely positioned under navbar */}
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="absolute left-5 top-20 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors duration-200 z-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Top Text Block - only show if title is provided */}
        {title && (
          <div className="text-center w-full mb-2 md:mb-4 lg:mb-20 mt-12 md:mt-20 lg:mt-24 flex flex-col">
            <h1 className="text-4xl font-light tracking-tighter sm:text-5xl md:text-6xl lg:text-8xl leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-neutral-400 leading-tight font-light">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Page Content - full width when no title, constrained when title exists */}
        <div className={title ? "w-full max-w-2xl" : "w-full"}>
          {children}
        </div>
      </main>
    </div>
  );
} 