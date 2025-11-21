import { type TSchema, Type } from "typebox";

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
    title: (type as any).title as string | undefined,
    description: (type as any).description as string | undefined,
    ...annotations,
  });

export const TypeDateTime = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date-time", ...annotations });

export const TypeDate = (annotations: Record<string, unknown> = {}) =>
  Type.String({ format: "date", ...annotations });

export const TypeBlob = (annotations: Record<string, unknown> = {}) =>
  Type.Codec(Type.Any({ contentEncoding: "blob", ...annotations }))
    .Decode((value: unknown) => value as Uint8Array)
    .Encode((value: Uint8Array) => Buffer.from(value));

export class TypeStringEnumType<T extends string[] | readonly string[]> extends Type.Base<
  T[number]
> {
  public readonly type = "string";
  public readonly enum: T;

  constructor(values: T, annotations: Record<string, unknown> = {}) {
    super();
    this.enum = values;
    Object.assign(this, annotations);
    // create a non-enumerable property called annotations
    Object.defineProperty(this, "annotations", {
      value: annotations,
      enumerable: false,
    });
  }

  public Check(value: unknown): value is T[number] {
    return typeof value === "string" && this.enum.includes(value);
  }

  public Clone(): TypeStringEnumType<T> {
    // @ts-expect-error - annotations is not a property of TypeStringEnumType
    return new TypeStringEnumType(this.enum, this.annotations);
  }
}

export const TypeStringEnum = <T extends string[] | readonly string[]>(
  values: T,
  annotations: Record<string, unknown> = {}
) => new TypeStringEnumType(values as string[], annotations);
