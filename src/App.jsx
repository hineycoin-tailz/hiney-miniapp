import React, { useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';

// ⬇️ PASTE YOUR HELIUS LINK INSIDE THESE QUOTES ⬇️
const HELIUS_RPC_URL = "https://mainnet.helius-rpc.com/?api-key=1d8e8a5c-20b5-44aa-8023-0c8173bd6e2d";

const HINEY_MINT_ADDRESS = "DDAjZFshfVvdRew1LjYSPMB3mgDD9vSW74eQouaJnray";

// --- DASHBOARD COMPONENT ---
const Dashboard = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [solBalance, setSolBalance] = useState(0);
  const [hineyBalance, setHineyBalance] = useState(0);
  const [status, setStatus] = useState("Initializing...");

  useEffect(() => {
    if (!connection || !publicKey) return;

    const fetchData = async () => {
      setStatus("Fetching balances...");
      try {
        // 1. Get SOL
        const sol = await connection.getBalance(publicKey);
        setSolBalance(sol / LAMPORTS_PER_SOL);

        // 2. Get HINEY
        const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(HINEY_MINT_ADDRESS)
        });

        if (accounts.value.length > 0) {
          const bal = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
          setHineyBalance(bal);
          setStatus("Data Loaded Successfully! ✅");
        } else {
          setHineyBalance(0);
          setStatus("Wallet connected (No Hiney found)");
        }
      } catch (e) {
        console.error(e);
        setStatus(`Error: ${e.message}`);
      }
    };

    fetchData();
  }, [connection, publicKey]);

  return (
    <div className="dashboard">
      <h2>🍑 Welcome to the Orchard! v2</h2>
      
      <div className="wallet-info">
        <p><strong>Connected:</strong></p>
        <p className="address">{publicKey.toBase58().substring(0, 6)}...{publicKey.toBase58().substring(38)}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>$HINEY Balance</h3>
          <p style={{color: '#FF8d01'}}>{hineyBalance.toLocaleString()} 🍑</p>
        </div>
        
        <div className="stat-card">
          <h3>SOL Balance</h3>
          <p>{solBalance.toFixed(4)} SOL</p> 
        </div>
      </div>

      <div style={{marginTop: '20px', fontSize: '0.8rem', color: '#888'}}>
        Status: {status}
      </div>
    </div>
  );
};

// --- MAIN CONTENT ---
const Content = () => {
  const { connected } = useWallet();

  if (connected) {
    return <Dashboard />;
  }

  return (
    <div className="app-container">
      <header>
        <h1>🍑 Hiney App</h1>
      </header>
      <div className="card">
         <p>Connect your wallet to enter the orchard.</p>
         <WalletMultiButton />
      </div>
    </div>
  );
};

// --- APP SETUP ---
function App() {
  const network = WalletAdapterNetwork.Mainnet;
  
  // Use the Helius URL defined at the top
  const endpoint = HELIUS_RPC_URL;

  const wallets = useMemo(
    () => [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
        // WalletConnect Adapter
        new WalletConnectWalletAdapter({
            network: WalletAdapterNetwork.Mainnet,
            options: {
                projectId: 'b8f2565edcd5053a25c9a117056f9f95',
            },
        }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Content />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
