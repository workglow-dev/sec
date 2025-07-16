# Storage Layer Documentation

This storage layer provides a comprehensive data persistence framework for SEC financial data using TypeScript, TypeBox schemas, and the repository pattern. It implements a clean architecture with dependency injection, data normalization, and relationship management.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Schema Definition Pattern](#schema-definition-pattern)
- [Repository Pattern](#repository-pattern)
- [Data Normalization](#data-normalization)
- [Junction Tables & Relationships](#junction-tables--relationships)
- [Dependency Injection](#dependency-injection)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Architecture Overview

The storage layer is organized around several key concepts:

1. **Schemas**: TypeBox-based schemas that define data structure and validation
2. **Repositories**: Service classes that handle CRUD operations and business logic
3. **Normalization**: Functions that clean and standardize incoming data
4. **Junction Tables**: For managing many-to-many relationships
5. **Service Tokens**: For dependency injection and testing

### Directory Structure

```
src/storage/
├── address/          # Address entities and normalization
├── company/          # Company entities and normalization  
├── entity/           # Core SEC entities (CIK-based)
├── filing/           # SEC filing documents
├── investment-offering/ # Investment offerings and history
├── person/           # Person entities and normalization
├── phone/            # Phone number entities and normalization
├── portal/           # Crowdfunding portals and related data
└── README.md         # This file
```

## Schema Definition Pattern

All schemas follow a consistent pattern using TypeBox for type-safe validation:

### Basic Schema Structure

```typescript
import { TabularRepository } from "@podley/storage";
import { createServiceToken, TypeNullable } from "@podley/util";
import { Static, Type } from "@sinclair/typebox";

/**
 * Entity schema with comprehensive field definitions
 */
export const EntitySchema = Type.Object({
  cik: Type.Integer({
    minimum: 0,
    description: "Central Index Key (CIK) - unique identifier for entity",
  }),
  name: TypeNullable(Type.String({ description: "Entity name" })),
  type: TypeNullable(Type.String({ description: "Entity type" })),
  // ... additional fields
});

export type Entity = Static<typeof EntitySchema>;

// Primary key definition
export const EntityPrimaryKeyNames = ["cik"] as const;
export type EntityRepositoryStorage = TabularRepository<
  typeof EntitySchema,
  typeof EntityPrimaryKeyNames
>;

// Service token for dependency injection
export const ENTITY_REPOSITORY_TOKEN = createServiceToken<EntityRepositoryStorage>(
  "sec.storage.entityRepository"
);
```

### Key Schema Features

- **TypeBox Validation**: Runtime type checking and validation
- **Nullable Fields**: Use `TypeNullable()` for optional/nullable fields
- **Descriptive Comments**: Each field includes meaningful descriptions
- **Type Safety**: Static types derived from schemas using `Static<>`
- **Primary Keys**: Explicitly defined for repository operations

## Repository Pattern

Repositories provide a clean interface for data persistence operations:

### Basic Repository Implementation

```typescript
/**
 * Entity repository - handles entities, tickers, SIC codes, and filings
 */
export class EntityRepo implements EntityRepoOptions {
  entityRepository: EntityRepositoryStorage;
  entityTickerRepository: EntityTickerRepositoryStorage;
  sicCodeRepository: SicCodeRepositoryStorage;
  cikNameRepository: CikNameRepositoryStorage;
  filingRepository: FilingRepositoryStorage;

  constructor(options: EntityRepoOptions = {}) {
    this.entityRepository =
      options.entityRepository ?? globalServiceRegistry.get(ENTITY_REPOSITORY_TOKEN);
    // ... other repositories
  }

  async saveEntity(entity: Entity): Promise<void> {
    await this.entityRepository.put(entity);
    await this.cikNameRepository.put({ cik: entity.cik, name: entity.name });
  }

  async getEntity(cik: number): Promise<Entity | undefined> {
    return this.entityRepository.get({ cik });
  }

  async getAllEntities(): Promise<Entity[]> {
    return (await this.entityRepository.getAll()) || [];
  }
}
```

### Repository Method Patterns

- **Save Operations**: `save*()` methods handle creation/updates
- **Get Operations**: `get*()` methods for retrieval by key
- **Search Operations**: `search*()` methods for filtered queries
- **Bulk Operations**: `getAll*()` methods for comprehensive retrieval
- **Relationship Operations**: Methods to manage entity relationships

## Data Normalization

Data normalization ensures consistent, clean data before persistence:

### Normalization Pattern

```typescript
export type AddressImport = {
  city?: string | null;
  stateOrCountry?: string | null;
  street1?: string | null;
  street2?: string | null;
  // ... other fields
};

/**
 * Normalizes address data before persistence
 */
export function normalizeAddress(address: AddressImport): Address | null {
  if (!address.city?.trim() || !address.stateOrCountry?.trim()) {
    return null;
  }

  const normalized = {
    address_hash_id: generateAddressHash(address),
    street1: cleanStreet(address.street1),
    street2: cleanStreet(address.street2),
    city: cleanCity(address.city),
    state_or_country: normalizeStateCountry(address.stateOrCountry),
    // ... additional normalization
  };

  return normalized;
}
```

### Normalization Features

- **Input Validation**: Check required fields and data quality
- **Data Cleaning**: Remove unwanted characters, standardize formats
- **Hash Generation**: Create unique identifiers for normalized entities
- **Null Handling**: Graceful handling of missing or invalid data
- **Standardization**: Convert data to canonical formats

## Junction Tables & Relationships

Junction tables manage many-to-many relationships between entities:

### Junction Table Pattern

```typescript
/**
 * Person Entity Junction schema - links persons to entities (CIK entities)
 */
export const PersonsEntityJunctionSchema = Type.Object({
  relation_name: Type.String({
    maxLength: 50,
    description: "Form relationship pair, e.g. form-d:offering",
  }),
  cik: TypeSecCik(),
  titles: Type.Array(
    Type.String({
      description: "Title of the relationship, e.g. CEO, General Counsel, etc.",
    })
  ),
  person_hash_id: Type.String({ description: "Reference to the person hash ID" }),
});

export const PersonEntityJunctionPrimaryKeyNames = [
  "person_hash_id",
  "relation_name", 
  "cik",
] as const;
```

### Relationship Management

```typescript
// Save relationship
async saveRelatedEntity(
  person_hash_id: string,
  relation_name: string,
  cik: number,
  titles: string[]
): Promise<void> {
  await this.personEntityJunctionRepository.put({
    person_hash_id,
    relation_name,
    cik,
    titles,
  });
}

// Query relationships
async getPersonsByEntity(cik: number): Promise<Person[]> {
  const junctions = await this.personEntityJunctionRepository.search({ cik });
  if (!junctions || junctions.length === 0) return [];

  const persons: Person[] = [];
  for (const junction of junctions) {
    const person = await this.getPerson(junction.person_hash_id);
    if (person) {
      persons.push(person);
    }
  }
  return persons;
}
```

### Common Junction Patterns

- **Person ↔ Entity**: People associated with companies (officers, directors)
- **Company ↔ Entity**: Company relationships (subsidiaries, affiliates)
- **Address ↔ Entity**: Addresses linked to entities (business, mailing)
- **Phone ↔ Entity**: Phone numbers associated with entities

## Dependency Injection

Service tokens enable flexible dependency injection and testing:

### Service Token Definition

```typescript
import { createServiceToken } from "@podley/util";

export const PERSON_REPOSITORY_TOKEN = createServiceToken<PersonRepositoryStorage>(
  "sec.storage.personRepository"
);

export const PERSON_ENTITY_JUNCTION_REPOSITORY_TOKEN = 
  createServiceToken<PersonEntityJunctionRepositoryStorage>(
    "sec.storage.personEntityJunctionRepository"
  );
```

### Repository Constructor with DI

```typescript
export class PersonRepo implements PersonRepoOptions {
  personRepository: PersonRepositoryStorage;
  personEntityJunctionRepository: PersonEntityJunctionRepositoryStorage;

  constructor(options: PersonRepoOptions = {}) {
    this.personRepository =
      options.personRepository ?? globalServiceRegistry.get(PERSON_REPOSITORY_TOKEN);
    
    this.personEntityJunctionRepository =
      options.personEntityJunctionRepository ??
      globalServiceRegistry.get(PERSON_ENTITY_JUNCTION_REPOSITORY_TOKEN);
  }
}
```

## Usage Examples

### Basic Entity Management

```typescript
import { EntityRepo } from "./entity/EntityRepo";
import { Entity } from "./entity/EntitySchema";

// Create repository instance
const entityRepo = new EntityRepo();

// Save a new entity
const entity: Entity = {
  cik: 123456,
  name: "Example Corporation",
  type: "corporation",
  sic: 7372,
  ein: "12-3456789",
  description: "Software development company",
  // ... other fields
};

await entityRepo.saveEntity(entity);

// Retrieve entity
const retrievedEntity = await entityRepo.getEntity(123456);
console.log(retrievedEntity);
```

### Person and Relationship Management

```typescript
import { PersonRepo } from "./person/PersonRepo";
import { normalizePerson } from "./person/PersonNormalization";

const personRepo = new PersonRepo();

// Import and normalize person data
const personImport = { name: "John William Smith JR" };
const person = await personRepo.savePerson(personImport);

// Link person to an entity with titles
await personRepo.saveRelatedEntity(
  person.person_hash_id,
  "form-d:offering",
  123456, // CIK
  ["CEO", "President"]
);

// Query persons by entity
const entityPersons = await personRepo.getPersonsByEntity(123456);
```

### Address Management with Junction

```typescript
import { AddressRepo } from "./address/AddressRepo";
import { normalizeAddress } from "./address/AddressNormalization";

const addressRepo = new AddressRepo();

// Save normalized address
const addressImport = {
  street1: "123 Main Street",
  city: "New York",
  stateOrCountry: "NY",
  zipCode: "10001"
};

const address = await addressRepo.saveAddress(addressImport);

// Link address to entity
await addressRepo.saveRelatedEntity(
  address.address_hash_id,
  "business_address",
  123456 // CIK
);
```

### Investment Offering with History

```typescript
import { InvestmentOfferingRepo } from "./investment-offering/InvestmentOfferingRepo";

const offeringRepo = new InvestmentOfferingRepo();

// Save offering with history in single transaction
const offering = { /* offering data */ };
const history = { /* history data */ };

const result = await offeringRepo.saveInvestmentOfferingWithHistory(
  offering,
  history
);
```

## Testing

The storage layer supports comprehensive testing through dependency injection:

```typescript
import { beforeEach, describe, expect, it } from "bun:test";
import { resetDependencyInjectionsForTesting } from "../../config/TestingDI";
import { PersonRepo } from "./PersonRepo";

describe("PersonRepo", () => {
  let personRepo: PersonRepo;
  
  beforeEach(() => {
    resetDependencyInjectionsForTesting();
    personRepo = new PersonRepo();
  });

  it("should save and retrieve person", async () => {
    const mockPerson = { name: "John Smith" };
    const savedPerson = await personRepo.savePerson(mockPerson);
    
    const retrievedPerson = await personRepo.getPerson(savedPerson.person_hash_id);
    expect(retrievedPerson).toEqual(savedPerson);
  });
});
```

## Best Practices

### Schema Design
- Use descriptive field names and comprehensive descriptions
- Implement proper validation constraints (min/max, format, etc.)
- Use `TypeNullable()` for optional fields
- Define clear primary key strategies

### Repository Implementation
- Implement normalization before persistence
- Handle null/undefined data gracefully
- Use transaction-like operations for related data
- Provide both individual and bulk operations

### Data Normalization
- Validate required fields early
- Clean and standardize data formats
- Generate consistent hash identifiers
- Handle edge cases and malformed data

### Relationship Management
- Use meaningful `relation_name` values
- Implement proper cascade operations
- Provide convenient query methods
- Handle orphaned relationships

### Testing
- Use dependency injection for testability
- Reset DI state between tests
- Test both success and failure scenarios
- Validate data persistence and retrieval

### Performance
- Use appropriate indexing strategies
- Implement bulk operations for large datasets
- Consider caching for frequently accessed data
- Monitor query performance and optimize as needed

## Error Handling

The storage layer implements comprehensive error handling:

```typescript
async savePerson(person: PersonImport): Promise<Person> {
  const normalizedPerson = normalizePerson(person);
  if (!normalizedPerson) {
    throw new Error(`Unable to clean and normalize the provided person: ${person}`);
  }
  await this.personRepository.put(normalizedPerson);
  return normalizedPerson;
}
```

Always validate data before persistence and provide meaningful error messages for debugging and monitoring.