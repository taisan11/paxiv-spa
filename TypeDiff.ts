import * as ts from "typescript";

type Dictionary<T> = Record<string, T>;

type TypeShape =
  | {
      kind: "text";
      text: string;
    }
  | {
      kind: "object";
      properties: Dictionary<PropertyShape>;
    }
  | {
      kind: "array";
      readonly: boolean;
      element: TypeShape;
    };

interface PropertyShape {
  type: TypeShape;
  optional: boolean;
  readonly: boolean;
}

interface InterfaceShape {
  name: string;
  properties: Dictionary<PropertyShape>;
}

interface PropertyChange {
  before: PropertyShape;
  after: PropertyShape;
  nested?: ObjectDiff;
}

interface ObjectDiff {
  onlyInA: Dictionary<PropertyShape>;
  onlyInB: Dictionary<PropertyShape>;
  changed: Dictionary<PropertyChange>;
}

export interface TypeDiffResult extends ObjectDiff {
  interfaceA: string;
  interfaceB: string;
}

const printer = ts.createPrinter({
  removeComments: true,
});

function dictionary<T>(): Dictionary<T> {
  // "__proto__" なども通常のキーとして安全に扱う
  return Object.create(null) as Dictionary<T>;
}

function hasOwn<T>(object: Dictionary<T>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function parseSource(code: string, fileName: string): ts.SourceFile {
  /*
   * createSourceFile() は構文エラーがあってもエラー回復したASTを返す。
   * そのためtranspileModuleで構文診断を先に取得する。
   */
  const validation = ts.transpileModule(code, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
  });

  const errors = (validation.diagnostics ?? [])
    .filter(
      diagnostic =>
        diagnostic.category === ts.DiagnosticCategory.Error,
    )
    .map(diagnostic =>
      ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n",
      ),
    );

  if (errors.length > 0) {
    throw new SyntaxError(
      `${fileName}:\n${errors.join("\n")}`,
    );
  }

  return ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function propertyNameToString(
  name: ts.PropertyName,
  sourceFile: ts.SourceFile,
): string {
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name) ||
    ts.isNoSubstitutionTemplateLiteral(name)
  ) {
    return name.text;
  }

  // [Symbol.iterator] など
  return printer.printNode(
    ts.EmitHint.Unspecified,
    name,
    sourceFile,
  );
}

function isReadonlyProperty(
  property: ts.PropertySignature,
): boolean {
  return (
    property.modifiers?.some(
      modifier =>
        modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
    ) ?? false
  );
}

function printType(
  type: ts.TypeNode,
  sourceFile: ts.SourceFile,
): string {
  /*
   * getText()ではなくPrinterを使い、
   * 空白や改行の違いをある程度正規化する
   */
  return printer.printNode(
    ts.EmitHint.Unspecified,
    type,
    sourceFile,
  );
}

function extractType(
  type: ts.TypeNode,
  sourceFile: ts.SourceFile,
): TypeShape {
  if (ts.isParenthesizedTypeNode(type)) {
    return extractType(type.type, sourceFile);
  }

  if (ts.isTypeLiteralNode(type)) {
    return {
      kind: "object",
      properties: extractProperties(
        type.members,
        sourceFile,
      ),
    };
  }

  // T[]
  if (ts.isArrayTypeNode(type)) {
    return {
      kind: "array",
      readonly: false,
      element: extractType(
        type.elementType,
        sourceFile,
      ),
    };
  }

  // readonly T[]
  if (
    ts.isTypeOperatorNode(type) &&
    type.operator === ts.SyntaxKind.ReadonlyKeyword &&
    ts.isArrayTypeNode(type.type)
  ) {
    return {
      kind: "array",
      readonly: true,
      element: extractType(
        type.type.elementType,
        sourceFile,
      ),
    };
  }

  // Array<T> / ReadonlyArray<T>
  if (
    ts.isTypeReferenceNode(type) &&
    ts.isIdentifier(type.typeName) &&
    type.typeArguments?.length === 1 &&
    (
      type.typeName.text === "Array" ||
      type.typeName.text === "ReadonlyArray"
    )
  ) {
    return {
      kind: "array",
      readonly:
        type.typeName.text === "ReadonlyArray",
      element: extractType(
        type.typeArguments[0]!,
        sourceFile,
      ),
    };
  }

  /*
   * string、number、union、tuple、型参照など。
   * Printerで正規化した文字列として比較する。
   */
  return {
    kind: "text",
    text: printType(type, sourceFile),
  };
}

