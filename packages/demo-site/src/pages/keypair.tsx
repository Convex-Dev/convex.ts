import React, { useState } from "react";
import Head from "next/head";
import { Identicon } from "@convex-world/convex-react";
import { generateKeyPair, bytesToHex } from "@convex-world/convex-client";

export default function KeyPairGeneratorPage() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const keyPair = await generateKeyPair();
      setPublicKey(bytesToHex(keyPair.publicKey));
      setPrivateKey(bytesToHex(keyPair.privateKey));
    } catch (error) {
      console.error('Error generating key pair:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <Head>
        <title>Key Pair Generator - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* Header */}
          <header className="text-center mb-8 fade-in">
            <h1 className="mb-4">Key Pair Generator</h1>
            <p className="text-secondary text-lg max-w-2xl">
              Generate cryptographic key pairs for use on the Convex network.
            </p>
          </header>

          {/* Generator */}
          <div className="card w-full max-w-2xl fade-in">
            <div className="text-center mb-6">
              <h2 className="mb-2">Create New Keys</h2>
              <p className="text-secondary">Click to generate a new public/private key pair.</p>
            </div>

            <div className="flex justify-center mb-6">
              <button 
                onClick={handleGenerate} 
                disabled={loading}
                className={`btn btn-primary ${loading ? 'pulse' : ''}`}
              >
                {loading ? "Generating Key Pair..." : "Generate New Key Pair"}
              </button>
            </div>

            {publicKey && privateKey && (
              <div className="space-y-4 fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-secondary">Public Key</label>
                  <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center justify-between">
                    <code className="text-primary break-all flex-1 mr-3">{publicKey}</code>
                    {publicKey && (
                      <div className="flex items-center" style={{ gap: 8 }}>
                        <Identicon data={publicKey} size={7} pixelSize={6} />
                        <button 
                          onClick={() => copyToClipboard(publicKey)}
                          className="copy-btn flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          <span className="material-symbols-outlined">content_copy</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-secondary">Private Key</label>
                  <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center justify-between">
                    <code className="text-warning break-all flex-1 mr-3">{showPrivate ? privateKey : '•'.repeat(privateKey.length)}</code>
                    <div className="flex items-center" style={{ gap: 8 }}>
                      <button
                        onClick={() => setShowPrivate((v) => !v)}
                        className="copy-btn flex-shrink-0"
                        title={showPrivate ? "Hide private key" : "Show private key"}
                        aria-pressed={showPrivate}
                      >
                        <span className="material-symbols-outlined">{showPrivate ? 'visibility_off' : 'visibility'}</span>
                      </button>
                      <button 
                        onClick={() => copyToClipboard(privateKey)}
                        className="copy-btn flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted">
                    ⚠️ Keep your private key secure and never share it with anyone
                  </p>
                </div>
              </div>
            )}
          </div>

          <footer className="text-center mt-8 text-secondary text-sm">
            <a href="/" className="btn btn-secondary">← Back to Home</a>
          </footer>
        </div>
      </div>
    </>
  );
}


