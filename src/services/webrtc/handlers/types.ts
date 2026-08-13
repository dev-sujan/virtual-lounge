import type { DataConnection } from 'peerjs';

export interface SyncMessageContext {
  peerService: any; // PeerService reference for relay/broadcast
  conn?: DataConnection;
}

export type SyncMessageHandler = (
  payload: any,
  senderId: string,
  ctx: SyncMessageContext
) => void | Promise<void>;
