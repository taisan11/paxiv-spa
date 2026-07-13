/**
 * JSON から TypeScript の型定義を生成するユーティリティ。
 *
 * Bun CLI:
 *   bun genAPITypes.ts <URL | JSONファイル | JSON文字列 | -> [TypeName]
 */

export type LiteralInferenceMode = "none" | "discriminators" | "all";

export interface TypeGenerationOptions {
    indentSize?: number;
    detectDates?: boolean;
    analyzeAllArrayElements?: boolean;
    readonly?: boolean;
    maxArraySamples?: number;
    excludedKeys?: readonly string[];
    literalInference?: LiteralInferenceMode;
    maxLiteralUnionSize?: number;
    exportType?: boolean;
}

interface ResolvedTypeGenerationOptions {
    indentSize: number;
    detectDates: boolean;
    analyzeAllArrayElements: boolean;
    readonly: boolean;
    maxArraySamples: number;
    excludedKeys: ReadonlySet<string>;
    literalInference: LiteralInferenceMode;
    maxLiteralUnionSize: number;
    exportType: boolean;
}

const DEFAULT_OPTIONS = {
    indentSize: 2,
    detectDates: true,
    analyzeAllArrayElements: false,
    readonly: false,
    maxArraySamples: 100,
    excludedKeys: ["ads"],
    literalInference: "discriminators",
    maxLiteralUnionSize: 12,
    exportType: true,
} as const satisfies Required<TypeGenerationOptions>;

const DISCRIMINATOR_KEY_PATTERN =
    /^(type|kind|status|state|role|mode|category|variant|event|action|method|code)$/i;

const RESERVED_TYPE_NAMES = new Set([
    "any",
    "as",
    "asserts",
    "async",
    "await",
    "bigint",
    "boolean",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "constructor",
    "continue",
    "debugger",
    "declare",
    "default",
    "delete",
    "do",
    "else",
    "enum",
    "export",
    "extends",
    "false",
    "finally",
    "for",
    "from",
    "function",
    "get",
    "if",
    "implements",
    "import",
    "in",
    "infer",
    "instanceof",
    "interface",
    "is",
    "keyof",
    "let",
    "module",
    "namespace",
    "never",
    "new",
    "null",
    "number",
    "object",
    "of",
    "package",
    "private",
    "protected",
    "public",
    "readonly",
    "require",
    "return",
    "set",
    "static",
    "string",
    "super",
    "switch",
    "symbol",
    "this",
    "throw",
    "true",
    "try",
    "type",
    "typeof",
    "undefined",
    "unique",
    "unknown",
    "using",
    "var",
    "void",
    "while",
    "with",
    "yield",
]);

type PrimitiveName =
    | "string"
    | "number"
    | "boolean"
    | "bigint"
    | "symbol"
    | "undefined";

type LiteralValue = string | number | boolean;

type TypeModel =
    | { kind: "primitive"; name: PrimitiveName }
    | { kind: "literal"; value: LiteralValue }
    | { kind: "date" }
    | { kind: "null" }
    | { kind: "unknown"; reason?: "circular" | "unsupported" }
    | { kind: "array"; element: TypeModel }
    | { kind: "object"; properties: ReadonlyMap<string, PropertyModel> }
    | { kind: "union"; types: readonly TypeModel[] };

interface PropertyModel {
    type: TypeModel;
    optional: boolean;
}

interface InferenceContext {
    options: ResolvedTypeGenerationOptions;
    activeObjects: WeakSet<object>;
}

interface InferHints {
    allowLiterals: boolean;
}

const BROAD_HINTS: InferHints = { allowLiterals: false };

