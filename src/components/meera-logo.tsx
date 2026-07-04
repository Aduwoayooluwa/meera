export function MeeraLogo({
  className = "",
  size = 34,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        className="mm-logo-bg"
        height="44"
        rx="12"
        width="44"
        x="2"
        y="2"
      />
      <path
        className="mm-logo-pane"
        d="M15 14.5C15 13.12 16.12 12 17.5 12H21V36H17.5C16.12 36 15 34.88 15 33.5V14.5Z"
      />
      <path
        className="mm-logo-pane"
        d="M27 12H30.5C31.88 12 33 13.12 33 14.5V33.5C33 34.88 31.88 36 30.5 36H27V12Z"
      />
      <path
        className="mm-logo-line"
        d="M15 33.4L21 23.2L24 29.2L27 23.2L33 33.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="mm-logo-line"
        d="M21 14.6L24 20.8L27 14.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="mm-logo-spark" cx="24" cy="24" r="2.35" />
    </svg>
  );
}
