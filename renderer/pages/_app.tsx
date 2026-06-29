import type { AppProps } from 'next/app';

import Layout from '@/components/Layout';

import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
};