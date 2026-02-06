import { v4 as uuidv4 } from 'uuid';
export class CouncilService {
    constructor() {
        this.sessions = new Map();
    }
    startSession(topic) {
        const id = uuidv4();
        const session = {
            id,
            topic,
            status: 'active',
            round: 1,
            opinions: [],
            votes: [],
            createdAt: Date.now()
        };
        this.sessions.set(id, session);
        return session;
    }
    getSession(id) {
        return this.sessions.get(id);
    }
    listSessions() {
        return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
    }
    submitOpinion(sessionId, agentId, content) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Council Session ${sessionId} not found`);
        if (session.status !== 'active')
            throw new Error(`Council Session ${sessionId} is concluded`);
        session.opinions.push({
            agentId,
            content,
            timestamp: Date.now(),
            round: session.round
        });
    }
    advanceRound(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Council Session ${sessionId} not found`);
        session.round++;
    }
    castVote(sessionId, agentId, choice, reason) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Council Session ${sessionId} not found`);
        if (session.status !== 'active')
            throw new Error(`Council Session ${sessionId} is concluded`);
        session.votes.push({
            agentId,
            choice,
            reason,
            timestamp: Date.now()
        });
    }
    concludeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Council Session ${sessionId} not found`);
        session.status = 'concluded';
    }
}
