import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import './styles/globals.css';
import './components/squid.css';

import Home from './pages/index';
import KeyPairGeneratorPage from './pages/keypair';
import SquidsWalletPage from './pages/squids-wallet';
import NetworkDiscoveryPage from './pages/network-discovery';
import ConnectWalletPage from './pages/connect';
import DexDemoPage from './pages/dex-demo';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/keypair" element={<KeyPairGeneratorPage />} />
        <Route path="/squids-wallet" element={<SquidsWalletPage />} />
        <Route path="/network-discovery" element={<NetworkDiscoveryPage />} />
        <Route path="/connect" element={<ConnectWalletPage />} />
        <Route path="/dex-demo" element={<DexDemoPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
