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
        <title>Beta AI-powered translator for Samoan and English.</title>
        <meta
          name="description"
          content="Beta AI-powered translator for Samoan and English."
        />
        <link rel="icon" href="/img/PBDE.png" />
      </Head>

      <SectionTitle
        pretitle="BETA"
        title="Samoan-English Translation. Powered By AI.">
      </SectionTitle>
      <Message
        translated="This is a beta version of the translator, experimenting with AI-powered processing."
        message="O se laasaga sili lea mo lenei meafaigaluega. O lo'o fa'aaogaina le Atamai Fa'amatalaga. E tele a matou galuega e fai, ae matou te faafetai atu mo le asiasi mai ma fesoasoani mai ia matou manuia.">
        </Message>
        <Suspense fallback="Loading...">
      <Translate />
      </Suspense>
      <Footer />
    </>
  );
}

export default Home;