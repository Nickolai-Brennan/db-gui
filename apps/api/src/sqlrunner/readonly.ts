// SQL validator to block write operations and ensure read-only queries

export function validateReadOnly(sql: string): void {
  const upper = sql.toUpperCase().trim();
  
  const forbidden = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'TRUNCATE', 'GRANT', 'REVOKE', 'EXECUTE'
  ];
  
  for (const keyword of forbidden) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      throw new Error(`SQL contains forbidden keyword: ${keyword}`);
    }
  }
  
  // Allow only SELECT, WITH (CTEs), EXPLAIN
  if (!(/^\s*(SELECT|WITH|EXPLAIN)/i.test(sql))) {
    throw new Error('Only SELECT queries allowed');
  }
}
