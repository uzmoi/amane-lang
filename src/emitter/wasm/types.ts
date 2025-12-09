type Repeat4<T extends readonly unknown[]> = [...T, ...T, ...T, ...T];

type ExtractNumber<T> = T extends `${infer U extends number}` ? U : never;

export type u8 = ExtractNumber<keyof Repeat4<Repeat4<Repeat4<Repeat4<[0]>>>>>;
