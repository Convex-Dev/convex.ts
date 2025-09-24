import React, { useEffect, useState } from "react";
import Head from "next/head";
import Button from "../components/Button";

export default function ConnectWalletPage() {
  const [accountInput, setAccountInput] = useState<string>("");
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(/^#?\d+$/.test(accountInput));
  }, [accountInput]);

  const go = () => {
    const n = parseInt(accountInput.replace('#', ''), 10);
    if (!isNaN(n)) {
      window.location.href = `/dex-demo?account=${n}`;
    }
  };

  return (
    <>
      <Head>
        <title>Connect Wallet - Convex</title>
      </Head>
      <div className="container">
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <header className="text-center mb-8">
            <h1 className="mb-4">Connect Wallet</h1>
            <p className="text-secondary">Enter your Convex account number to continue.</p>
          </header>

          <div className="card w-full max-w-sm">
            <div className="flex items-center" style={{ gap: 12 }}>
              <input
                type="text"
                className="input"
                placeholder="#123"
                inputMode="numeric"
                pattern="[0-9]*"
                value={accountInput}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9#]/g, '');
                  setAccountInput(v);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && isValid) go(); }}
                style={{ flex: 1 }}
              />
              <Button onClick={go} disabled={!isValid}>Continue</Button>
            </div>
          </div>

          <footer className="text-center mt-8 text-secondary text-sm">
            <Button variant="secondary" onClick={() => (window.location.href = "/")}>← Back to Home</Button>
          </footer>
        </div>
      </div>
    </>
  );
}


