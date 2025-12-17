/**
 * Scroll Utilities
 * 
 * Helpers for smooth scrolling and hash navigation
 */

/**
 * Default navbar height in pixels (used for scroll offset)
 */
export const NAVBAR_HEIGHT = 64;

/**
 * Smoothly scroll to an element by ID with offset for fixed navbar
 * @param id - Element ID to scroll to (without #)
 * @param offsetPx - Additional offset in pixels (default: NAVBAR_HEIGHT)
 */
export function scrollToId(id: string, offsetPx: number = NAVBAR_HEIGHT): void {
  // Handle 'top' as special case
  if (id === 'top' || id === 'hero') {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
    return;
  }

  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with id "${id}" not found`);
    return;
  }

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offsetPx;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
}

/**
 * Handle initial hash on page load and hash changes
 * Should be called in useEffect on page mount
 */
export function handleHashNavigation(offsetPx: number = NAVBAR_HEIGHT): void {
  const hash = window.location.hash.slice(1); // Remove the #
  
  if (hash) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      scrollToId(hash, offsetPx);
    }, 100);
  }
}

/**
 * Create a click handler for navbar links that scrolls to sections
 * @param id - Section ID to scroll to
 * @param onComplete - Optional callback after scroll initiated
 */
export function createScrollHandler(
  id: string,
  onComplete?: () => void
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Update URL hash without triggering scroll
    window.history.pushState(null, '', `#${id}`);
    
    // Smooth scroll to section
    scrollToId(id);
    
    // Call completion callback (e.g., close mobile menu)
    onComplete?.();
  };
}

/**
 * Check if current path is the landing page
 */
export function isLandingPage(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/';
}

/**
 * Navigate to landing page with hash
 * Used when clicking navbar links from non-landing pages
 */
export function navigateToSection(id: string): string {
  return `/#${id}`;
}
