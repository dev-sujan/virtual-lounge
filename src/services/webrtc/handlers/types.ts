import type { DataConnection } from 'peerjs';

export interface SyncMessageContext {
  peerService: any; // PeerService reference for relay/broadcast
  conn?: DataConnection;
  sourcePeerId?: string; // PeerJS peer ID of the DataConnection that delivered this message
}

export type SyncMessageHandler = (
  payload: any,
  senderId: string,
  ctx: SyncMessageContext
) => void | Promise<void>;
