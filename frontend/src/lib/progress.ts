const PREFIX = "progress:";

export function isCompleted(gameId: string): boolean {
  return localStorage.getItem(PREFIX + gameId) === "1";
}

export function markCompleted(gameId: string) {
  localStorage.setItem(PREFIX + gameId, "1");
}

export function resetAll() {
  const toDel: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!;
    if (k.startsWith(PREFIX)) toDel.push(k);
  }
  toDel.forEach(k => localStorage.removeItem(k));
}