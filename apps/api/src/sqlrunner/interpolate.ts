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
}
