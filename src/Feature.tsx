import { useEffect, useMemo, useState } from "react";
import type { MeshConfig, YRoom } from "@baditaflorin/mesh-common";

type Props = { room: YRoom | null; config: MeshConfig };

type Hand = {
  name: string;
  raised: boolean;
  raisedAt: number;
};

const NAME_KEY = (prefix: string) => `${prefix}:displayName`;

export function Feature({ room, config }: Props) {
  if (!room) {
    return (
      <div className="soh-screen">
        <h1>show of hands</h1>
        <p className="soh-status">Connecting…</p>
      </div>
    );
  }
  return <Body room={room} config={config} />;
}

function Body({ room, config }: { room: YRoom; config: MeshConfig }) {
  const [name, setName] = useState(
    () => localStorage.getItem(NAME_KEY(config.storagePrefix)) ?? "",
  );
  const [, rerender] = useState(0);

  useEffect(() => {
    if (name) localStorage.setItem(NAME_KEY(config.storagePrefix), name);
  }, [name, config.storagePrefix]);

  useEffect(() => {
    const hands = room.doc.getMap<Hand>("hands");
    const onChange = () => rerender((n) => n + 1);
    hands.observe(onChange);
    return () => hands.unobserve(onChange);
  }, [room]);

  const hands = room.doc.getMap<Hand>("hands");
  const me = hands.get(room.peerId);
  const trimmed = name.trim();

  const raisedList = useMemo(() => {
    const arr: Array<Hand & { id: string }> = [];
    hands.forEach((v, k) => {
      if (v.raised) arr.push({ ...v, id: k });
    });
    arr.sort((a, b) => a.raisedAt - b.raisedAt);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, hands.size, me?.raised, me?.raisedAt]);

  const raise = () => {
    if (!trimmed) return;
    hands.set(room.peerId, { name: trimmed, raised: true, raisedAt: Date.now() });
  };

  const lower = () => {
    const cur = hands.get(room.peerId);
    if (!cur) return;
    hands.set(room.peerId, { ...cur, raised: false, raisedAt: 0 });
  };

  const allClear = () => {
    room.doc.transact(() => {
      hands.forEach((v, k) => {
        if (v.raised) hands.set(k, { ...v, raised: false, raisedAt: 0 });
      });
    });
  };

  const amRaised = !!me?.raised;
  const raisedCount = raisedList.length;
  const inRoom = room.peerCount + 1;

  return (
    <div className="soh-screen">
      <header className="soh-header">
        <h1>show of hands</h1>
        <p className="soh-status">
          {raisedCount} {raisedCount === 1 ? "hand up" : "hands up"} · {inRoom} present
        </p>
      </header>

      <div className="soh-name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name"
          maxLength={48}
          aria-label="your name"
        />
      </div>

      <div className="soh-action">
        {amRaised ? (
          <button type="button" className="soh-toggle is-raised" onClick={lower}>
            ✋ lower hand
          </button>
        ) : (
          <button type="button" className="soh-toggle" onClick={raise} disabled={!trimmed}>
            ✋ raise hand
          </button>
        )}
      </div>

      <section className="soh-list-wrap">
        <h2 className="soh-list-title">raised, in order</h2>
        {raisedList.length === 0 ? (
          <p className="soh-empty">no hands raised</p>
        ) : (
          <ol className="soh-list">
            {raisedList.map((h, i) => (
              <li key={h.id} className={`soh-entry ${h.id === room.peerId ? "is-me" : ""}`}>
                <span className="soh-pos">{i + 1}.</span>
                <span className="soh-name-label">{h.name}</span>
                <span className="soh-time">{new Date(h.raisedAt).toLocaleTimeString()}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <button type="button" className="soh-clear" onClick={allClear} disabled={raisedCount === 0}>
        all clear
      </button>
    </div>
  );
}
