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

export function GoogleIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 43 44" aria-hidden>
      <path
        fill="#FBBC05"
        d="M2.25253805,12.2519409 L9.65186195,17.9102474 C9.228777,19.1952969 9,20.5700374 9,22 C9,23.4299626 9.228777,24.8047031 9.65186195,26.0897526 L2.25253805,31.7480591 C0.809393905,28.8140208 0,25.5061199 0,22 C0,18.4938801 0.809393905,15.1859792 2.25253805,12.2519409 Z"
      />
      <path
        fill="#EA4335"
        d="M9.65186195,17.9102474 L2.25253805,12.2519409 C5.83100163,4.97661119 13.3061199,0 22,0 C27.6,0 32.6,2.1 36.5,5.5 L30.1,11.9 C27.9,10.1 25.1,9 22,9 C16.2299626,9 11.3590507,12.7249484 9.65186195,17.9102474 Z"
      />
      <path
        fill="#34A853"
        d="M2.24956066,31.7420035 L9.64586796,26.0715012 C11.3476258,31.2663086 16.223195,35 22,35 C28.1,35 32.7,31.9 33.8,26.5 L22,26.5 L22,18 L42.5,18 C42.8,19.3 43,20.7 43,22 C43,36 33,44 22,44 C13.3037079,44 5.82685413,39.0206271 2.24956066,31.7420035 Z"
      />
      <path
        fill="#4285F4"
        d="M36.3394527,38.5208666 L29.3149064,33.0825082 C31.6117078,31.6329963 33.209743,29.3976252 33.8,26.5 L22,26.5 L22,18 L42.5,18 C42.8,19.3 43,20.7 43,22 C43,29.170479 40.3767465,34.7670059 36.3394527,38.5208666 Z"
      />
    </svg>
  );
}

export function LineIcon({ className = base }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#06C755" aria-hidden>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}
