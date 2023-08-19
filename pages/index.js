import Head from "next/head";
import Hero from "../components/hero";
import Navbar from "../components/navbar";
import SectionTitle from "../components/sectionTitle";

import { benefitOne, benefitTwo } from "../components/data";
import Video from "../components/video";
import Benefits from "../components/benefits";
import Translate from "../components/translate";
import Footer from "../components/footer";
import Message from "../components/message";
import Testimonials from "../components/testimonials";
import Cta from "../components/cta";
import Faq from "../components/faq";
import PopupWidget from "../components/popupWidget";

const Home = () => {
  return (
    <>
      <Head>
        <title>Nextly - Free Nextjs & TailwindCSS Landing Page Template</title>
        <meta
          name="description"
          content="Beta AI-powered translator for Samoan and English."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <SectionTitle
        pretitle="BETA"
        title="Samoan-English Translation. Powered By AI.">
      </SectionTitle>
      <Message
        translated="This is a beta version of the translator, experimenting with AI-powered processing."
        message="O lea o se faʻamatalaga beta o le faʻamatalaga. Faʻamolemole faʻamatalaina uma o faʻamaumauga i le faʻataʻitaʻiga.">
        </Message>
      <Translate />
      <Footer />
    </>
  );
}

export default Home;