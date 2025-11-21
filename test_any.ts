import { Type } from "typebox";

console.log("Any:", JSON.stringify(Type.Any(), null, 2));
console.log("String:", JSON.stringify(Type.String(), null, 2));
console.log("Nullable Any:", JSON.stringify(Type.Union([Type.Any(), Type.Null()]), null, 2));
