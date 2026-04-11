import React from "react";
import SquidWallet from "../components/SquidWallet";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function SquidsWalletPage() {
  useDocumentTitle("Squids Wallet - Kids Currency");
  return <SquidWallet />;
}
