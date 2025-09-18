import React, { useState } from "react";
import { NetworkSelector, NetworkConfig } from "@convex-world/convex-react";

interface Transaction {
  id: number;
  type: "earned" | "spent";
  amount: number;
  description: string;
  date: string;
  color: string;
}

interface SquidWalletProps {
  initialBalance?: number;
  initialTransactions?: Transaction[];
}

export default function SquidWallet({ 
  initialBalance = 1250, 
  initialTransactions = [
    { id: 1, type: "earned", amount: 50, description: "Completed homework", date: "15 Jan 2024", color: "bg-green-400" },
    { id: 2, type: "spent", amount: -25, description: "Bought stickers", date: "14 Jan 2024", color: "bg-pink-400" },
    { id: 3, type: "earned", amount: 100, description: "Helped with chores", date: "13 Jan 2024", color: "bg-blue-400" },
    { id: 4, type: "spent", amount: -75, description: "Movie tickets", date: "12 Jan 2024", color: "bg-purple-400" },
  ]
}: SquidWalletProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [transactions] = useState<Transaction[]>(initialTransactions);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkConfig | null>(null);

  const handleAddMoney = () => {
    if (newAmount && !isNaN(Number(newAmount))) {
      setBalance(balance + Number(newAmount));
      setNewAmount("");
      setShowAddMoney(false);
    }
  };

  const handleNetworkChange = (config: NetworkConfig) => {
    setSelectedNetwork(config);
    console.log('Squids wallet connected to:', config.name, config.hostname);
  };

  return (
    <div className="squid-wallet">
      {/* Floating Bubbles Background */}
      <div className="squid-bubbles">
        <div className="squid-bubble"></div>
        <div className="squid-bubble"></div>
        <div className="squid-bubble"></div>
        <div className="squid-bubble"></div>
      </div>

      <div className="container mx-auto px-4 py-8 squid-content">
        {/* Network Selector - Positioned on the right side */}
        <div className="absolute top-4 right-4 z-20">
          <NetworkSelector
            onNetworkChange={handleNetworkChange}
            placeholder="🌐 Network"
            maxHistory={3}
            style={{
              opacity: 0.8,
              transition: 'opacity 0.3s ease',
            }}
            onMouseEnter={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (e.currentTarget instanceof HTMLElement) {
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            buttonStyle={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              borderRadius: '20px',
              padding: '6px 12px',
              fontSize: '12px',
              minWidth: '120px',
              transition: 'all 0.3s ease',
            }}
            dropdownStyle={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="squid-header">
            <span className="text-4xl mr-3">🐙</span>
            <h1 className="text-3xl font-bold text-white">Squids Wallet</h1>
          </div>
        </div>

        {/* Main Wallet Card */}
        <div className="max-w-md mx-auto mb-8">
          <div className="squid-card">
            {/* Balance Display */}
            <div className="text-center mb-6">
              <p className="text-white/80 text-sm mb-2">Your Balance</p>
              <div className="squid-balance mb-2">
                {balance.toLocaleString()} 🐙
              </div>
              <p className="text-white/70 text-sm">Squids Coins</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setShowAddMoney(true)}
                className="squid-btn add-money"
              >
                💰 Add Money
              </button>
              <button className="squid-btn send-gift">
                🎁 Send Gift
              </button>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="max-w-4xl mx-auto">
          <div className="squid-card">
            <h2 className="text-white font-bold text-xl mb-6 flex items-center">
              📊 Recent Activity
            </h2>
            
            <div className="overflow-x-auto">
              <table className="squid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <div className={`squid-icon ${transaction.type}`}>
                          <span>
                            {transaction.type === "earned" ? "💰" : "🛍️"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{transaction.description}</div>
                      </td>
                      <td className="text-white/70">
                        {transaction.date}
                      </td>
                      <td className={`text-right font-bold text-lg squid-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} 🐙
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <a 
            href="/"
            className="squid-back-btn"
          >
            <span className="mr-2">🏠</span>
            Back to Home
          </a>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="squid-modal">
          <div className="squid-modal-content">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Add Squids! 🐙</h3>
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Enter amount..."
              className="squid-modal-input"
            />
            <div className="squid-modal-buttons">
              <button
                onClick={() => setShowAddMoney(false)}
                className="squid-modal-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                className="squid-modal-btn add"
              >
                Add Money
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 