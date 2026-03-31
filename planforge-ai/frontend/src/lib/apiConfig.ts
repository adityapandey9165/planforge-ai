export function getApiHeaders(token: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token ?? ""}`,
  };

  const userGroqKey = localStorage.getItem("planforge_groq_key");
  if (userGroqKey) {
    headers["x-groq-key"] = userGroqKey;
  }

  return headers;
}