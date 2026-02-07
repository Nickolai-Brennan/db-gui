/**
 * SQL Template Interpolator
 * Safe variable substitution with whitelist-only placeholders
 */

export function interpolateTemplate(
  template: string,
  vars: Record<string, any>
): string {
  const allowed = ['schema', 'table', 'column', 'threshold_'];
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (!allowed.some(prefix => key.startsWith(prefix))) {
      throw new Error(`Unsafe placeholder: ${key}`);
    }
    if (!(key in vars)) {
      throw new Error(`Missing variable: ${key}`);
    }
    
    // Sanitize the value to prevent SQL injection
    const value = String(vars[key]);
    
    // Basic validation: only allow alphanumeric, underscore, and dot
    // This is safe for identifiers like schema.table
    if (!/^[a-zA-Z0-9_.\-]+$/.test(value)) {
      throw new Error(`Invalid characters in variable ${key}: ${value}`);
    }
    
    return value;
  });
}