function resolveOptions(options: TypeGenerationOptions): ResolvedTypeGenerationOptions {
    const indentSize = options.indentSize ?? DEFAULT_OPTIONS.indentSize;
    const maxArraySamples = options.maxArraySamples ?? DEFAULT_OPTIONS.maxArraySamples;
    const maxLiteralUnionSize =
        options.maxLiteralUnionSize ?? DEFAULT_OPTIONS.maxLiteralUnionSize;

    assertIntegerInRange(indentSize, "indentSize", 0, 16);
    assertIntegerInRange(maxArraySamples, "maxArraySamples", 1, 1_000_000);
    assertIntegerInRange(maxLiteralUnionSize, "maxLiteralUnionSize", 1, 1_000);

    const literalInference = options.literalInference ?? DEFAULT_OPTIONS.literalInference;
    if (!(["none", "discriminators", "all"] as const).includes(literalInference)) {
        throw new TypeError(
            `literalInference must be "none", "discriminators", or "all": ${String(literalInference)}`
        );
    }

    return {
        indentSize,
        detectDates: options.detectDates ?? DEFAULT_OPTIONS.detectDates,
        analyzeAllArrayElements:
            options.analyzeAllArrayElements ?? DEFAULT_OPTIONS.analyzeAllArrayElements,
        readonly: options.readonly ?? DEFAULT_OPTIONS.readonly,
        maxArraySamples,
        excludedKeys: new Set(options.excludedKeys ?? DEFAULT_OPTIONS.excludedKeys),
        literalInference,
        maxLiteralUnionSize,
        exportType: options.exportType ?? DEFAULT_OPTIONS.exportType,
    };
}

function assertIntegerInRange(
    value: number,
    optionName: string,
    minimum: number,
    maximum: number
): void {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new RangeError(
            `${optionName} must be an integer between ${minimum} and ${maximum}: ${value}`
        );
    }
}

function assertTypeName(typeName: string): void {
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(typeName)) {
        throw new TypeError(`Invalid TypeScript type name: ${JSON.stringify(typeName)}`);
    }
    if (RESERVED_TYPE_NAMES.has(typeName)) {
        throw new TypeError(`Reserved word cannot be used as a type name: ${typeName}`);
    }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function isIsoDateString(value: string): boolean {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnly) {
        return isValidCalendarDate(
            Number(dateOnly[1]),
            Number(dateOnly[2]),
            Number(dateOnly[3])
        );
    }

    const dateTime =
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(
            value
        );
    if (!dateTime) return false;

    const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] =
        dateTime.map(Number);
    if (!isValidCalendarDate(year, month, day)) return false;
    if (hour > 23 || minute > 59 || second > 59) return false;
    if (offsetHour !== undefined && (offsetHour > 23 || offsetMinute > 59)) return false;

    return Number.isFinite(Date.parse(value));
}

function shouldInferLiteralsForKey(
    key: string,
    options: ResolvedTypeGenerationOptions
): boolean {
    if (options.literalInference === "all") return true;
    if (options.literalInference === "none") return false;
    return DISCRIMINATOR_KEY_PATTERN.test(key);
}

function inferValue(
    value: unknown,
    context: InferenceContext,
    hints: InferHints = BROAD_HINTS
): TypeModel {
    if (value === null) return { kind: "null" };

    switch (typeof value) {
        case "string":
            if (context.options.detectDates && isIsoDateString(value)) {
                return { kind: "date" };
            }
            return hints.allowLiterals
                ? { kind: "literal", value }
                : { kind: "primitive", name: "string" };

        case "number":
            return Number.isFinite(value) && hints.allowLiterals
                ? { kind: "literal", value }
                : { kind: "primitive", name: "number" };

        case "boolean":
            return hints.allowLiterals
                ? { kind: "literal", value }
                : { kind: "primitive", name: "boolean" };

        case "bigint":
            return { kind: "primitive", name: "bigint" };

        case "undefined":
            return { kind: "primitive", name: "undefined" };

        case "symbol":
            return { kind: "primitive", name: "symbol" };

        case "function":
            return { kind: "unknown", reason: "unsupported" };

        case "object":
            if (Array.isArray(value)) return inferArray(value, context);
            if (isPlainObject(value)) return inferObject(value, context);
            return { kind: "unknown", reason: "unsupported" };

        default:
            return { kind: "unknown", reason: "unsupported" };
    }
}

function inferArray(value: readonly unknown[], context: InferenceContext): TypeModel {
    if (context.activeObjects.has(value)) {
        return { kind: "unknown", reason: "circular" };
    }

    context.activeObjects.add(value);
    try {
        if (value.length === 0) {
            return { kind: "array", element: { kind: "unknown" } };
        }

        const samples = context.options.analyzeAllArrayElements
            ? value
            : value.slice(0, context.options.maxArraySamples);

        const objectItems: Record<string, unknown>[] = [];
        const otherItems: unknown[] = [];

        for (const item of samples) {
            if (isPlainObject(item)) objectItems.push(item);
            else otherItems.push(item);
        }

        const elementTypes: TypeModel[] = [];
        if (objectItems.length > 0) {
            elementTypes.push(inferMergedObjects(objectItems, context));
        }

        const allowArrayLiterals =
            context.options.literalInference === "all" && samples.length > 1;
        for (const item of otherItems) {
            elementTypes.push(
                inferValue(item, context, { allowLiterals: allowArrayLiterals })
            );
        }

        return {
            kind: "array",
            element: buildUnionModel(elementTypes, context.options),
        };
    } finally {
        context.activeObjects.delete(value);
    }
}

