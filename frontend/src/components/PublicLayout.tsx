import { Link, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/useAuth";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signInWithGoogle, loading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="gradient-text">ResumeAI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              className="gradient-primary border-0"
              onClick={signInWithGoogle}
              disabled={loading}
            >
              Sign In
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-background p-4 space-y-4 animate-fade-in">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="block text-sm font-medium text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="flex pt-2">
              <Button
                className="flex-1 gradient-primary border-0"
                onClick={() => {
                  setMobileOpen(false);
                  signInWithGoogle();
                }}
                disabled={loading}
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-lg mb-3"
            >
              <Sparkles className="h-5 w-5 text-primary" />
              <span>ResumeAI</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              AI-powered resume analysis and hiring assistant for modern job
              seekers.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link
                to="/features"
                className="block hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="block hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Company</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="block">About</span>
              <span className="block">Blog</span>
              <span className="block">Careers</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="block">Privacy</span>
              <span className="block">Terms</span>
            </div>
          </div>
        </div>
        <div className="container pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ResumeAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
