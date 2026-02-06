export function fkAction(code: string): string {
  switch (code) {
    case 'a': return 'NO ACTION';
    case 'r': return 'RESTRICT';
    case 'c': return 'CASCADE';
    case 'n': return 'SET NULL';
    case 'd': return 'SET DEFAULT';
    default: return code;
  }
}
