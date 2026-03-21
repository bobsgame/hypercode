import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const APP_DIR = path.resolve(__dirname);
const GUARD_TEST_FILE = normalize(__filename);

function walk(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        if (entry.name === "node_modules" || entry.name === ".next") {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

function normalize(p: string): string {
    return p.replace(/\\/g, "/");
}

function getDefaultExportSnippet(source: string): string | null {
    const sourceFile = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const resolveIdentifierDeclaration = (name: string): ts.Node | null => {
        for (const statement of sourceFile.statements) {
            if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) {
                return statement;
            }
            if (ts.isVariableStatement(statement)) {
                for (const declaration of statement.declarationList.declarations) {
                    if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
                        return declaration;
                    }
                }
            }
        }
        return null;
    };

    for (const statement of sourceFile.statements) {
        if (
            ts.isFunctionDeclaration(statement)
            && statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)
        ) {
            return source.slice(statement.getStart(sourceFile), statement.end);
        }

        if (ts.isExportAssignment(statement)) {
            if (ts.isIdentifier(statement.expression)) {
                const declaration = resolveIdentifierDeclaration(statement.expression.text);
                if (declaration) {
                    return source.slice(declaration.getStart(sourceFile), declaration.end);
                }
            }

            return source.slice(statement.getStart(sourceFile), statement.end);
        }
    }

    return null;
}

describe("App Router useSearchParams safety", () => {
    it("wraps route page default exports in Suspense when route files use useSearchParams", () => {
        const appSourceFiles = walk(APP_DIR)
            .map(normalize)
            .filter((file) => /\.(ts|tsx)$/.test(file));

        const findNearestPageFile = (filePath: string): string | null => {
            let currentDir = path.dirname(filePath);
            while (normalize(currentDir).startsWith(normalize(APP_DIR))) {
                const candidate = normalize(path.join(currentDir, "page.tsx"));
                if (fs.existsSync(candidate)) {
                    return candidate;
                }

                const parent = path.dirname(currentDir);
                if (parent === currentDir) {
                    break;
                }
                currentDir = parent;
            }
            return null;
        };

        const pageFilesToValidate = new Set<string>();

        for (const file of appSourceFiles) {
            if (file === GUARD_TEST_FILE) {
                continue;
            }

            const source = fs.readFileSync(file, "utf8");
            if (!source.includes("useSearchParams")) {
                continue;
            }

            const nearestPage = findNearestPageFile(file);
            if (nearestPage) {
                pageFilesToValidate.add(nearestPage);
            }
        }

        const offenders: string[] = [];

        for (const file of pageFilesToValidate) {
            const source = fs.readFileSync(file, "utf8");

            const hasSuspenseImport = /import\s+[^;]*\bSuspense\b[^;]*from\s+["']react["']/.test(source)
                || /import\s+\*\s+as\s+React\s+from\s+["']react["']/.test(source);
            const defaultExportSnippet = getDefaultExportSnippet(source);
            const hasSuspenseOnDefaultExportPath = defaultExportSnippet
                ? /<(?:React\.)?Suspense\b/.test(defaultExportSnippet)
                : false;

            if (!hasSuspenseImport || !hasSuspenseOnDefaultExportPath) {
                offenders.push(file);
            }
        }

        expect(
            offenders,
            `Route pages without Suspense on default export path while route files use useSearchParams: ${JSON.stringify(offenders, null, 2)}`,
        ).toEqual([]);
    });
});
