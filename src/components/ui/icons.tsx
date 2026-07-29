import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Star,
  User,
} from "lucide-react";

type IconProps = { className?: string };

const base = "h-5 w-5";

export function SearchIcon({ className = base }: IconProps) {
  return <Search className={className} strokeWidth={1.6} aria-hidden />;
}

export function CartIcon({ className = base }: IconProps) {
  return <ShoppingCart className={className} strokeWidth={1.6} aria-hidden />;
}

export function MenuIcon({ className = base }: IconProps) {
  return <Menu className={className} strokeWidth={1.6} aria-hidden />;
}

export function ProfileIcon({ className = base }: IconProps) {
  return <User className={className} strokeWidth={1.6} aria-hidden />;
}

export function CloseIcon({ className = base }: IconProps) {
  return <X className={className} strokeWidth={1.6} aria-hidden />;
}

export function ChevronLeftIcon({ className = base }: IconProps) {
  return <ChevronLeft className={className} strokeWidth={1.6} aria-hidden />;
}

export function ChevronRightIcon({ className = base }: IconProps) {
  return <ChevronRight className={className} strokeWidth={1.6} aria-hidden />;
}

export function ChevronDownIcon({ className = base }: IconProps) {
  return <ChevronDown className={className} strokeWidth={1.6} aria-hidden />;
}

export function StarIcon({ className = base }: IconProps) {
  return <Star className={className} fill="currentColor" strokeWidth={0} aria-hidden />;
}

export function InstagramIcon({ className = base }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
