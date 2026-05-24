import React from "react";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

// Load configuration securely from environment variables with safe hardcoded fullnode fallbacks
const testnetUrl = import.meta.env.VITE_SUI_TESTNET_RPC || "https://fullnode.testnet.sui.io:443";
const mainnetUrl = import.meta.env.VITE_SUI_MAINNET_RPC || "https://fullnode.mainnet.sui.io:443";
const devnetUrl = import.meta.env.VITE_SUI_DEVNET_RPC || "https://fullnode.devnet.sui.io:443";
const defaultNetwork = (import.meta.env.VITE_SUI_DEFAULT_NETWORK || "testnet") as "testnet" | "mainnet" | "devnet";

const { networkConfig } = createNetworkConfig({
  testnet: {
    url: testnetUrl,
    network: "testnet"
  },
  mainnet: {
    url: mainnetUrl,
    network: "mainnet"
  },
  devnet: {
    url: devnetUrl,
    network: "devnet"
  }
});

const queryClient = new QueryClient();

interface SuiWalletProviderProps {
  children: React.ReactNode;
}

export const SuiWalletProvider: React.FC<SuiWalletProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
