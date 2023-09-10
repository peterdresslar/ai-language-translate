'use client';
import Head from "next/head";
import SectionTitle from "../components/sectionTitle";

import Translate from "../components/translate";
import Footer from "../components/footer";
import Message from "../components/message";
import { Suspense } from "react";

const Home = () => {
  return (
    <>
      <Head>
        <title>Experimental AI Translator</title>
        <meta
          name="description"
          content="Experimental AI-powered translator for Samoan, Chamorro, and other Pacific Languages."
        />
        <link rel="icon" href="/img/PBDE.png" />
      </Head>

      <SectionTitle
        pretitle="BETA"
        title="AI Language Translator">
      </SectionTitle>
      <Message
        translated="This is an experimental translator app powered by AI. Results may vary widely, but your feedback is very helpful!"
        moreMessage="Este i tinige' na traduksion lenguahi; risetia kumekeilek-na usa AI. Si Yu'us Ma'ase para i finatinas-mu."
        message="O le fa'aliliuga gagana fa'ata'ita'i lea; su'esu'e pe fa'afefea ona fa'aoga ma AI. Fa'afetai mo le taumafai.">
        </Message>
        <Suspense fallback="Loading...">
      <Translate />
      </Suspense>
      <Footer />
    </>
  );
}

export default Home;