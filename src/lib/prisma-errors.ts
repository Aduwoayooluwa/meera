export function isDatabaseUnavailableError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P1001"
  );
}