function inferObject(
    value: Record<string, unknown>,
    context: InferenceContext
): TypeModel {
    if (context.activeObjects.has(value)) {
        return { kind: "unknown", reason: "circular" };
    }

    context.activeObjects.add(value);
    try {
        const properties = new Map<string, PropertyModel>();
        const entries = Object.entries(value)
            .filter(([key]) => !context.options.excludedKeys.has(key))
            .sort(([a], [b]) => a.localeCompare(b));

        for (const [key, propertyValue] of entries) {
            const optional = propertyValue === undefined;
            properties.set(key, {
                optional,
                type: inferValue(propertyValue, context, BROAD_HINTS),
            });
        }

        return { kind: "object", properties };
    } finally {
        context.activeObjects.delete(value);
    }
}

function inferMergedObjects(
    objects: readonly Record<string, unknown>[],
    context: InferenceContext
): TypeModel {
    const newlyActive: Record<string, unknown>[] = [];
    for (const object of objects) {
        if (context.activeObjects.has(object)) {
            return { kind: "unknown", reason: "circular" };
        }
        context.activeObjects.add(object);
        newlyActive.push(object);
    }

    try {
        const propertyMap = new Map<string, unknown[]>();

        for (const object of objects) {
            for (const [key, propertyValue] of Object.entries(object)) {
                if (context.options.excludedKeys.has(key)) continue;
                const values = propertyMap.get(key);
                if (values) values.push(propertyValue);
                else propertyMap.set(key, [propertyValue]);
            }
        }

        const properties = new Map<string, PropertyModel>();
        const sortedKeys = [...propertyMap.keys()].sort((a, b) => a.localeCompare(b));

        for (const key of sortedKeys) {
            const values = propertyMap.get(key)!;
            const optional =
                values.length < objects.length || values.some((value) => value === undefined);
            const definedValues = values.filter((value) => value !== undefined);
            const allowLiterals =
                objects.length > 1 && shouldInferLiteralsForKey(key, context.options);

            properties.set(key, {
                optional,
                type:
                    definedValues.length === 0
                        ? { kind: "unknown" }
                        : inferMergedValues(definedValues, context, allowLiterals),
            });
        }

        return { kind: "object", properties };
    } finally {
        for (const object of newlyActive) {
            context.activeObjects.delete(object);
        }
    }
}

function inferMergedValues(
    values: readonly unknown[],
    context: InferenceContext,
    allowLiterals: boolean
): TypeModel {
    const objectValues: Record<string, unknown>[] = [];
    const otherValues: unknown[] = [];

    for (const value of values) {
        if (isPlainObject(value)) objectValues.push(value);
        else otherValues.push(value);
    }

    const types: TypeModel[] = [];
    if (objectValues.length > 0) {
        types.push(inferMergedObjects(objectValues, context));
    }
    for (const value of otherValues) {
        types.push(inferValue(value, context, { allowLiterals }));
    }

    return buildUnionModel(types, context.options);
}

