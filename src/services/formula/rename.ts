const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Remplace la référence `{from}` par `{to}` (les formules référencent les champs par nom). */
export function renameRef(source: string, from: string, to: string): string {
  return source.replace(new RegExp(`\\{\\s*${escapeRegExp(from.trim())}\\s*\\}`, 'g'), `{${to.trim()}}`);
}
