
import { EventEmitter } from 'events';

export type SystemEventType =
    | 'agent:heartbeat'
    | 'agent:start'
    | 'agent:stop'
    | 'task:update'
    | 'task:complete'
    | 'tool:call'
    | 'memory:prune';

export interface SystemEvent {
    type: SystemEventType;
    timestamp: number;
    source: string; // Agent ID or Service Name
    payload: any;
}

export class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);
    }

    public emitEvent(type: SystemEventType, source: string, payload: any) {
        const event: SystemEvent = {
            type,
            timestamp: Date.now(),
            source,
            payload
        };
        this.emit('system_event', event);
        this.emit(type, event);
    }

    public onEvent(type: SystemEventType | 'system_event', listener: (event: SystemEvent) => void) {
        this.on(type, listener);
    }
}
