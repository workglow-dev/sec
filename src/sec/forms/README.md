# SEC Forms Implementation Guide

This guide explains how to expand SEC form definitions from basic templates to full implementations with parsing, validation, testing, and storage capabilities.

## Architecture Overview

The forms system is organized hierarchically:

```
forms/
├── Form.ts                    # Base abstract class
├── FormSchemaUtil.ts          # Common schema types and utilities
├── parse_util.ts              # XML parsing utilities
├── all-forms.ts              # Master registry of all forms
└── [category]/               # Form category directories
    ├── index.ts              # Category-specific form registry
    ├── Form_[NAME].ts        # Basic form class
    ├── Form_[NAME].schema.ts # TypeBox schema definition (optional)
    ├── Form_[NAME].test.ts   # Test suite with mock data (optional)
    ├── Form_[NAME].storage.ts # Database storage logic (optional)
    ├── Form_[NAME].definition.*.xsd # XML Schema definitions (optional)
    └── mock_data/            # Test XML files (optional)
```

## Implementation Levels

### Level 1: Basic Form Template
**Purpose**: Placeholder for form recognition and routing
**Example**: `Form_1_A.ts`

```typescript
import { Form } from "../Form";

export class Form_1_A extends Form {
  static readonly name = "Human-readable form name";
  static readonly description = "Brief description";
  static readonly forms = ["FORM-TYPE", "FORM-TYPE/A"] as const;
}
```

**Required Properties**:
- `name`: Human-readable form name
- `description`: Brief description of the form's purpose
- `forms`: Array of SEC form type codes (including amendment variants like "/A")

### Level 2: Parsing Implementation
**Purpose**: Parse XML to structured data
**Example**: `Form_D.ts`

```typescript
import { Value } from "@sinclair/typebox/value";
import { Readable } from "node:stream";
import { Form } from "../Form";
import { streamToString } from "../parse_util";
import { FormSchema, FormSubmissionSchema } from "./Form_NAME.schema";

export class Form_NAME extends Form {
  static readonly name = "Form Name";
  static readonly description = "Form description";
  static readonly forms = ["FORM-TYPE"] as const;

  static async parse(input: string | Readable): Promise<FormData> {
    const xml = typeof input === "string" ? input : await streamToString(input);
    const parser = Form_NAME.getParser(FormSubmissionSchema);
    const json = parser.parse(xml) as FormSubmission;
    const rawForm = json.edgarSubmission;
    const form = Value.Convert(FormSchema, rawForm);
    return form as FormData;
  }
}

export type { FormData };
```

### Level 3: Schema Definition
**Purpose**: Define TypeBox schemas for validation and type safety
**File**: `Form_NAME.schema.ts`

```typescript
import { Type, Static } from "@sinclair/typebox";
import {
  STRING_150_TYPE,
  CIK_TYPE,
  PHONE_NUMBER_TYPE,
  // ... other common types
} from "../FormSchemaUtil";

// Define submission wrapper schema
export const FormSubmissionSchema = Type.Object({
  edgarSubmission: Type.Object({
    schemaVersion: Type.String(),
    submissionType: SubTypeList,
    testOrLive: TEST_LIVE_LIST,
    // ... form-specific fields
  })
});

// Define main form schema
export const FormSchema = Type.Object({
  // Define all form fields using FormSchemaUtil types
  entityName: STRING_150_TYPE,
  cik: CIK_TYPE,
  phoneNumber: Type.Optional(PHONE_NUMBER_TYPE),
  // ... other fields
});

// Export types
export type FormSubmission = Static<typeof FormSubmissionSchema>;
export type FormData = Static<typeof FormSchema>;
```

**Schema Best Practices**:
- Use types from `FormSchemaUtil.ts` for consistency
- Follow SEC field naming conventions
- Use `Type.Optional()` for optional fields
- Define enums for controlled vocabularies
- Include descriptions for complex types

### Level 4: Test Implementation
**Purpose**: Comprehensive testing with real XML data
**File**: `Form_NAME.test.ts`

```typescript
import { beforeEach, describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Form_NAME } from "./Form_NAME";
import { processFormNAME } from "./Form_NAME.storage";

describe("Form_NAME comprehensive test", () => {
  describe("Form parsing", () => {
    it("should parse all mock data files", async () => {
      const mockDataDir = join(__dirname, "mock_data", "form-name");
      const xmlFiles = readdirSync(mockDataDir).filter(f => f.endsWith(".xml"));
      
      for (const file of xmlFiles) {
        const xml = readFileSync(join(mockDataDir, file), "utf-8");
        const result = await Form_NAME.parse(xml);
        
        expect(result).toBeDefined();
        expect(result.cik).toBeTypeOf("number");
        // ... additional assertions
      }
    });
  });
});
```

### Level 5: Storage Implementation
**Purpose**: Database storage and business logic
**File**: `Form_NAME.storage.ts`

