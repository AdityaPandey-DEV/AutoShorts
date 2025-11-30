// Type conversion functions for automatic and explicit type transformations
import { PinType } from '@/src/types/flowchart';

export interface ConversionResult {
  success: boolean;
  value: any;
  error?: string;
}

// Type conversion functions
const converters: Record<string, Record<string, (value: any) => any>> = {
  number: {
    string: (n: number) => String(n),
    boolean: (n: number) => n !== 0,
    any: (n: number) => n,
  },
  boolean: {
    string: (b: boolean) => String(b),
    number: (b: boolean) => b ? 1 : 0,
    any: (b: boolean) => b,
  },
  string: {
    number: (s: string) => {
      const num = parseFloat(s);
      if (isNaN(num)) throw new Error(`Cannot convert "${s}" to number`);
      return num;
    },
    boolean: (s: string) => s.length > 0 && s.toLowerCase() !== 'false' && s !== '0',
    url: (s: string) => {
      try {
        return new URL(s).href;
      } catch {
        throw new Error(`Invalid URL: ${s}`);
      }
    },
    date: (s: string) => {
      const date = new Date(s);
      if (isNaN(date.getTime())) throw new Error(`Invalid date: ${s}`);
      return date;
    },
    filepath: (s: string) => s,
    json: (s: string) => {
      try {
        return JSON.parse(s);
      } catch {
        throw new Error(`Invalid JSON: ${s}`);
      }
    },
    any: (s: string) => s,
  },
  object: {
    json: (o: object) => JSON.stringify(o),
    string: (o: object) => JSON.stringify(o),
    array: (o: object) => Object.values(o),
    any: (o: object) => o,
  },
  array: {
    string: (a: any[]) => a.join(', '),
    json: (a: any[]) => JSON.stringify(a),
    object: (a: any[]) => {
      // Convert array to object with index keys
      return a.reduce((obj, item, index) => {
        obj[index] = item;
        return obj;
      }, {} as Record<string, any>);
    },
    any: (a: any[]) => a,
  },
  json: {
    object: (j: string) => {
      try {
        const parsed = JSON.parse(j);
        return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
      } catch {
        throw new Error(`Invalid JSON object: ${j}`);
      }
    },
    array: (j: string) => {
      try {
        const parsed = JSON.parse(j);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        throw new Error(`Invalid JSON array: ${j}`);
      }
    },
    string: (j: string) => j,
    any: (j: string) => {
      try {
        return JSON.parse(j);
      } catch {
        return j;
      }
    },
  },
  url: {
    string: (u: string) => u,
    filepath: (u: string) => {
      try {
        const url = new URL(u);
        return url.pathname;
      } catch {
        return u;
      }
    },
    any: (u: string) => u,
  },
  date: {
    string: (d: Date) => d.toISOString(),
    number: (d: Date) => d.getTime(),
    any: (d: Date) => d,
  },
  filepath: {
    string: (f: string) => f,
    url: (f: string) => {
      // Convert filepath to file:// URL
      if (f.startsWith('http://') || f.startsWith('https://')) {
        return f;
      }
      return `file://${f}`;
    },
    any: (f: string) => f,
  },
};

/**
 * Convert a value from one type to another
 */
export function convertValue(value: any, fromType: PinType, toType: PinType): ConversionResult {
  // No conversion needed if types match
  if (fromType === toType) {
    return {
      success: true,
      value,
    };
  }
  
  // Handle 'any' type - pass through
  if (toType === 'any' || fromType === 'any') {
    return {
      success: true,
      value,
    };
  }
  
  // Check if conversion exists
  const fromConverters = converters[fromType];
  if (!fromConverters) {
    return {
      success: false,
      value,
      error: `No converter available from "${fromType}" to "${toType}"`,
    };
  }
  
  const converter = fromConverters[toType];
  if (!converter) {
    return {
      success: false,
      value,
      error: `Cannot convert from "${fromType}" to "${toType}"`,
    };
  }
  
  try {
    const converted = converter(value);
    return {
      success: true,
      value: converted,
    };
  } catch (error) {
    return {
      success: false,
      value,
      error: error instanceof Error ? error.message : 'Conversion failed',
    };
  }
}

/**
 * Check if conversion is available between two types
 */
export function hasConverter(fromType: PinType, toType: PinType): boolean {
  if (fromType === toType || toType === 'any' || fromType === 'any') {
    return true;
  }
  
  const fromConverters = converters[fromType];
  return !!fromConverters?.[toType];
}

/**
 * Get all available target types for conversion from a source type
 */
export function getConvertibleTypes(fromType: PinType): PinType[] {
  const fromConverters = converters[fromType];
  if (!fromConverters) {
    return ['any'];
  }
  
  return Object.keys(fromConverters) as PinType[];
}