function buildUnionModel(
    inputTypes: readonly TypeModel[],
    options: ResolvedTypeGenerationOptions
): TypeModel {
    let types = inputTypes.flatMap((type) =>
        type.kind === "union" ? [...type.types] : [type]
    );

    if (types.length === 0) return { kind: "unknown" };
    const unknownType = types.find(
        (type): type is Extract<TypeModel, { kind: "unknown" }> => type.kind === "unknown"
    );
    if (unknownType) return unknownType;

    // Array<T1> | Array<T2> は Array<T1 | T2> にまとめる。
    const arrays = types.filter(
        (type): type is Extract<TypeModel, { kind: "array" }> => type.kind === "array"
    );
    if (arrays.length > 1) {
        types = types.filter((type) => type.kind !== "array");
        types.push({
            kind: "array",
            element: buildUnionModel(
                arrays.map((array) => array.element),
                options
            ),
        });
    }

    const broadPrimitives = new Set(
        types
            .filter(
                (type): type is Extract<TypeModel, { kind: "primitive" }> =>
                    type.kind === "primitive"
            )
            .map((type) => type.name)
    );

    if (broadPrimitives.has("string")) {
        types = types.filter(
            (type) =>
                type.kind !== "date" &&
                !(type.kind === "literal" && typeof type.value === "string")
        );
    }

    types = types.filter((type) => {
        if (type.kind !== "literal") return true;
        return !broadPrimitives.has(typeof type.value as PrimitiveName);
    });

    const literalGroups = new Map<string, Extract<TypeModel, { kind: "literal" }>[]>();
    for (const type of types) {
        if (type.kind !== "literal") continue;
        const group = literalGroups.get(typeof type.value);
        if (group) group.push(type);
        else literalGroups.set(typeof type.value, [type]);
    }

    for (const [primitive, literals] of literalGroups) {
        const uniqueCount = new Set(literals.map((literal) => canonicalTypeKey(literal))).size;
        const shouldWidenBoolean = primitive === "boolean" && uniqueCount >= 2;
        if (uniqueCount > options.maxLiteralUnionSize || shouldWidenBoolean) {
            types = types.filter(
                (type) => !(type.kind === "literal" && typeof type.value === primitive)
            );
            types.push({ kind: "primitive", name: primitive as PrimitiveName });
        }
    }

    const finalBroadPrimitives = new Set(
        types
            .filter(
                (type): type is Extract<TypeModel, { kind: "primitive" }> =>
                    type.kind === "primitive"
            )
            .map((type) => type.name)
    );
    types = types.filter((type) => {
        if (finalBroadPrimitives.has("string") && type.kind === "date") return false;
        if (type.kind !== "literal") return true;
        return !finalBroadPrimitives.has(typeof type.value as PrimitiveName);
    });

    const uniqueTypes = new Map<string, TypeModel>();
    for (const type of types) {
        uniqueTypes.set(canonicalTypeKey(type), type);
    }

    const normalized = [...uniqueTypes.values()].sort(compareTypeModels);
    if (normalized.length === 1) return normalized[0];
    return { kind: "union", types: normalized };
}

function canonicalTypeKey(type: TypeModel): string {
    switch (type.kind) {
        case "primitive":
            return `primitive:${type.name}`;
        case "literal":
            return `literal:${typeof type.value}:${JSON.stringify(type.value)}`;
        case "date":
            return "date";
        case "null":
            return "null";
        case "unknown":
            return `unknown:${type.reason ?? ""}`;
        case "array":
            return `array:${canonicalTypeKey(type.element)}`;
        case "object":
            return `object:{${[...type.properties.entries()]
                .map(
                    ([key, property]) =>
                        `${JSON.stringify(key)}${property.optional ? "?" : ""}:${canonicalTypeKey(property.type)}`
                )
                .join(",")}}`;
        case "union":
            return `union:${type.types.map(canonicalTypeKey).join("|")}`;
    }
}

function compareTypeModels(a: TypeModel, b: TypeModel): number {
    const rank = (type: TypeModel): number => {
        switch (type.kind) {
            case "literal":
                return 0;
            case "date":
                return 1;
            case "object":
                return 2;
            case "array":
                return 3;
            case "primitive":
                if (type.name === "undefined") return 90;
                return 10;
            case "unknown":
                return 80;
            case "null":
                return 89;
            case "union":
                return 50;
        }
    };

    return rank(a) - rank(b) || canonicalTypeKey(a).localeCompare(canonicalTypeKey(b));
}

function renderType(
    type: TypeModel,
    options: ResolvedTypeGenerationOptions,
    level: number
): string {
    switch (type.kind) {
        case "primitive":
            return type.name;

        case "literal":
            if (typeof type.value === "string") return JSON.stringify(type.value);
            return String(type.value);

        case "date":
            return "string /* ISO 8601 date */";

        case "null":
            return "null";

        case "unknown":
            if (type.reason === "circular") return "unknown /* circular reference */";
            if (type.reason === "unsupported") return "unknown /* unsupported value */";
            return "unknown";

        case "array": {
            const element = renderType(type.element, options, level);
            const wrapped = type.element.kind === "union" ? `(${element})` : element;
            return `${options.readonly ? "readonly " : ""}${wrapped}[]`;
        }

        case "union":
            return type.types.map((part) => renderType(part, options, level)).join(" | ");

        case "object": {
            if (type.properties.size === 0) return "Record<string, never>";

            const currentIndent = indent(options, level);
            const propertyIndent = indent(options, level + 1);
            const properties = [...type.properties.entries()].map(([key, property]) => {
                const readonlyPrefix = options.readonly ? "readonly " : "";
                const optional = property.optional ? "?" : "";
                return `${propertyIndent}${readonlyPrefix}${toSafePropertyKey(key)}${optional}: ${renderType(
                    property.type,
                    options,
                    level + 1
                )};`;
            });

            return `{\n${properties.join("\n")}\n${currentIndent}}`;
        }
    }
}

