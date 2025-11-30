// Type compatibility checking and validation
import { PinType } from '@/src/types/flowchart';

export interface ConnectionValidationResult {
  valid: boolean;
  requiresAdapter: boolean;
  canAutoConvert: boolean;
  errorMessage?: string;
  suggestedAdapter?: string;
}

// Type compatibility matrix - defines which types can connect
const TYPE_COMPATIBILITY: Record<string, PinType[]> = {
  // Execution pins can only connect to execution pins
  execution: ['execution'],
  
  // String can connect to many types (most flexible)
  string: ['string', 'json', 'url', 'date', 'filepath', 'any'],
  
  // Number can convert to string, boolean
  number: ['number', 'string', 'boolean', 'any'],
  
  // Boolean can convert to string, number
  boolean: ['boolean', 'string', 'number', 'any'],
  
  // Object can convert to JSON, string
  object: ['object', 'json', 'string', 'any'],
  
  // Array can convert to string, json, object
  array: ['array', 'string', 'json', 'object', 'any'],
  
  // Media types are strict - can only connect to same type
  image: ['image', 'any'],
  video: ['video', 'any'],
  audio: ['audio', 'any'],
  
  // Structured types
  json: ['json', 'string', 'object', 'array', 'any'],
  url: ['url', 'string', 'any'],
  date: ['date', 'string', 'number', 'any'],
  filepath: ['filepath', 'string', 'url', 'any'],
  
  // Any can connect to anything
  any: ['execution', 'string', 'number', 'boolean', 'object', 'array', 'image', 'video', 'audio', 'json', 'url', 'date', 'filepath', 'any'],
};

// Types that can automatically convert (implicit conversion)
const AUTO_CONVERTIBLE: Record<string, PinType[]> = {
  number: ['string'], // number → string
  boolean: ['string', 'number'], // boolean → string/number
  object: ['json', 'string'], // object → json/string
  array: ['string', 'json'], // array → string/json
  json: ['object', 'array', 'string'], // json → object/array/string
  url: ['string'], // url → string
  date: ['string', 'number'], // date → string (ISO) or number (timestamp)
  filepath: ['string', 'url'], // filepath → string/url
};

// Types that require explicit adapter nodes (no automatic conversion)
const REQUIRES_ADAPTER: Record<string, PinType[]> = {
  image: ['video', 'audio', 'string'], // image cannot auto-convert to video/audio
  video: ['image', 'audio', 'string'], // video cannot auto-convert to image/audio
  audio: ['image', 'video', 'string'], // audio cannot auto-convert to image/video
  execution: [], // execution pins don't need adapters (always connect to execution)
};

/**
 * Check if two types can be connected
 */
export function canConnect(fromType: PinType, toType: PinType): ConnectionValidationResult {
  // Same type is always valid
  if (fromType === toType) {
    return {
      valid: true,
      requiresAdapter: false,
      canAutoConvert: false,
    };
  }
  
  // Handle custom types (strings that aren't standard types)
  const isCustomFromType = isCustomType(fromType);
  const isCustomToType = isCustomType(toType);
  
  // Custom types need to match or use 'any'
  if (isCustomFromType || isCustomToType) {
    if (toType === 'any' || fromType === 'any') {
      return {
        valid: true,
        requiresAdapter: false,
        canAutoConvert: true,
      };
    }
    
    // For now, custom types are strict - must match
    if (isCustomFromType && isCustomToType && fromType === toType) {
      return {
        valid: true,
        requiresAdapter: false,
        canAutoConvert: false,
      };
    }
    
    return {
      valid: false,
      requiresAdapter: true,
      canAutoConvert: false,
      errorMessage: `Cannot connect custom type "${fromType}" to "${toType}"`,
      suggestedAdapter: 'type-converter',
    };
  }
  
  // Check if types are compatible
  const compatibleTypes = TYPE_COMPATIBILITY[fromType] || [];
  const isCompatible = compatibleTypes.includes(toType) || compatibleTypes.includes('any');
  
  if (!isCompatible) {
    // Check if we need an adapter
    const needsAdapter = REQUIRES_ADAPTER[fromType]?.includes(toType) || false;
    
    return {
      valid: false,
      requiresAdapter: needsAdapter,
      canAutoConvert: false,
      errorMessage: `Cannot connect "${fromType}" to "${toType}"`,
      suggestedAdapter: needsAdapter ? getSuggestedAdapter(fromType, toType) : undefined,
    };
  }
  
  // Check if automatic conversion is available
  const canAutoConvert = AUTO_CONVERTIBLE[fromType]?.includes(toType) || false;
  
  return {
    valid: true,
    requiresAdapter: false,
    canAutoConvert,
  };
}

/**
 * Get all compatible types for a given source type
 */
export function getCompatibleTypes(fromType: PinType): PinType[] {
  if (fromType === 'any') {
    return [
      'execution', 'string', 'number', 'boolean', 'object', 'array',
      'image', 'video', 'audio', 'json', 'url', 'date', 'filepath', 'any',
    ];
  }
  
  const compatible = TYPE_COMPATIBILITY[fromType] || [];
  return [...new Set([...compatible, fromType])]; // Include self
}

/**
 * Check if a type requires an explicit adapter to connect to another type
 */
export function requiresExplicitAdapter(fromType: PinType, toType: PinType): boolean {
  if (fromType === toType) return false;
  
  const requires = REQUIRES_ADAPTER[fromType]?.includes(toType) || false;
  return requires;
}

/**
 * Check if automatic conversion is available between two types
 */
export function canAutoConvert(fromType: PinType, toType: PinType): boolean {
  if (fromType === toType) return false; // No conversion needed
  
  return AUTO_CONVERTIBLE[fromType]?.includes(toType) || false;
}

/**
 * Check if a type is a custom user-defined type
 */
export function isCustomType(type: PinType): boolean {
  const standardTypes: PinType[] = [
    'execution', 'string', 'number', 'boolean', 'object', 'array', 'any',
    'image', 'video', 'audio',
    'json', 'url', 'date', 'filepath',
  ];
  
  return !standardTypes.includes(type);
}

/**
 * Get suggested adapter node type for incompatible connections
 */
function getSuggestedAdapter(fromType: PinType, toType: PinType): string {
  // Media type conversions
  if (['image', 'video', 'audio'].includes(fromType) && ['image', 'video', 'audio'].includes(toType)) {
    return 'media-converter';
  }
  
  // Structured data conversions
  if (['json', 'object', 'array'].includes(fromType) && ['string', 'url'].includes(toType)) {
    return 'data-transformer';
  }
  
  // Default type converter
  return 'type-converter';
}

/**
 * Validate if a connection is valid between two pins
 */
export function validateConnection(
  fromPinType: PinType,
  toPinType: PinType,
  connectionType: 'execution' | 'data' = 'data'
): ConnectionValidationResult {
  // Execution connections must be execution type
  if (connectionType === 'execution') {
    if (fromPinType === 'execution' && toPinType === 'execution') {
      return {
        valid: true,
        requiresAdapter: false,
        canAutoConvert: false,
      };
    }
    
    return {
      valid: false,
      requiresAdapter: false,
      canAutoConvert: false,
      errorMessage: 'Execution pins can only connect to execution pins',
    };
  }
  
  // Data connections use type compatibility
  return canConnect(fromPinType, toPinType);
}

