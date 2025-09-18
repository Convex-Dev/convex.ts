import type { AppProps } from 'next/app'
import '../styles/globals.css'
import '../components/squid.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
} 