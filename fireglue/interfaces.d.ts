import type { Packet, SocketBroadcastEvent, SocketUserJoinEvent, SocketUserLeaveEvent, SocketBlockUpdateEvent, SocketUserUpdateEvent } from "./socket.mjs"

export type PacketPredicate = (packet: Packet) => boolean;
export type PromiseResolve<T> = (value: T | PromiseLike<T>) => void;
export type PromiseReject = (reason?: any) => void

type MutableProperties = "copyWithin" | "fill" | "reverse" | "set" | "sort";

export interface ReadonlyUint8Array extends Omit<Uint8Array, MutableProperties> {
  readonly [n: number]: number;
}

export type SocketCtxEventEnum = 
    "message" | "userjoin" | "userleave" | "userupdate" | "blockupdate"

export interface SocketCtxEventMap {
    "message": SocketBroadcastEvent,
    "userjoin": SocketUserJoinEvent,
    "userleave": SocketUserLeaveEvent,
    "userupdate": SocketUserUpdateEvent,
    "blockupdate": SocketBlockUpdateEvent,
}

export interface SocketCtx {
    addEventListener<K extends keyof SocketCtxEventMap>(type: K, listener: (this: WebSocket, ev: SocketCtxEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof SocketCtxEventMap>(type: K, listener: (this: WebSocket, ev: SocketCtxEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
}