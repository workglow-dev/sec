import { Kind, type TSchema, Type, TypeRegistry } from "@sinclair/typebox";

/**
 * Creates a nullable type by wrapping the given type in a union with null.
 * This allows a field to accept either the specified type or null.
 *
 * @param schema - The TypeBox schema to make nullable
 * @returns A union type that includes the original type and null
 */
export function TypeNullable<T extends TSchema>(schema: T) {
  return Type.Union([schema, Type.Null()]);
}

export const TypeOptionalArray = <T extends TSchema>(
  type: T,
  annotations: Record<string, unknown> = {}
) =>
  Type.Union([type, Type.Array(type)], {
    title: type.title,
    description: type.description,
    ...annotations,
  });

export const TypeDateTime = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date-time", ...annotations });

export const TypeDate = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date", ...annotations });

export const TypeBlob = (annotations: Record<string, unknown> = {}) =>
  Type.Transform(Type.Any({ contentEncoding: "blob", ...annotations }))
    .Decode((value: unknown) => value as Uint8Array)
    .Encode((value: Uint8Array) => Buffer.from(value));

TypeRegistry.Set("TypeStringEnum", (schema: { enum: string[] }, value: unknown) => {
  return typeof value === "string" && schema.enum.includes(value);
});

export const TypeStringEnum = <T extends string[]>(values: [...T]) =>
  Type.Unsafe<T[number]>({
    [Kind]: "TypeStringEnum",
    type: "string",
    enum: values,
  });