function indent(options: ResolvedTypeGenerationOptions, level: number): string {
    return " ".repeat(options.indentSize * level);
}

function toSafePropertyKey(key: string): string {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

export function generateTypeFromJson(
    json: unknown,
    typeName = "GeneratedType",
    options: TypeGenerationOptions = {}
): string {
    assertTypeName(typeName);
    const resolvedOptions = resolveOptions(options);
    const context: InferenceContext = {
        options: resolvedOptions,
        activeObjects: new WeakSet<object>(),
    };
    const model = inferValue(json, context);
    const exportPrefix = resolvedOptions.exportType ? "export " : "";

    if (model.kind === "object") {
        if (model.properties.size === 0) {
            return `${exportPrefix}type ${typeName} = Record<string, never>;`;
        }

        const body = renderType(model, resolvedOptions, 0);
        return `${exportPrefix}interface ${typeName} ${body}`;
    }

    return `${exportPrefix}type ${typeName} = ${renderType(model, resolvedOptions, 0)};`;
}

export function parseJsonText(text: string, sourceName = "input"): unknown {
    const normalizedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
    if (normalizedText.trim().length === 0) {
        throw new SyntaxError(`${sourceName} is empty`);
    }

    try {
        return JSON.parse(normalizedText) as unknown;
    } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        throw new SyntaxError(formatJsonParseError(error, normalizedText, sourceName), {
            cause: error,
        });
    }
}

function formatJsonParseError(error: SyntaxError, text: string, sourceName: string): string {
    const positionMatch = /position\s+(\d+)/i.exec(error.message);
    if (!positionMatch) return `Invalid JSON in ${sourceName}: ${error.message}`;

    const position = Number(positionMatch[1]);
    const before = text.slice(0, position);
    const line = before.split("\n").length;
    const lastLineBreak = before.lastIndexOf("\n");
    const column = position - lastLineBreak;
    return `Invalid JSON in ${sourceName} at line ${line}, column ${column}: ${error.message}`;
}

export async function generateTypeFromJsonUrl(
    url: string,
    typeName = "GeneratedType",
    options: TypeGenerationOptions = {}
): Promise<string> {
    return generateTypeFromJson(await fetchJson(url), typeName, options);
}

export async function generateTypeFromJsonFile(
    path: string,
    typeName = "GeneratedType",
    options: TypeGenerationOptions = {}
): Promise<string> {
    return generateTypeFromJson(await readJsonFile(path), typeName, options);
}

type InputSelection =
    | { kind: "auto"; value: string }
    | { kind: "url"; value: string }
    | { kind: "file"; value: string }
    | { kind: "json"; value: string }
    | { kind: "stdin" };

interface CliConfig {
    input?: InputSelection;
    typeName: string;
    outputPath?: string;
    options: TypeGenerationOptions;
    help: boolean;
}

class CliUsageError extends Error {}

