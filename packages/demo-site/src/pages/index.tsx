import React, { useState } from "react";
import { generateKeyPair, bytesToHex } from "@convex-world/convex-client";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="container">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <header className="text-center mb-8 fade-in">
          <h1 className="mb-4">Convex Crypto Demo</h1>
          <p className="text-secondary text-lg max-w-2xl">
            Experience the power of the Convex DLT network with our TypeScript client library.
            Generate cryptographic key pairs and explore blockchain functionality.
          </p>
        </header>

        {/* Main Demo Card */}
        <div className="card w-full max-w-2xl fade-in">
          <div className="text-center mb-6">
            <h2 className="mb-2">Key Pair Generator</h2>
            <p className="text-secondary">
              Generate a new cryptographic key pair for secure blockchain transactions
            </p>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center mb-6">
            <button 
              onClick={handleGenerate} 
              disabled={loading}
              className={`btn btn-primary ${loading ? 'pulse' : ''}`}
            >
              {loading ? "Generating Key Pair..." : "Generate New Key Pair"}
            </button>
          </div>

          {/* Results */}
          {publicKey && privateKey && (
            <div className="space-y-4 fade-in">
              {/* Public Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary">Public Key</label>
                <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center justify-between">
                  <code className="text-primary break-all flex-1 mr-3">{publicKey}</code>
                  <button 
                    onClick={() => copyToClipboard(publicKey)}
                    className="copy-btn flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>

              {/* Private Key */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-secondary">Private Key</label>
                <div className="bg-surface-light border border-border rounded-lg p-3 flex items-center justify-between">
                  <code className="text-warning break-all flex-1 mr-3">{privateKey}</code>
                  <button 
                    onClick={() => copyToClipboard(privateKey)}
                    className="copy-btn flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    <span className="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
                <p className="text-xs text-muted">
                  ⚠️ Keep your private key secure and never share it with anyone
                </p>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-lg mb-3">About Convex</h3>
            <div className="space-y-2 text-sm text-secondary">
              <p>
                Convex is a high-performance distributed ledger technology (DLT) that provides
                fast, secure, and scalable blockchain solutions.
              </p>
              <p>
                This demo showcases the TypeScript client library for interacting with the
                Convex network, including cryptographic operations and transaction management.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-secondary text-sm">
          <p>
            Built with <span className="text-primary">Next.js</span> and{" "}
            <span className="text-primary">Convex TypeScript Client</span>
          </p>
        </footer>
      </div>
    </div>
  );
} 