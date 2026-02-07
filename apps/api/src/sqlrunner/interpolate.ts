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
    return String(vars[key]);
  });
}
