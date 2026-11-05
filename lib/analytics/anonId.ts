const ANONYMOUS_ID_KEY = "local-eye:anonymous-id";

export function getAnonymousId(): string {
  const storedId = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (
    storedId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      storedId,
    )
  ) {
    return storedId;
  }

  const anonymousId = window.crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, anonymousId);
  return anonymousId;
}
