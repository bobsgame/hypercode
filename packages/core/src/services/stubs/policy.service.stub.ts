export interface Policy { }

export const policyService = {
    getPolicy: async (_policyId: string): Promise<any> => {
        return null;
    },
    evaluateAccess: (_policy: any, _toolName: string): boolean => {
        return true;
    }
};
