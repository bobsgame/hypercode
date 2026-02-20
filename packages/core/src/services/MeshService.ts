
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';
import { EventEmitter } from 'events';
import crypto from 'crypto';

import { SwarmMessage, SwarmMessageType } from '../mesh/SwarmProtocol.js';

interface PeerMessage extends SwarmMessage { }

interface SwarmSocket {
    write(data: string): boolean;
    on(event: 'data', listener: (data: Buffer) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
}

interface SwarmConnectionInfo {
    publicKey: Uint8Array;
}

interface SwarmInstance {
    keyPair: { publicKey: Uint8Array };
    on(event: 'connection', listener: (socket: SwarmSocket, info: SwarmConnectionInfo) => void): void;
    join(topic: Buffer): void;
    destroy(): Promise<void>;
}

interface PendingRequest {
    resolve: (value: PeerMessage) => void;
    reject: (reason?: unknown) => void;
    timeout: NodeJS.Timeout;
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isPeerMessage(value: unknown): value is PeerMessage {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const message = value as Record<string, unknown>;
    return (
        typeof message.id === 'string' &&
        typeof message.type === 'string' &&
        typeof message.sender === 'string' &&
        typeof message.timestamp === 'number'
    );
}

export class MeshService extends EventEmitter {
    private swarm: SwarmInstance;
    private topic: Buffer;
    private peers: Map<string, SwarmSocket> = new Map();
    private pendingRequests: Map<string, PendingRequest> = new Map();
    public nodeId: string;

    constructor() {
        super();
        this.swarm = new Hyperswarm() as unknown as SwarmInstance;
        // Use Public Key as Node ID for consistent addressing
        this.nodeId = b4a.toString(this.swarm.keyPair.publicKey, 'hex');

        // Topic: "borg-swarm-v1" hashed
        const topicStr = 'borg-swarm-v1';
        this.topic = b4a.from(crypto.createHash('sha256').update(topicStr).digest());

        this.initialize();
    }

    private initialize() {
        this.swarm.on('connection', (socket, info) => {
            const peerId = b4a.toString(info.publicKey, 'hex');
            console.log(`[MeshService] 🔗 New connection from peer: ${peerId.slice(0, 8)}...`);

            this.peers.set(peerId, socket);
            this.emit('peer:connect', peerId);

            socket.on('data', (data: Buffer) => {
                try {
                    const parsed: unknown = JSON.parse(data.toString());
                    if (!isPeerMessage(parsed)) {
                        console.warn('[MeshService] Ignoring malformed peer message payload.');
                        return;
                    }
                    const msg: PeerMessage = parsed;

                    // Handle RPC Responses
                    if (this.pendingRequests.has(msg.id)) {
                        const req = this.pendingRequests.get(msg.id);
                        if (req) {
                            clearTimeout(req.timeout);
                            this.pendingRequests.delete(msg.id);
                            req.resolve(msg);
                            return; // Don't emit generic message event for RPC responses
                        }
                    }

                    this.emit('message', msg);
                } catch (e: unknown) {
                    console.error('[MeshService] Failed to parse message:', getErrorMessage(e));
                }
            });

            socket.on('close', () => {
                console.log(`[MeshService] 🔌 Peer disconnected: ${peerId.slice(0, 8)}...`);
                this.peers.delete(peerId);
                this.emit('peer:disconnect', peerId);
            });

            socket.on('error', (err: Error) => {
                console.error(`[MeshService] Socket error with ${peerId.slice(0, 8)}:`, err.message);
            });
        });

        // Join the swarm
        this.swarm.join(this.topic);
        console.log(`[MeshService] 🕸️ Joined swarm topic: borg-swarm-v1 (Node ID: ${this.nodeId})`);
    }

    public broadcast(type: SwarmMessageType, payload: unknown) {
        const msg: PeerMessage = {
            id: crypto.randomUUID(),
            type,
            payload,
            sender: this.nodeId,
            timestamp: Date.now()
        };
        const data = JSON.stringify(msg);

        let sentCount = 0;
        for (const socket of this.peers.values()) {
            socket.write(data);
            sentCount++;
        }
        console.log(`[MeshService] 📡 Broadcasted '${type}' to ${sentCount} peers.`);
    }

    public sendDirect(peerId: string, type: SwarmMessageType, payload: unknown) {
        const socket = this.peers.get(peerId);
        if (!socket) {
            console.warn(`[MeshService] ⚠️ Cannot send to ${peerId} (Not connected)`);
            return false;
        }

        const msg: PeerMessage = {
            id: crypto.randomUUID(),
            type,
            payload,
            sender: this.nodeId,
            target: peerId,
            timestamp: Date.now()
        };
        socket.write(JSON.stringify(msg));
        return true;
    }

    public request(peerId: string, type: SwarmMessageType, payload: unknown, timeoutMs: number = 10000): Promise<PeerMessage> {
        return new Promise((resolve, reject) => {
            if (!this.peers.has(peerId)) {
                return reject(new Error(`Peer ${peerId} not connected`));
            }

            const id = crypto.randomUUID();
            const msg: PeerMessage = {
                id,
                type,
                payload,
                sender: this.nodeId,
                target: peerId,
                timestamp: Date.now()
            };

            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request ${id} timed out`));
                }
            }, timeoutMs);

            this.pendingRequests.set(id, { resolve, reject, timeout });

            const socket = this.peers.get(peerId);
            if (!socket) {
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                reject(new Error(`Peer ${peerId} disconnected before request send`));
                return;
            }
            socket.write(JSON.stringify(msg));
        });
    }



    public sendResponse(originalMsg: PeerMessage, type: SwarmMessageType, payload: unknown) {
        const socket = this.peers.get(originalMsg.sender);
        if (!socket) {
            console.warn(`[MeshService] ⚠️ Cannot reply to ${originalMsg.sender} (Not connected)`);
            return false;
        }

        const msg: PeerMessage = {
            id: originalMsg.id,
            type,
            payload,
            sender: this.nodeId,
            target: originalMsg.sender,
            timestamp: Date.now()
        };
        socket.write(JSON.stringify(msg));
        return true;
    }

    public getPeerIds(): string[] {
        return Array.from(this.peers.keys());
    }

    public getStatus(): { nodeId: string; peerCount: number; peerIds: string[] } {
        const peerIds = this.getPeerIds();
        return {
            nodeId: this.nodeId,
            peerCount: peerIds.length,
            peerIds,
        };
    }

    public async destroy() {
        console.log(`[MeshService] 🛑 Destroying node ${this.nodeId.slice(0, 8)}...`);
        // destroy swarm
        await this.swarm.destroy();
        this.peers.clear();
        this.emit('close');
    }
}
