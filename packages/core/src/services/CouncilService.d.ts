export interface Opinion {
    agentId: string;
    content: string;
    timestamp: number;
    round: number;
}
export interface Vote {
    agentId: string;
    choice: string;
    reason: string;
    timestamp: number;
}
export interface CouncilSession {
    id: string;
    topic: string;
    status: 'active' | 'concluded';
    round: number;
    opinions: Opinion[];
    votes: Vote[];
    createdAt: number;
}
export declare class CouncilService {
    private sessions;
    constructor();
    startSession(topic: string): CouncilSession;
    getSession(id: string): CouncilSession | undefined;
    listSessions(): CouncilSession[];
    submitOpinion(sessionId: string, agentId: string, content: string): void;
    advanceRound(sessionId: string): void;
    castVote(sessionId: string, agentId: string, choice: string, reason: string): void;
    concludeSession(sessionId: string): void;
}
