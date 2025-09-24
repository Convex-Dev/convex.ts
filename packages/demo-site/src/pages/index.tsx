import React from "react";
import DemoCard from "../components/DemoCard";
import Button from "../components/Button";

export default function Home() {

  return (
    <div className="container">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="mb-4">Convex Crypto Demo</h1>
          <p className="text-secondary text-lg max-w-2xl">
            Experience the power of the Convex DLT network with our TypeScript client library.
            Generate cryptographic key pairs and explore blockchain functionality.
          </p>
        </header>

        {/* Demos */}
        <div className="card card-static w-full">
          <h3 className="text-lg mb-4">Demos</h3>
          <div className="demo-grid">
            <DemoCard
              href="/keypair"
              title="Keyring"
              description="Manage keys: generate, store, unlock, remove"
              emoji="🔑"
            />
            <DemoCard
              href="/squids-wallet"
              title="Squids Wallet"
              description="Colourful children's currency interface"
              emoji="🐙"
            />
            <DemoCard
              href="/network-discovery"
              title="Network Discovery"
              description="Discover and switch between Convex networks"
              emoji="🌐"
            />
            <DemoCard
              href="/connect"
              title="DEX Demo"
              description="Prototype decentralized exchange experience"
              emoji="💱"
              onClick={(e) => {
                try {
                  const saved = localStorage.getItem('convex-recent-accounts');
                  const recent: number[] = saved ? JSON.parse(saved) : [];
                  if (Array.isArray(recent) && recent.length) {
                    e.preventDefault();
                    const acct = recent[0];
                    window.location.href = `/dex-demo?account=${acct}`;
                  }
                } catch {}
              }}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="card card-static w-full mt-8">
          <h3 className="text-lg mb-3">About Convex</h3>
          <div className="space-y-2 text-sm text-secondary">
            <p>
              Convex is a high-performance distributed ledger technology (DLT) that provides
              fast, secure, and globally scalable transactions.
            </p>
            <p>
              This demo showcases the TypeScript client library for interacting with the
              Convex network, including cryptographic operations and transaction management.
            </p>
            <div className="flex items-center" style={{ gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => window.open('https://convex.world', '_blank')}>🌐 Convex</Button>
              <Button variant="secondary" onClick={() => window.open('https://docs.convex.world', '_blank')}>📚 Docs</Button>
              <Button variant="secondary" onClick={() => window.open('https://github.com/Convex-Dev', '_blank')}>💻 GitHub Org</Button>
              <Button variant="secondary" onClick={() => window.open('https://discord.com/invite/xfYGq4CT7v', '_blank')}>💬 Discord</Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-secondary text-sm">
          <p>
            Built with the  <a href="https://github.com/Convex-Dev/convex.ts" className="text-primary hover:underline" target="_blank" rel="noreferrer">Convex TypeScript Client</a>
          </p>
        </footer>
      </div>
    </div>
  );
} 