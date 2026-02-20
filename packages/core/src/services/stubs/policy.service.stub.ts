export interface Policy { }

export const policyService = {
    getPolicy: async (_policyId: string): Promise<Policy | null> => {
        return null;
    },
    evaluateAccess: (_policy: unknown, _toolName: string): boolean => {
        return true;
    }
};
