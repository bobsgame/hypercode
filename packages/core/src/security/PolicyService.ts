import fs from 'fs';
import path from 'path';

export interface PolicyRule {
    action: string; // "execute" or specific tool name
    resource: string; // Glob pattern for args (if applicable) or tool name
    effect: "ALLOW" | "DENY" | "ASK";
    reason?: string;
}

export interface PolicyConfig {
    version: string;
    rules: PolicyRule[];
}

export interface PolicyDecision {
    allowed: boolean;
    reason?: string;
}

export class PolicyService {
    private policyPath: string;
    private config: PolicyConfig;

    constructor(cwd: string) {
        this.policyPath = path.join(cwd, '.borg', 'policy.json');
        this.config = { version: "1.0", rules: [] };
        this.loadPolicy();
    }

    private loadPolicy() {
        try {
            if (fs.existsSync(this.policyPath)) {
                const content = fs.readFileSync(this.policyPath, 'utf-8');
                this.config = JSON.parse(content);
                console.log(`[PolicyService] Loaded ${this.config.rules.length} rules.`);
            } else {
                // Default Policy
                this.config = {
                    version: "1.0",
                    rules: [
                        { action: "execute", resource: "rm -rf *", effect: "DENY", reason: "Prevent catastrophe" },
                        { action: "*", resource: "*", effect: "ALLOW" }
                    ]
                };
                this.savePolicy();
            }
        } catch (e) {
            console.error("[PolicyService] Failed to load policy:", e);
        }
    }

    private savePolicy() {
        try {
            const dir = path.dirname(this.policyPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(this.policyPath, JSON.stringify(this.config, null, 2));
        } catch (e) {
            console.error("[PolicyService] Failed to save policy:", e);
        }
    }

    /**
     * Check if a tool execution is allowed.
     */
    public check(toolName: string, args: any): PolicyDecision {
        // 1. Check Explicit Rules
        for (const rule of this.config.rules) {
            // Match Action (usually 'execute' or tool name)
            const matchAction = rule.action === '*' || rule.action === 'execute' || rule.action === toolName;

            // Match Resource 
            // If rule.resource matches tool name (basic blacklist)
            // OR if rule.resource matches an argument value (granular)
            let matchResource = false;

            if (rule.resource === '*' || rule.resource === toolName) {
                matchResource = true;
            } else {
                // Granular arg check (simple glob on any string arg)
                // In future: support 'path:*.js' syntax
                const values = Object.values(args || {}).filter(v => typeof v === 'string') as string[];
                // Check if any arg matches rule.resource
                // Simple match for now: rule.resource contains match
                if (values.some(v => this.matches(rule.resource, v))) {
                    matchResource = true;
                }
            }

            if (matchAction && matchResource) {
                if (rule.effect === 'DENY') return { allowed: false, reason: rule.reason || 'Denied by policy rule.' };
                if (rule.effect === 'ALLOW') return { allowed: true };
            }
        }

        // 2. Hardcoded Security Checks (Fallback)
        if (['write_to_file', 'replace_file_content'].includes(toolName)) {
            const target = args?.TargetFile || args?.path;
            if (target && target.includes('.borg/policy.json')) {
                return { allowed: false, reason: "Cannot modify policy file via tools." };
            }
        }

        return { allowed: true };
    }

    private matches(pattern: string, value: string): boolean {
        if (pattern === "*") return true;
        if (pattern === value) return true;
        if (value.includes(pattern.replace(/\*/g, ''))) return true; // Very loose glob
        return false;
    }

    public updateRules(newRules: PolicyRule[]) {
        this.config.rules = newRules;
        this.savePolicy();
    }

    public getRules() {
        return this.config.rules;
    }
}
