import type {
  CreateAccessControlArgs,
  AccessControl,
} from "../types/bot.types";

const createAccessControl = ({
  allowedPeerList,
}: CreateAccessControlArgs): AccessControl => {
  const peerSet = new Set(allowedPeerList);

  const isAllowedPeer = (peer: string): boolean => {
    if (peerSet.size === 0) {
      return true;
    }

    return peerSet.has(peer);
  };

  const addPeer = (peer: string): void => {
    peerSet.add(peer);
  };

  const removePeer = (peer: string): void => {
    peerSet.delete(peer);
  };

  return { isAllowedPeer, addPeer, removePeer };
};

export { createAccessControl };
