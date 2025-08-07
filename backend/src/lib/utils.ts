interface NavigatorUABrandVersion {
  brand: string;
  version: string;
}

interface NavigatorUAData {
  brands: NavigatorUABrandVersion[];
  mobile: boolean;
  platform: string;
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: NavigatorUAData;
}

function getModernBrowserInfo(): {
  browserName: string;
  version: string;
} | null {
  const nav = navigator as NavigatorWithUAData;

  if (nav.userAgentData) {
    // Get the first non-minor brand (excluding Chromium)
    const brandInfo = nav.userAgentData.brands.find(
      (brand) => brand.brand !== "Chromium" && brand.brand !== "Not-A.Brand"
    );

    if (brandInfo) {
      return {
        browserName: brandInfo.brand,
        version: brandInfo.version,
      };
    }
  }

  return null;
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf("Firefox") > -1) {
    return "Mozilla Firefox";
  } else if (userAgent.indexOf("SamsungBrowser") > -1) {
    return "Samsung Browser";
  } else if (userAgent.indexOf("Opera") > -1 || userAgent.indexOf("OPR") > -1) {
    return "Opera";
  } else if (userAgent.indexOf("Trident") > -1) {
    return "Internet Explorer";
  } else if (userAgent.indexOf("Edge") > -1) {
    return "Microsoft Edge (Legacy)";
  } else if (userAgent.indexOf("Edg") > -1) {
    return "Microsoft Edge (Chromium)";
  } else if (userAgent.indexOf("Chrome") > -1) {
    return "Google Chrome";
  } else if (userAgent.indexOf("Safari") > -1) {
    return "Apple Safari";
  } else {
    return "Unknown Browser";
  }
}

export function getBrowserInfo() {
  const modernBrowserInfo = getModernBrowserInfo();
  if (modernBrowserInfo) {
    return `${modernBrowserInfo.browserName} ${modernBrowserInfo.version}`;
  } else {
    // Fall back to userAgent parsing
    return getBrowserName();
  }
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Safely parses JSON strings, including JavaScript object literal format
 * Handles both standard JSON and JS object literals with single quotes and unquoted keys
 */
export function safeJsonParse<T = any>(
  jsonString: string
): {
  success: boolean;
  data?: T;
  error?: string;
} {
  if (!jsonString || typeof jsonString !== "string") {
    return {
      success: false,
      error: "Input must be a non-empty string",
    };
  }

  // Trim whitespace
  const trimmed = jsonString.trim();

  // Try parsing as standard JSON first
  try {
    const result = JSON.parse(trimmed);
    return {
      success: true,
      data: result,
    };
  } catch (jsonError) {
    // If standard JSON parsing fails, try to convert JS object literal to JSON
    try {
      // Convert JavaScript object literal to valid JSON
      let converted = trimmed
        // Add quotes around unquoted property names (word characters followed by colon)
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
        // Convert single quotes to double quotes
        .replace(/'/g, '"')
        // Handle trailing commas (remove them)
        .replace(/,\s*([}\]])/g, "$1");

      const result = JSON.parse(converted);
      return {
        success: true,
        data: result,
      };
    } catch (conversionError) {
      // If conversion also fails, try using Function constructor (safer than eval)
      try {
        const result = new Function("return " + trimmed)();
        return {
          success: true,
          data: result,
        };
      } catch (functionError) {
        return {
          success: false,
          error: `Failed to parse JSON: ${
            jsonError instanceof Error
              ? jsonError.message
              : "Unknown JSON error"
          }, Conversion error: ${
            conversionError instanceof Error
              ? conversionError.message
              : "Unknown conversion error"
          }, Function error: ${
            functionError instanceof Error
              ? functionError.message
              : "Unknown function error"
          }`,
        };
      }
    }
  }
}

/**
 * Parses JSON array strings safely
 * Returns empty array if parsing fails
 */
export function parseJsonArray<T = any>(jsonString: string): T[] {
  const result = safeJsonParse<T[]>(jsonString);

  if (result.success && Array.isArray(result.data)) {
    return result.data;
  }

  // Log error in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.warn("Failed to parse JSON array:", result.error);
  }

  return [];
}

/**
 * Parses JSON object strings safely
 * Returns empty object if parsing fails
 */
export function parseJsonObject<T = Record<string, any>>(
  jsonString: string
): T {
  const result = safeJsonParse<T>(jsonString);

  if (
    result.success &&
    typeof result.data === "object" &&
    result.data !== null
  ) {
    return result.data;
  }

  // Log error in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.warn("Failed to parse JSON object:", result.error);
  }

  return {} as T;
}