"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, Sun, Moon, Monitor, LayoutDashboard, LogOut, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { scrollToId, handleHashNavigation, NAVBAR_HEIGHT } from "@/lib/scroll-utils";
import { useAuth } from "@/contexts/auth-context";

interface NavItem {
  label: string;
  href: string;
  sectionId?: string; // For scroll navigation
}

const navItems: NavItem[] = [
  { label: "Pricing", href: "/#pricing", sectionId: "pricing" },
  { label: "About Us", href: "/#about", sectionId: "about" },
  { label: "Contact", href: "/#contact", sectionId: "contact" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isLandingPage = pathname === "/";

  // Handle logout
  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    setIsMobileMenuOpen(false);
    router.push("/");
  };

  // Handle mount for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll state for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle initial hash navigation on landing page
  useEffect(() => {
    if (isLandingPage) {
      handleHashNavigation(NAVBAR_HEIGHT);
    }
  }, [isLandingPage]);

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (isLandingPage) {
        handleHashNavigation(NAVBAR_HEIGHT);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isLandingPage]);

  // Handle nav item click
  const handleNavClick = useCallback(
    (item: NavItem, e: React.MouseEvent) => {
      e.preventDefault();

      if (isLandingPage && item.sectionId) {
        // On landing page, scroll to section
        window.history.pushState(null, "", `#${item.sectionId}`);
        scrollToId(item.sectionId, NAVBAR_HEIGHT);
      } else {
        // On other pages, navigate to landing with hash
        router.push(item.href);
      }

      setIsMobileMenuOpen(false);
    },
    [isLandingPage, router]
  );

  // Handle logo click
  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLandingPage) {
        e.preventDefault();
        window.history.pushState(null, "", "/");
        scrollToId("top", NAVBAR_HEIGHT);
      }
      setIsMobileMenuOpen(false);
    },
    [isLandingPage]
  );

  // Theme icon
  const ThemeIcon = () => {
    if (!mounted) return <Monitor className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    if (theme === "light") return <Sun className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm"
      )}
      style={{ height: NAVBAR_HEIGHT }}
    >
      <nav
        className="container mx-auto px-4 h-full flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Left Side: Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-3 font-bold text-xl"
          aria-label="Argus - Go to homepage"
        >
          <Image
            src="/logo.webp"
            alt="Argus Logo"
            width={160}
            height={44}
            className="h-11 w-auto"
            priority
          />
          <span className="text-2xl font-bold text-foreground">Argus</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* Pricing Link */}
          <a
            href="/#pricing"
            onClick={(e) => handleNavClick({ label: "Pricing", href: "/#pricing", sectionId: "pricing" }, e)}
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
          >
            Pricing
          </a>

          {/* Theme Toggle (between Pricing and About Us) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/80 hover:text-foreground"
                aria-label="Toggle theme"
              >
                <ThemeIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* About Us Link */}
          <a
            href="/#about"
            onClick={(e) => handleNavClick({ label: "About Us", href: "/#about", sectionId: "about" }, e)}
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
          >
            About Us
          </a>

          {/* Contact Link */}
          <a
            href="/#contact"
            onClick={(e) => handleNavClick({ label: "Contact", href: "/#contact", sectionId: "contact" }, e)}
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md px-2 py-1"
          >
            Contact
          </a>

          {/* Conditional Auth Section */}
          <div className="flex items-center gap-2 ml-2">
            {isAuthenticated ? (
              <>
                {/* Anasayfa - Dashboard button for authenticated users */}
                <Button asChild size="sm" variant="default">
                  <Link href="/dashboard" className="flex items-center gap-1">
                    <LayoutDashboard className="h-4 w-4" />
                    Anasayfa
                  </Link>
                </Button>
                
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user && (
                      <>
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Sign In / Sign Up for unauthenticated users */}
                <Button asChild variant="ghost" size="sm" className="text-foreground/80 hover:text-foreground">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme Toggle for Mobile (visible outside menu) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground/80 hover:text-foreground"
                aria-label="Toggle theme"
              >
                <ThemeIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between pb-6 border-b border-border">
                  <Link
                    href="/"
                    onClick={handleLogoClick}
                    className="flex items-center gap-3 font-bold text-lg text-foreground"
                  >
                    <Image
                      src="/logo.webp"
                      alt="Argus Logo"
                      width={160}
                      height={44}
                      className="h-11 w-auto"
                    />
                    <span className="text-2xl font-bold text-foreground">Argus</span>
                  </Link>
                </div>

                {/* Mobile Menu Links - Ordered: Pricing, About Us, Contact */}
                <nav className="flex-1 py-6 space-y-2" aria-label="Mobile navigation">
                  <a
                    href="/#pricing"
                    onClick={(e) => handleNavClick({ label: "Pricing", href: "/#pricing", sectionId: "pricing" }, e)}
                    className="block px-4 py-3 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Pricing
                  </a>
                  <a
                    href="/#about"
                    onClick={(e) => handleNavClick({ label: "About Us", href: "/#about", sectionId: "about" }, e)}
                    className="block px-4 py-3 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    About Us
                  </a>
                  <a
                    href="/#contact"
                    onClick={(e) => handleNavClick({ label: "Contact", href: "/#contact", sectionId: "contact" }, e)}
                    className="block px-4 py-3 text-base font-medium text-foreground rounded-md hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Contact
                  </a>
                </nav>

                {/* Mobile Menu Footer - Conditional Auth */}
                <div className="pt-6 border-t border-border space-y-3">
                  {isAuthenticated ? (
                    <>
                      {/* User info */}
                      {user && (
                        <div className="px-4 py-2 text-sm">
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-muted-foreground">{user.email}</p>
                        </div>
                      )}
                      
                      {/* Anasayfa - Dashboard button */}
                      <SheetClose asChild>
                        <Button asChild className="w-full">
                          <Link href="/dashboard" className="flex items-center justify-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Anasayfa
                          </Link>
                        </Button>
                      </SheetClose>
                      
                      {/* Logout button */}
                      <SheetClose asChild>
                        <Button 
                          variant="outline" 
                          className="w-full text-destructive hover:text-destructive"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Çıkış Yap
                        </Button>
                      </SheetClose>
                    </>
                  ) : (
                    <>
                      {/* Sign In / Sign Up for unauthenticated */}
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/login">Sign In</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="w-full">
                          <Link href="/register">Sign Up</Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
