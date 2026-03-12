import { createAccessControl } from "../../src/core/accessControl";

describe("createAccessControl", () => {
  it("should allow all peers when list is empty", () => {
    const ac = createAccessControl({ allowedPeerList: [] });

    expect(ac.isAllowedPeer("123")).toBe(true);
    expect(ac.isAllowedPeer("456")).toBe(true);
  });

  it("should allow only listed peers", () => {
    const ac = createAccessControl({ allowedPeerList: ["123", "456"] });

    expect(ac.isAllowedPeer("123")).toBe(true);
    expect(ac.isAllowedPeer("456")).toBe(true);
    expect(ac.isAllowedPeer("789")).toBe(false);
  });

  it("should add peers dynamically", () => {
    const ac = createAccessControl({ allowedPeerList: ["123"] });

    expect(ac.isAllowedPeer("456")).toBe(false);

    ac.addPeer("456");

    expect(ac.isAllowedPeer("456")).toBe(true);
  });

  it("should remove peers dynamically", () => {
    const ac = createAccessControl({ allowedPeerList: ["123", "456"] });

    ac.removePeer("456");

    expect(ac.isAllowedPeer("456")).toBe(false);
    expect(ac.isAllowedPeer("123")).toBe(true);
  });
});
