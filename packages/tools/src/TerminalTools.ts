
import { spawn } from "child_process";
import { ProcessRegistry } from "./os/ProcessRegistry.js";

export class TerminalService {
    constructor(private registry: ProcessRegistry) { }

    getTools() {
        return [
            {
                name: "bash",
                description: "Execute a bash/shell command and return the standard output and standard error.",
                inputSchema: {
                    type: "object",
                    properties: {
                        command: { type: "string", description: "The command to execute in the shell." }
                    },
                    required: ["command"]
                },
                handler: async (args: { command: string }) => {
                    return new Promise((resolve) => {
                        console.log(`[Terminal] Executing bash: ${args.command}`);

                        const child = spawn(args.command, {
                            cwd: process.cwd(),
                            shell: true,
                            stdio: ['pipe', 'pipe', 'pipe']
                        });

                        this.registry.register(child, args.command);

                        let stdoutData = "";
                        let stderrData = "";

                        if (child.stdout) {
                            child.stdout.on('data', (d) => { stdoutData += d.toString(); });
                        }
                        if (child.stderr) {
                            child.stderr.on('data', (d) => { stderrData += d.toString(); });
                        }

                        child.on('error', (err) => {
                            resolve({ content: [{ type: "text", text: `Error: ${err.message}`, isError: true }] });
                        });

                        child.on('close', (code) => {
                            const output = stdoutData + (stderrData ? `\nSTDERR:\n${stderrData}` : "");
                            const trimmedOutput = output.length > 50000 ? output.substring(0, 50000) + "\n...[Output Truncated]" : output;

                            resolve({
                                content: [{ type: "text", text: trimmedOutput.trim() || `Command exited with code ${code}` }],
                                isError: code !== 0
                            });
                        });
                    });
                }
            },
            // Legacy Alias
            {
                name: "execute_command",
                description: "(Alias for bash) Execute a shell command.",
                inputSchema: {
                    type: "object",
                    properties: {
                        command: { type: "string" }
                    },
                    required: ["command"]
                },
                handler: async (args: any) => {
                    const bash = this.getTools().find(t => t.name === "bash");
                    return bash!.handler(args);
                }
            }
        ];
    }
}