```typescript
import { CompanyRepo } from "../../storage/company/CompanyRepo";
import { FormData } from "./Form_NAME.schema";

export async function processFormNAME(
  cik: number,
  accessionNumber: string,
  formData: FormData
): Promise<void> {
  const companyRepo = new CompanyRepo();
  
  // Extract and normalize data
  // Store to appropriate repositories
  // Handle relationships
}
```

## Common Schema Types (FormSchemaUtil.ts)

Use these predefined types for consistency:

```typescript
// String types with length constraints
STRING_50_TYPE, STRING_150_TYPE, STRING_200_TYPE, STRING_255_TYPE

// Numeric types
POSITIVE_INTEGER_TYPE, CIK_TYPE, YEAR_VALUE_TYPE

// Formatted types
PHONE_NUMBER_TYPE, EMAIL_TYPE, ACCESSION_NUMBER_TYPE

// Address types
STREET_TYPE, CITY_TYPE, ZIP_CODE_TYPE

// Enum types
ENTITY_TYPE_LIST, RELATIONSHIP_LIST, TRUE_FALSE_LIST, TEST_LIVE_LIST
```

## Parsing Utilities (parse_util.ts)

Available utilities:
- `streamToString(stream)`: Convert Readable stream to string
- `extractArrayPaths(schema)`: Extract array paths for XML parser configuration

## Registration Process

### 1. Category Index (index.ts)
```typescript
import { Form_NAME } from "./Form_NAME";

export const CATEGORY_FORM_NAMES_MAP = [
  ...Form_NAME.forms.map((form) => [form, Form_NAME] as const),
  // ... other forms
] as const;

export const CATEGORY_FORM_NAMES = CATEGORY_FORM_NAMES_MAP.map(
  ([form, Form]) => form
);
```

### 2. Master Registry (all-forms.ts)
```typescript
import { CATEGORY_FORM_NAMES_MAP } from "./category";

export const ALL_FORM_NAMES_MAP = [
  ...CATEGORY_FORM_NAMES_MAP,
  // ... other categories
] as const;
```

## Development Workflow

### 1. Create Basic Template
Start with Level 1 implementation to establish form recognition.

### 2. Gather Requirements
- Obtain XSD files from SEC EDGAR documentation
- Collect sample XML files for testing
- Identify database storage requirements

### 3. Define Schema
Create TypeBox schema based on XSD and business requirements.

### 4. Implement Parsing
Add parse method with proper XML-to-JSON conversion.

### 5. Add Tests
Create comprehensive tests with mock data.

### 6. Implement Storage
Add database storage logic and business rules.

### 7. Register Form
Update index files and master registry.

## Mock Data Guidelines

Store test XML files in `mock_data/form-[type]/` directories:
- Use real SEC filing XML files when possible
- Include edge cases and error conditions
- Anonymize sensitive data if needed
- Name files with accession numbers: `[accession]-primary_doc.xml`

## XSD Integration

When XSD files are available:
- Store as `Form_NAME.definition.[variant].xsd`
- Use for schema validation in development
- Reference in schema documentation

## Error Handling Patterns

```typescript
// In parse method
try {
  const parser = Form_NAME.getParser(FormSubmissionSchema);
  const json = parser.parse(xml);
  return Value.Convert(FormSchema, json.edgarSubmission);
} catch (error) {
  throw new Error(`Failed to parse Form ${this.name}: ${error.message}`);
}
```

## Agentic AI Expansion Instructions

When asked to expand a form definition:

1. **Analyze Requirements**: Understand the form type, purpose, and complexity level needed
2. **Start with Template**: Create Level 1 implementation first
3. **Gather Context**: Look for existing XSD files, similar forms, or SEC documentation
4. **Schema Design**: Use FormSchemaUtil types and follow naming conventions
5. **Incremental Implementation**: Build up from basic template through full implementation
6. **Test Coverage**: Create tests for all mock data and edge cases
7. **Registration**: Update index files to make forms discoverable

## File Naming Conventions

- Form classes: `Form_[TYPE].ts` (underscores for form types with special characters)
- Schema files: `Form_[TYPE].schema.ts`
- Test files: `Form_[TYPE].test.ts`
- Storage files: `Form_[TYPE].storage.ts`
- XSD files: `Form_[TYPE].definition.[variant].xsd`
- Mock data: `mock_data/form-[type]/[accession]-primary_doc.xml`

## Dependencies

Core dependencies for form implementations:
- `@sinclair/typebox`: Schema definition and validation
- `fast-xml-parser`: XML parsing
- `bun:test`: Testing framework
- Repository classes from `../../storage/`

## References

- [SEC EDGAR Filer Manual](https://www.sec.gov/files/edgar/filermanual/edgarfilermmanual-vol2-c3.pdf)
- [TypeBox Documentation](https://github.com/sinclairzx81/typebox)
- Existing implementations in `exempt-offerings/` for patterns and examples