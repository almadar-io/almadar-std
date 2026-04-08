#!/usr/bin/env npx tsx
/**
 * build-lolo-behavior-metadata.ts
 *
 * Walks @almadar/std's own `behaviors/functions/{atoms,molecules,organisms}/*.ts`
 * source files with the TypeScript Compiler API and extracts every behavior's
 * `*Params` interface as a runtime-importable metadata snapshot used by
 * `@almadar-tools/lolo-types-sync`.
 *
 * Output: `behaviors/generated/lolo-behavior-metadata.ts` — a TypeScript
 * module exporting `LOLO_BEHAVIOR_METADATA`. Re-exported from the package's
 * `index.ts` and `registry.ts` so consumers can `import { LOLO_BEHAVIOR_METADATA }
 * from '@almadar/std'` and never read the package's source files directly.
 *
 * Run on demand whenever any behavior's `*Params` interface changes:
 *
 *     npx tsx scripts/build-lolo-behavior-metadata.ts
 *
 * The output file is committed to git so the package ships ready-to-import
 * metadata without requiring consumers (or CI) to run the script.
 *
 * The metadata pairs each behavior with the entry from `behaviors-registry.json`
 * (level, family, description, connectableEvents, composableWith) so the
 * tool gets a single consolidated import.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");
const FUNCTIONS_DIR = path.join(PKG_ROOT, "behaviors", "functions");
const REGISTRY_PATH = path.join(PKG_ROOT, "behaviors", "behaviors-registry.json");
const OUTPUT_FILE = path.join(PKG_ROOT, "behaviors", "generated", "lolo-behavior-metadata.ts");

// ============================================================================
// Output shape
// ============================================================================

type BehaviorLevel = "atom" | "molecule" | "organism";

interface BehaviorParamDef {
  name: string;
  type: string;
  optional: boolean;
}

interface BehaviorMetadata {
  name: string;
  level: BehaviorLevel;
  family?: string;
  description: string;
  params: BehaviorParamDef[];
  connectableEvents: string[];
  composableWith: string[];
  source: string;
}

interface LoloBehaviorMetadata {
  generatedAt: string;
  behaviors: BehaviorMetadata[];
}

interface RegistryEntry {
  name: string;
  level: BehaviorLevel;
  family?: string;
  description: string;
  connectableEvents?: string[];
  composableWith?: string[];
}

interface RegistryFile {
  behaviors: Record<string, RegistryEntry>;
}

// ============================================================================
// Type expression rendering
// ============================================================================

function renderTypeNode(node: ts.TypeNode | undefined, sourceFile: ts.SourceFile): string {
  if (!node) return "any";
  if (node.kind === ts.SyntaxKind.StringKeyword) return "string";
  if (node.kind === ts.SyntaxKind.NumberKeyword) return "number";
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return "boolean";
  if (node.kind === ts.SyntaxKind.AnyKeyword) return "any";
  if (node.kind === ts.SyntaxKind.UnknownKeyword) return "any";
  if (node.kind === ts.SyntaxKind.VoidKeyword) return "void";
  if (node.kind === ts.SyntaxKind.NullKeyword) return "null";
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) return "undefined";

  if (ts.isArrayTypeNode(node)) {
    return `[${renderTypeNode(node.elementType, sourceFile)}]`;
  }
  if (ts.isUnionTypeNode(node)) {
    const parts: string[] = [];
    for (const member of node.types) {
      if (member.kind === ts.SyntaxKind.UndefinedKeyword) continue;
      if (member.kind === ts.SyntaxKind.NullKeyword) continue;
      parts.push(renderTypeNode(member, sourceFile));
    }
    if (parts.length === 0) return "any";
    if (parts.length === 1) return parts[0];
    return parts.join(" | ");
  }
  if (ts.isLiteralTypeNode(node)) {
    if (ts.isStringLiteral(node.literal)) return `"${node.literal.text}"`;
    if (ts.isNumericLiteral(node.literal)) return node.literal.text;
    if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return "true";
    if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return "false";
    return "any";
  }
  if (ts.isTypeReferenceNode(node)) {
    return node.typeName.getText(sourceFile);
  }
  if (ts.isParenthesizedTypeNode(node)) {
    return renderTypeNode(node.type, sourceFile);
  }
  if (ts.isTupleTypeNode(node)) {
    const parts = node.elements.map((e) => renderTypeNode(e, sourceFile));
    return `[${parts.join(", ")}]`;
  }
  if (ts.isFunctionTypeNode(node)) return "function";
  if (ts.isTypeLiteralNode(node)) return "object";
  if (ts.isIntersectionTypeNode(node)) return "object";
  return "any";
}

// ============================================================================
// Params interface extraction
// ============================================================================

function extractParamsInterface(sourceFile: ts.SourceFile): BehaviorParamDef[] | null {
  let target: ts.InterfaceDeclaration | null = null;

  for (const stmt of sourceFile.statements) {
    if (!ts.isInterfaceDeclaration(stmt)) continue;
    if (!stmt.name.text.endsWith("Params")) continue;
    if (
      !stmt.modifiers ||
      !stmt.modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      continue;
    }
    target = stmt;
    break;
  }

  if (!target) return null;

  const params: BehaviorParamDef[] = [];
  for (const member of target.members) {
    if (!ts.isPropertySignature(member)) continue;
    if (!member.name) continue;
    const name = member.name.getText(sourceFile);
    const type = renderTypeNode(member.type, sourceFile);
    const optional = !!member.questionToken;
    params.push({ name, type, optional });
  }
  return params;
}

// ============================================================================
// Walk behavior files
// ============================================================================

interface BehaviorFile {
  name: string;
  filePath: string;
  level: BehaviorLevel;
}

function findBehaviorFiles(): BehaviorFile[] {
  const dirs: { dir: string; level: BehaviorLevel }[] = [
    { dir: path.join(FUNCTIONS_DIR, "atoms"), level: "atom" },
    { dir: path.join(FUNCTIONS_DIR, "molecules"), level: "molecule" },
    { dir: path.join(FUNCTIONS_DIR, "organisms"), level: "organism" },
  ];

  const files: BehaviorFile[] = [];
  for (const { dir, level } of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.endsWith(".ts")) continue;
      if (entry === "index.ts") continue;
      const filePath = path.join(dir, entry);
      const name = entry.replace(/\.ts$/, "");
      files.push({ name, filePath, level });
    }
  }
  files.sort((a, b) => a.name.localeCompare(b.name, "en"));
  return files;
}

function inferParamsInterfaceName(behaviorName: string): string {
  return (
    behaviorName
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "Params"
  );
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const registry: RegistryFile = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8")) as RegistryFile;
  const behaviorFiles = findBehaviorFiles();
  const behaviors: BehaviorMetadata[] = [];

  for (const file of behaviorFiles) {
    const text = fs.readFileSync(file.filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
      file.filePath,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    );
    const params = extractParamsInterface(sourceFile) ?? [];
    const registryEntry = registry.behaviors[file.name];
    const description = registryEntry?.description ?? `${file.name} behavior`;
    const family = registryEntry?.family;
    const level = registryEntry?.level ?? file.level;
    const connectableEvents = [...(registryEntry?.connectableEvents ?? [])];
    const composableWith = [...(registryEntry?.composableWith ?? [])];

    const relPath = path.relative(PKG_ROOT, file.filePath);
    const interfaceName = inferParamsInterfaceName(file.name);

    behaviors.push({
      name: file.name,
      level,
      family,
      description,
      params,
      connectableEvents,
      composableWith,
      source: `${relPath} (${interfaceName})`,
    });
  }

  const metadata: LoloBehaviorMetadata = {
    generatedAt: new Date().toISOString(),
    behaviors,
  };

  const tsHeader = `/**
 * lolo-behavior-metadata.ts
 *
 * AUTO-GENERATED — DO NOT EDIT BY HAND.
 *
 * Regenerate with:
 *   cd packages/almadar-std && npx tsx scripts/build-lolo-behavior-metadata.ts
 *
 * This module ships @almadar/std's behavior parameter metadata as a runtime
 * constant so consumers like @almadar-tools/lolo-types-sync can import it
 * via the package's public API instead of walking workspace source files.
 */

`;
  const tsBody = `export const LOLO_BEHAVIOR_METADATA = ${JSON.stringify(metadata, null, 2)} as const;

export type LoloBehaviorMetadata = typeof LOLO_BEHAVIOR_METADATA;
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, tsHeader + tsBody, "utf-8");

  console.log(`✓ wrote ${path.relative(PKG_ROOT, OUTPUT_FILE)}`);
  console.log(`  behaviors: ${metadata.behaviors.length}`);
  const byLevel = metadata.behaviors.reduce<Record<string, number>>((acc, b) => {
    acc[b.level] = (acc[b.level] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`  by level: atoms=${byLevel.atom ?? 0} molecules=${byLevel.molecule ?? 0} organisms=${byLevel.organism ?? 0}`);
}

main();