const HELP_TEXT = `\
JSON to TypeScript type generator

Usage:
  bun genAPITypes.ts <source> [TypeName] [options]
  cat data.json | bun genAPITypes.ts [options]

Sources (automatically detected):
  https://example.com/api.json      HTTP/HTTPS URL
  ./data.json                       JSON file path
  '{"id":1,"name":"Alice"}'      Direct JSON string (quote it in your shell)
  -                                 Standard input

Explicit input options:
  --url <url>                       Read JSON from a URL
  --file <path>                     Read JSON from a file
  --json <json>                     Read JSON directly from an argument
  --stdin                           Read JSON from standard input

Output options:
  -n, --name <name>                 Root type name (default: GeneratedType)
  -o, --output <path>               Write output to a file instead of stdout
      --no-export                   Do not add the export keyword
      --readonly                    Make properties and arrays readonly
      --indent <spaces>             Indentation width, 0-16 (default: 2)

Inference options:
      --detect-dates                Mark ISO 8601 strings (default)
      --no-detect-dates             Treat dates as ordinary strings
      --all-array-elements          Analyze every array element
      --max-array-samples <count>   Array sample limit (default: 100)
      --literal-mode <mode>         none | discriminators | all
                                    (default: discriminators)
      --literals                    Alias for --literal-mode all
      --no-literals                 Alias for --literal-mode none
      --max-literal-union <count>   Widen larger literal unions (default: 12)
      --exclude <keys>              Exclude comma-separated keys; repeatable
                                    (default exclusion: ads)
      --include-all-keys            Clear the default exclusions

Other:
  -h, --help                        Show this help

Examples:
  bun genAPITypes.ts https://api.example.com/users Users
  bun genAPITypes.ts ./response.json -n ApiResponse -o api-types.ts
  bun genAPITypes.ts --json '{"ok":true}' --name Result
  curl -s https://api.example.com/data | bun genAPITypes.ts -n Data
  cat response.json | bun genAPITypes.ts --readonly --all-array-elements
`;

function parseCliArguments(args: readonly string[]): CliConfig {
    let explicitInput: InputSelection | undefined;
    let typeNameFromOption: string | undefined;
    let outputPath: string | undefined;
    let help = false;
    const positionals: string[] = [];
    const excludedKeys = new Set<string>(DEFAULT_OPTIONS.excludedKeys);
    const generationOptions: TypeGenerationOptions = {};

    const setInput = (input: InputSelection): void => {
        if (explicitInput) {
            throw new CliUsageError("Only one input source can be specified");
        }
        explicitInput = input;
    };

    const takeValue = (
        optionName: string,
        inlineValue: string | undefined,
        index: number
    ): [string, number] => {
        if (inlineValue !== undefined) return [inlineValue, index];
        const value = args[index + 1];
        if (value === undefined) {
            throw new CliUsageError(`${optionName} requires a value`);
        }
        return [value, index + 1];
    };

    for (let index = 0; index < args.length; index++) {
        const argument = args[index];

        if (argument === "--") {
            positionals.push(...args.slice(index + 1));
            break;
        }

        if (!argument.startsWith("-") || argument === "-") {
            positionals.push(argument);
            continue;
        }

        const equalsIndex = argument.indexOf("=");
        const optionName = equalsIndex >= 0 ? argument.slice(0, equalsIndex) : argument;
        const inlineValue = equalsIndex >= 0 ? argument.slice(equalsIndex + 1) : undefined;

        switch (optionName) {
            case "-h":
            case "--help":
                help = true;
                break;

            case "-n":
            case "--name": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                typeNameFromOption = value;
                index = nextIndex;
                break;
            }

            case "-o":
            case "--output": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                outputPath = value;
                index = nextIndex;
                break;
            }

            case "--url":
            case "--file":
            case "--json": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                setInput({ kind: optionName.slice(2) as "url" | "file" | "json", value });
                index = nextIndex;
                break;
            }

            case "--stdin":
                setInput({ kind: "stdin" });
                break;

            case "--indent": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                generationOptions.indentSize = parseIntegerOption(optionName, value);
                index = nextIndex;
                break;
            }

            case "--max-array-samples": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                generationOptions.maxArraySamples = parseIntegerOption(optionName, value);
                index = nextIndex;
                break;
            }

            case "--max-literal-union": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                generationOptions.maxLiteralUnionSize = parseIntegerOption(optionName, value);
                index = nextIndex;
                break;
            }

            case "--literal-mode": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                if (value !== "none" && value !== "discriminators" && value !== "all") {
                    throw new CliUsageError(
                        `--literal-mode must be none, discriminators, or all: ${value}`
                    );
                }
                generationOptions.literalInference = value;
                index = nextIndex;
                break;
            }

            case "--exclude": {
                const [value, nextIndex] = takeValue(optionName, inlineValue, index);
                for (const key of value.split(",").map((part) => part.trim())) {
                    if (key) excludedKeys.add(key);
                }
                index = nextIndex;
                break;
            }

            case "--include-all-keys":
                excludedKeys.clear();
                break;

            case "--detect-dates":
                generationOptions.detectDates = true;
                break;
            case "--no-detect-dates":
                generationOptions.detectDates = false;
                break;
            case "--all-array-elements":
                generationOptions.analyzeAllArrayElements = true;
                break;
            case "--readonly":
                generationOptions.readonly = true;
                break;
            case "--no-export":
                generationOptions.exportType = false;
                break;
            case "--literals":
                generationOptions.literalInference = "all";
                break;
            case "--no-literals":
                generationOptions.literalInference = "none";
                break;

            default:
                throw new CliUsageError(`Unknown option: ${optionName}`);
        }
    }

    if (help) {
        return {
            input: explicitInput,
            typeName: typeNameFromOption ?? "GeneratedType",
            outputPath,
            options: generationOptions,
            help: true,
        };
    }

    let input = explicitInput;
    let positionalTypeName: string | undefined;

    if (explicitInput) {
        if (positionals.length > 1) {
            throw new CliUsageError("Too many positional arguments");
        }
        positionalTypeName = positionals[0];
    } else {
        if (positionals.length > 2) {
            throw new CliUsageError("Too many positional arguments");
        }
        if (positionals[0] !== undefined) {
            input = positionals[0] === "-"
                ? { kind: "stdin" }
                : { kind: "auto", value: positionals[0] };
        }
        positionalTypeName = positionals[1];
    }

    if (typeNameFromOption && positionalTypeName) {
        throw new CliUsageError("Type name was specified both positionally and with --name");
    }

    generationOptions.excludedKeys = [...excludedKeys];

    return {
        input,
        typeName: typeNameFromOption ?? positionalTypeName ?? "GeneratedType",
        outputPath,
        options: generationOptions,
        help: false,
    };
}

