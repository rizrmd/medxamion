import type { CRUDConfig, FlexibleEntity, FormFieldConfig, ColumnConfig } from "../types";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ValidationContext {
  entityName: string;
  formMode?: "create" | "edit" | null;
}

/**
 * Validates ECrud configuration for common issues and best practices
 */
export function validateECrudConfig<T extends FlexibleEntity>(
  config: CRUDConfig<T>,
  context?: Partial<ValidationContext>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const ctx: ValidationContext = {
    entityName: config.entityName,
    ...context,
  };

  // Basic validation
  validateBasicConfig(config, errors, warnings);
  
  // Column validation
  validateColumns(config.columns, errors, warnings, ctx);
  
  // Form fields validation
  const formFields = typeof config.formFields === "function" 
    ? config.formFields({ showTrash: false, formMode: ctx.formMode || null })
    : config.formFields;
  validateFormFields(formFields, errors, warnings, ctx);
  
  // Filter validation
  validateFilters(config.filters, errors, warnings, ctx);
  
  // Actions validation
  validateActions(config.actions, errors, warnings, ctx);
  
  // Soft delete validation
  validateSoftDelete(config.softDelete, errors, warnings, ctx);
  
  // Nested CRUD validation
  validateNestedCRUD(config.nested, errors, warnings, ctx);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateBasicConfig<T extends FlexibleEntity>(
  config: CRUDConfig<T>,
  errors: string[],
  warnings: string[]
) {
  // Required fields
  if (!config.entityName) {
    errors.push("entityName is required");
  }
  
  if (!config.columns || config.columns.length === 0) {
    errors.push("At least one column is required");
  }
  
  if (!config.formFields) {
    errors.push("formFields is required");
  }

  // Best practices
  if (config.entityName && /^[a-z]/.test(config.entityName)) {
    warnings.push("entityName should start with uppercase letter for Indonesian UI");
  }
  
  if (!config.entityNamePlural) {
    warnings.push("Consider providing entityNamePlural for better UX");
  }
  
  if (config.entityName && config.entityName.includes("_")) {
    warnings.push("entityName should use spaces instead of underscores for display");
  }
}

function validateColumns<T extends FlexibleEntity>(
  columns: ColumnConfig<T>[],
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  const keysSeen = new Set<string>();
  
  columns.forEach((column, index) => {
    const prefix = `Column[${index}] (${String(column.key)})`;
    
    // Required fields
    if (!column.key) {
      errors.push(`${prefix}: key is required`);
    }
    
    if (!column.label) {
      errors.push(`${prefix}: label is required`);
    }
    
    // Duplicate keys
    const keyStr = String(column.key);
    if (keysSeen.has(keyStr)) {
      errors.push(`${prefix}: duplicate key "${keyStr}"`);
    }
    keysSeen.add(keyStr);
    
    // Best practices
    if (column.label && /^[a-z]/.test(column.label)) {
      warnings.push(`${prefix}: label should start with uppercase letter`);
    }
    
    if (column.render && !column.render.name) {
      warnings.push(`${prefix}: consider using useMemo for render function performance`);
    }
    
    // Relation config validation
    if (column.relationConfig) {
      validateRelationConfig(column.relationConfig, `${prefix}.relationConfig`, errors, warnings);
    }
  });
}

function validateFormFields<T extends FlexibleEntity>(
  formFields: FormFieldConfig<T>[],
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  const namesSeen = new Set<string>();
  
  formFields.forEach((field, index) => {
    const prefix = `FormField[${index}] (${String(field.name)})`;
    
    // Required fields
    if (!field.name) {
      errors.push(`${prefix}: name is required`);
    }
    
    if (!field.label) {
      errors.push(`${prefix}: label is required`);
    }
    
    if (!field.type) {
      errors.push(`${prefix}: type is required`);
    }
    
    // Duplicate names
    const nameStr = String(field.name);
    if (namesSeen.has(nameStr)) {
      errors.push(`${prefix}: duplicate name "${nameStr}"`);
    }
    namesSeen.add(nameStr);
    
    // Type-specific validation
    if (field.type === "select" && !field.options && !field.relationConfig) {
      errors.push(`${prefix}: select type requires either options or relationConfig`);
    }
    
    if (field.type === "relation" && !field.relationConfig) {
      errors.push(`${prefix}: relation type requires relationConfig`);
    }
    
    // Best practices
    if (field.label && /^[a-z]/.test(field.label)) {
      warnings.push(`${prefix}: label should start with uppercase letter`);
    }
    
    if (field.required && !field.validation) {
      warnings.push(`${prefix}: consider adding custom validation for required field`);
    }
    
    if (field.type === "password" && !field.validation) {
      warnings.push(`${prefix}: password field should have validation`);
    }
    
    if (field.type === "email" && !field.validation) {
      warnings.push(`${prefix}: email field should have validation`);
    }
    
    // Relation config validation
    if (field.relationConfig) {
      validateRelationConfig(field.relationConfig, `${prefix}.relationConfig`, errors, warnings);
    }
  });
}

function validateFilters(
  filters: any[],
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  const keysSeen = new Set<string>();
  
  filters.forEach((filter, index) => {
    const prefix = `Filter[${index}] (${filter.key})`;
    
    // Required fields
    if (!filter.key) {
      errors.push(`${prefix}: key is required`);
    }
    
    if (!filter.label) {
      errors.push(`${prefix}: label is required`);
    }
    
    if (!filter.type) {
      errors.push(`${prefix}: type is required`);
    }
    
    // Duplicate keys
    if (keysSeen.has(filter.key)) {
      errors.push(`${prefix}: duplicate key "${filter.key}"`);
    }
    keysSeen.add(filter.key);
    
    // Type-specific validation
    if (filter.type === "select" && !filter.options && !filter.relationConfig) {
      errors.push(`${prefix}: select type requires either options or relationConfig`);
    }
    
    if (filter.type === "relation" && !filter.relationConfig) {
      errors.push(`${prefix}: relation type requires relationConfig`);
    }
    
    // Best practices
    if (filter.label && /^[a-z]/.test(filter.label)) {
      warnings.push(`${prefix}: label should start with uppercase letter`);
    }
  });
}

function validateActions(
  actions: any,
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  if (!actions) return;
  
  // List actions validation
  if (actions.list) {
    if (actions.list.bulkDelete && !actions.list.bulkSelect) {
      warnings.push("bulkDelete requires bulkSelect to be enabled");
    }
    
    if (actions.list.bulkRestore && !actions.list.bulkSelect) {
      warnings.push("bulkRestore requires bulkSelect to be enabled");
    }
    
    if (actions.list.restore && !actions.list.viewTrash) {
      warnings.push("restore action is more useful with viewTrash enabled");
    }
  }
}

function validateSoftDelete(
  softDelete: any,
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  if (!softDelete) return;
  
  if (softDelete.enabled && !softDelete.field) {
    errors.push("softDelete.field is required when softDelete is enabled");
  }
  
  if (softDelete.enabled && !softDelete.field.includes("deleted")) {
    warnings.push("softDelete.field should typically contain 'deleted' (e.g., 'deleted_at')");
  }
}

function validateNestedCRUD(
  nested: any[],
  errors: string[],
  warnings: string[],
  context: ValidationContext
) {
  if (!nested || nested.length === 0) return;
  
  nested.forEach((nestedConfig, index) => {
    const prefix = `Nested[${index}]`;
    
    // Required fields
    if (!nestedConfig.title) {
      errors.push(`${prefix}: title is required`);
    }
    
    if (!nestedConfig.config) {
      errors.push(`${prefix}: config is required`);
    }
    
    if (!nestedConfig.parentField) {
      errors.push(`${prefix}: parentField is required`);
    }
    
    if (!nestedConfig.nestedParentField) {
      errors.push(`${prefix}: nestedParentField is required`);
    }
    
    if (!nestedConfig.model) {
      errors.push(`${prefix}: model is required`);
    }
    
    // Best practices
    if (nestedConfig.position && !["tab", "section"].includes(nestedConfig.position)) {
      warnings.push(`${prefix}: position should be "tab" or "section"`);
    }
    
    // Recursive validation of nested config
    if (nestedConfig.config) {
      const nestedValidation = validateECrudConfig(nestedConfig.config, {
        entityName: nestedConfig.config.entityName || "nested entity",
      });
      
      nestedValidation.errors.forEach(error => {
        errors.push(`${prefix}.config: ${error}`);
      });
      
      nestedValidation.warnings.forEach(warning => {
        warnings.push(`${prefix}.config: ${warning}`);
      });
    }
  });
}

function validateRelationConfig(
  relationConfig: any,
  prefix: string,
  errors: string[],
  warnings: string[]
) {
  if (!relationConfig.type) {
    errors.push(`${prefix}: type is required`);
    return;
  }
  
  switch (relationConfig.type) {
    case "model":
      if (!relationConfig.model) {
        errors.push(`${prefix}: model is required for type "model"`);
      }
      if (!relationConfig.labelFields || relationConfig.labelFields.length === 0) {
        errors.push(`${prefix}: labelFields is required for type "model"`);
      }
      if (!relationConfig.renderLabel) {
        errors.push(`${prefix}: renderLabel is required for type "model"`);
      }
      break;
      
    case "api":
      if (!relationConfig.endpoint) {
        errors.push(`${prefix}: endpoint is required for type "api"`);
      }
      if (!relationConfig.labelFields || relationConfig.labelFields.length === 0) {
        errors.push(`${prefix}: labelFields is required for type "api"`);
      }
      break;
      
    case "custom":
      if (!relationConfig.loadOptions) {
        errors.push(`${prefix}: loadOptions is required for type "custom"`);
      }
      break;
      
    default:
      errors.push(`${prefix}: invalid type "${relationConfig.type}"`);
  }
}

/**
 * Development helper to validate config and log results
 */
export function debugECrudConfig<T extends FlexibleEntity>(
  config: CRUDConfig<T>,
  context?: Partial<ValidationContext>
): void {
  if (process.env.NODE_ENV !== "development") return;
  
  const result = validateECrudConfig(config, context);
  
  if (result.errors.length > 0) {
    console.group(`❌ ECrud Config Errors (${config.entityName})`);
    result.errors.forEach(error => console.error(`  • ${error}`));
    console.groupEnd();
  }
  
  if (result.warnings.length > 0) {
    console.group(`⚠️  ECrud Config Warnings (${config.entityName})`);
    result.warnings.forEach(warning => console.warn(`  • ${warning}`));
    console.groupEnd();
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log(`✅ ECrud Config Valid (${config.entityName})`);
  }
}