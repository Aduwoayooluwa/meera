import Image from "next/image";

export function MeeraLogo({
  className = "",
  priority = false,
  size = 34,
}: {
  className?: string;
  priority?: boolean;
  size?: number;
}) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={className}
      height={size}
      priority={priority}
      src="/logo.png"
      width={size}
    />
  );
}