function extractProperties(
  members: ts.NodeArray<ts.TypeElement>,
  sourceFile: ts.SourceFile,
): Dictionary<PropertyShape> {
  const properties = dictionary<PropertyShape>();

  for (const member of members) {
    if (!ts.isPropertySignature(member)) {
      throw new TypeError(
        `未対応のinterfaceメンバーです: ${
          printer.printNode(
            ts.EmitHint.Unspecified,
            member,
            sourceFile,
          )
        }`,
      );
    }

    if (member.type === undefined) {
      throw new TypeError(
        `型注釈のないプロパティには対応していません: ${
          member.getText(sourceFile)
        }`,
      );
    }

    const name = propertyNameToString(
      member.name,
      sourceFile,
    );

    if (hasOwn(properties, name)) {
      throw new TypeError(
        `プロパティ ${JSON.stringify(name)} が重複しています。`,
      );
    }

    properties[name] = {
      type: extractType(
        member.type,
        sourceFile,
      ),
      optional: member.questionToken !== undefined,
      readonly: isReadonlyProperty(member),
    };
  }

  return properties;
}

function parseInterface(
  code: string,
  interfaceName: string | undefined,
  fileName: string,
): InterfaceShape {
  const sourceFile = parseSource(code, fileName);

  const declarations = sourceFile.statements.filter(
    ts.isInterfaceDeclaration,
  );

  const candidates =
    interfaceName === undefined
      ? declarations
      : declarations.filter(
          node => node.name.text === interfaceName,
        );

  if (candidates.length === 0) {
    throw new Error(
      interfaceName === undefined
        ? `${fileName}: interface宣言が見つかりません。`
        : `${fileName}: interface ${interfaceName} が見つかりません。`,
    );
  }

  if (candidates.length > 1) {
    throw new Error(
      interfaceName === undefined
        ? `${fileName}: interfaceが複数あります。名前を指定してください。`
        : `${fileName}: interface ${interfaceName} が複数宣言されています。宣言マージには未対応です。`,
    );
  }

  const declaration = candidates[0]!;

  if (declaration.typeParameters?.length) {
    throw new TypeError(
      "ジェネリックinterfaceにはまだ対応していません。",
    );
  }

  if (declaration.heritageClauses?.length) {
    throw new TypeError(
      "extendsを持つinterfaceにはまだ対応していません。",
    );
  }

  return {
    name: declaration.name.text,
    properties: extractProperties(
      declaration.members,
      sourceFile,
    ),
  };
}

function typeShapeEquals(
  a: TypeShape,
  b: TypeShape,
): boolean {
  if (a.kind !== b.kind) {
    return false;
  }

  switch (a.kind) {
    case "text":
      return (
        b.kind === "text" &&
        a.text === b.text
      );

    case "array":
      return (
        b.kind === "array" &&
        a.readonly === b.readonly &&
        typeShapeEquals(a.element, b.element)
      );

    case "object":
      if (b.kind !== "object") {
        return false;
      }

      return isEmptyDiff(
        diffProperties(
          a.properties,
          b.properties,
        ),
      );
  }
}

function propertyEquals(
  a: PropertyShape,
  b: PropertyShape,
): boolean {
  return (
    a.optional === b.optional &&
    a.readonly === b.readonly &&
    typeShapeEquals(a.type, b.type)
  );
}

function diffProperties(
  a: Dictionary<PropertyShape>,
  b: Dictionary<PropertyShape>,
): ObjectDiff {
  const onlyInA = dictionary<PropertyShape>();
  const onlyInB = dictionary<PropertyShape>();
  const changed = dictionary<PropertyChange>();

  for (const [key, valueA] of Object.entries(a)) {
    if (!hasOwn(b, key)) {
      onlyInA[key] = valueA;
      continue;
    }

    const valueB = b[key]!;

    if (propertyEquals(valueA, valueB)) {
      continue;
    }

    const nested =
      valueA.type.kind === "object" &&
      valueB.type.kind === "object"
        ? diffProperties(
            valueA.type.properties,
            valueB.type.properties,
          )
        : undefined;

    changed[key] = {
      before: valueA,
      after: valueB,
      ...(
        nested !== undefined &&
        !isEmptyDiff(nested)
          ? { nested }
          : {}
      ),
    };
  }

  for (const [key, valueB] of Object.entries(b)) {
    if (!hasOwn(a, key)) {
      onlyInB[key] = valueB;
    }
  }

  return {
    onlyInA,
    onlyInB,
    changed,
  };
}

function isEmptyDiff(diff: ObjectDiff): boolean {
  return (
    Object.keys(diff.onlyInA).length === 0 &&
    Object.keys(diff.onlyInB).length === 0 &&
    Object.keys(diff.changed).length === 0
  );
}

export function typeDiff(
  codeA: string,
  codeB: string,
  options: {
    interfaceA?: string;
    interfaceB?: string;
  } = {},
): TypeDiffResult {
  const shapeA = parseInterface(
    codeA,
    options.interfaceA,
    "a.ts",
  );

  const shapeB = parseInterface(
    codeB,
    options.interfaceB,
    "b.ts",
  );

  return {
    interfaceA: shapeA.name,
    interfaceB: shapeB.name,
    ...diffProperties(
      shapeA.properties,
      shapeB.properties,
    ),
  };
}
