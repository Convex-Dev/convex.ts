import React, { useState } from "react";
import Head from "next/head";
import { NetworkSelector, NetworkConfig } from "@convex-world/convex-react";

export default function NetworkDiscoveryPage() {
  const [selected, setSelected] = useState<NetworkConfig | null>(null);

  return (
    <>
      <Head>
        <title>Network Discovery - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* Header */}
          <header className="text-center mb-8 fade-in">
            <h1 className="mb-4">Network Discovery</h1>
            <p className="text-secondary text-lg max-w-2xl">
              Discover, add, and switch between Convex networks. Your recent networks are remembered for quick access.
            </p>
          </header>

          {/* Discovery Card */}
          <div className="card w-full max-w-2xl fade-in">
            <div className="mb-6">
              <h2 className="mb-2">Select a Network</h2>
              <p className="text-secondary">Pick from known networks or add a custom one.</p>
            </div>
            <div className="flex justify-start mb-6">
              <NetworkSelector
                onNetworkChange={(cfg) => setSelected(cfg)}
                placeholder="🌐 Choose network"
                maxHistory={5}
              />
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg mb-3">Selected Network</h3>
              {selected ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <div className="text-sm text-secondary mb-1">Name</div>
                    <div className="text-primary font-semibold">{selected.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-secondary mb-1">Hostname</div>
                    <div className="font-semibold">{selected.hostname}</div>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">No network selected yet.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center mt-8 text-secondary text-sm">
            <a href="/" className="btn btn-secondary">← Back to Home</a>
          </footer>
        </div>
      </div>
    </>
  );
}


