import { useEffect, useState } from 'react';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const checkIsDesktop = () => {
      // Desktop if window width >= 1024px (lg breakpoint in Tailwind)
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Check on mount
    checkIsDesktop();

    // Listen for window resize
    const handleResize = () => checkIsDesktop();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Return false until mounted to avoid hydration mismatch
  return hasMounted ? isDesktop : false;
}
