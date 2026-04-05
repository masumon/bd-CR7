// SUMONIX "S" Logo — brand icon using letter S
const BDCR7Logo = ({ size = 100, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    width={size}
    height={size}
    className={className}
    aria-label="SUMONIX Logo"
  >
    <defs>
      <linearGradient id="sumonix-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0d5c4a" />
        <stop offset="100%" stopColor="#0f6c5a" />
      </linearGradient>
      <filter id="sumonix-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
    {/* Background */}
    <rect width="100" height="100" rx="22" fill="url(#sumonix-bg)" />
    {/* Gold accent dot */}
    <circle cx="78" cy="22" r="9" fill="#c97f3a" />
    {/* Bold "S" */}
    <text
      x="50"
      y="72"
      textAnchor="middle"
      fontFamily="'Arial Black', 'Helvetica Neue', Impact, sans-serif"
      fontSize="65"
      fontWeight="900"
      fill="white"
      filter="url(#sumonix-shadow)"
    >
      S
    </text>
  </svg>
);

export default BDCR7Logo;