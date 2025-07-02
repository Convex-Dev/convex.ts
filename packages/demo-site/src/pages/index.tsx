import React, { useState } from "react";
import { generateKeyPair, bytesToHex } from "@convex-world/convex-client";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const keyPair = await generateKeyPair();
    setPublicKey(bytesToHex(keyPair.publicKey));
    setPrivateKey(bytesToHex(keyPair.privateKey));
    setLoading(false);
  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Hello, World!</h1>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Key Pair"}
      </button>
      {publicKey && privateKey && (
        <div style={{ marginTop: 24 }}>
          <div><strong>Public Key:</strong> <code>{publicKey}</code></div>
          <div><strong>Private Key:</strong> <code>{privateKey}</code></div>
        </div>
      )}
    </div>
  );
} 