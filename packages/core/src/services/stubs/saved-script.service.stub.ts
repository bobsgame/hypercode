export const savedScriptService = {
    listScripts: async () => Promise.resolve([] as { name: string; description?: string; code: string; }[]),
    getScript: async (_name: string) => Promise.resolve(null as { name: string; description?: string; code: string; } | null),
    saveScript: async (_name: string, _code: string, _desc?: string) => Promise.resolve({ name: _name }),
};