function parseIntegerOption(optionName: string, value: string): number {
    if (!/^-?\d+$/.test(value)) {
        throw new CliUsageError(`${optionName} requires an integer: ${value}`);
    }
    return Number(value);
}

function isHttpUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

async function loadCliJson(input: InputSelection | undefined): Promise<unknown> {
    if (!input) {
        if (process.stdin.isTTY) {
            throw new CliUsageError("No input was specified");
        }
        return parseJsonText(await Bun.stdin.text(), "stdin");
    }

    switch (input.kind) {
        case "stdin":
            return parseJsonText(await Bun.stdin.text(), "stdin");

        case "json":
            return parseJsonText(input.value, "--json");

        case "url":
            return fetchJson(input.value);

        case "file":
            return readJsonFile(input.value);

        case "auto": {
            if (isHttpUrl(input.value)) return fetchJson(input.value);

            const file = Bun.file(input.value);
            if (await file.exists()) {
                return parseJsonText(await file.text(), input.value);
            }

            try {
                return parseJsonText(input.value, "direct JSON input");
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                throw new CliUsageError(
                    `Input is neither an existing file, an HTTP(S) URL, nor valid JSON:\n${input.value}\n${detail}`
                );
            }
        }
    }
}

async function fetchJson(url: string): Promise<unknown> {
    const response = await fetch(url, {
        headers: { accept: "application/json, application/*+json;q=0.9, */*;q=0.1" },
    });
    if (!response.ok) {
        const detail = (await response.text()).trim().slice(0, 300);
        throw new Error(
            `Failed to fetch ${url}: ${response.status} ${response.statusText}${
                detail ? `\n${detail}` : ""
            }`
        );
    }
    return parseJsonText(await response.text(), url);
}

async function readJsonFile(path: string): Promise<unknown> {
    const file = Bun.file(path);
    if (!(await file.exists())) throw new Error(`JSON file not found: ${path}`);
    return parseJsonText(await file.text(), path);
}

async function runCli(): Promise<void> {
    const config = parseCliArguments(Bun.argv.slice(2));
    if (config.help) {
        console.log(HELP_TEXT);
        return;
    }

    assertTypeName(config.typeName);
    const json = await loadCliJson(config.input);
    const output = generateTypeFromJson(json, config.typeName, config.options);

    if (config.outputPath) {
        await Bun.write(config.outputPath, `${output}\n`);
        return;
    }

    await Bun.write(Bun.stdout, `${output}\n`);
}

if (import.meta.main) {
    runCli().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error: ${message}`);
        if (error instanceof CliUsageError) {
            console.error("Run with --help to see usage.");
            process.exitCode = 2;
        } else {
            process.exitCode = 1;
        }
    });
}
