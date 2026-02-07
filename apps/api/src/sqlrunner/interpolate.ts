// SQL template interpolation with safe placeholders

export type TemplateVars = {
  schemas?: string[];
  schema?: string;
  table?: string;
  column?: string;
  threshold?: Record<string, any>;
  [key: string]: any;
};

export function interpolateSql(template: string, vars: TemplateVars): string {
  const allowedPlaceholders = ['schemas', 'schema', 'table', 'column', 'threshold'];
  
  // Find all {{...}} placeholders
  const placeholders = template.match(/\{\{([^}]+)\}\}/g) || [];
  
  let result = template;
  for (const placeholder of placeholders) {
    const key = placeholder.slice(2, -2).trim();
    const [rootKey, ...path] = key.split('.');
    
    if (!allowedPlaceholders.includes(rootKey)) {
      throw new Error(`Invalid placeholder: ${key}. Allowed: ${allowedPlaceholders.join(', ')}`);
    }
    
    let value = vars[rootKey];
    
    // Navigate nested paths (e.g., threshold.minRows)
    for (const p of path) {
      value = value?.[p];
    }
    
    if (value === undefined || value === null) {
      throw new Error(`Missing value for placeholder: ${key}`);
    }
    
    // Handle arrays (e.g., schemas)
    if (Array.isArray(value)) {
      const quoted = value.map(v => `'${escapeSqlString(v)}'`).join(',');
      result = result.replace(placeholder, quoted);
    } else {
      result = result.replace(placeholder, escapeSqlString(String(value)));
    }
  }
  
  return result;
}

function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
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
    // Note: PostgreSQL identifiers cannot contain hyphens without quoting
    if (!/^[a-zA-Z0-9_.]+$/.test(value)) {
      throw new Error(`Invalid characters in variable ${key}: ${value}`);
    }
    
    return value;
  });
}
