export function formatRelativeDay(value: string, prefix = "Added") {
  const then = new Date(value);

  if (Number.isNaN(then.getTime())) {
    return `${prefix} recently`;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDay = new Date(
    then.getFullYear(),
    then.getMonth(),
    then.getDate(),
  );
  const diffDays = Math.round(
    (today.getTime() - thatDay.getTime()) / 86_400_000,
  );

  if (diffDays <= 0) {
    return `${prefix} today`;
  }

  if (diffDays === 1) {
    return `${prefix} yesterday`;
  }

  if (diffDays < 7) {
    return `${prefix} ${diffDays} days ago`;
  }

  return `${prefix} ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(then)}`;
}
