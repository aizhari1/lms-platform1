export function LampSignature() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
    >
      <svg
        width="120"
        height="160"
        viewBox="0 0 120 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hanging cord */}
        <line x1="60" y1="0" x2="60" y2="38" stroke="#1E293B" strokeWidth="2" />

        {/* Ambient glow — the signature flicker */}
        <circle
          cx="60"
          cy="72"
          r="46"
          fill="url(#lampGlowGradient)"
          className="animate-flicker origin-center"
        />

        {/* Lamp cap */}
        <path d="M48 38 H72 L66 48 H54 Z" fill="#1E293B" />

        {/* Lamp body (the "siraj" itself) */}
        <path
          d="M42 48 H78 C78 68 70 84 60 92 C50 84 42 68 42 48 Z"
          fill="#F5B84A"
          fillOpacity="0.15"
          stroke="#F5B84A"
          strokeWidth="1.5"
        />
        <path
          d="M50 54 H70 C70 66 65 76 60 82 C55 76 50 66 50 54 Z"
          fill="#F5B84A"
          className="animate-flicker"
        />

        <defs>
          <radialGradient id="lampGlowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5B84A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#F5B84A" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
