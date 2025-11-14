// components/AboutUs.tsx
import React, { useEffect, useState } from "react";
import DeveloperCard from "./DeveloperCard";
import "./styles/AboutUs.css";
import { useTranslation } from "../contexts/TranslationContext";
import srishtiImg from '../images/srishti.png'
import anshuImg from '../images/anshu.png'
import shubhamImg from '../images/shubham.png'
import TrueFocus from './styles/TrueFocus'; 
import DecryptedText from './styles/DecryptedText.tsx';
import DotGrid from './styles/dots.tsx';

// Personal Details
const developers = [
  {
    name: "Srishti Ahuja",
    img: srishtiImg,
    quote:
      "Blending AI and law, I build tools that simplify legal complexities — from document analyzers to scam-detection solutions.",
    
    linkedin: "https://www.linkedin.com/in/srishti-ahuja-b7834928b/",
    instagram: "https://www.instagram.com/srishti_ahuja14/",
  },
  {
    name: "Ansh Sharma",
    img: anshuImg,
    quote:
      "Building AI that doesn’t just answer — it understands your language, your rights, your reality.",
    linkedin: "https://www.linkedin.com/in/ansh-sharma-36a936143/",
    instagram: "https://www.instagram.com/ansh.sha.rma/",
  },
  {
    name: "Shubham Garg",
    img: shubhamImg,
    quote:
      "Making legal help as easy as chatting with a friend — that’s the dream I’m coding into reality.",
    
    linkedin: "https://www.linkedin.com/in/real-shubham-garg",
    instagram: "https://www.instagram.com/gargshubham2411/",
  },
];

const AboutUs = () => {
  const [visible, setVisible] = useState(false);
  const { t, language } = useTranslation();

  // State for translated strings
  const [translated, setTranslated] = useState({
    tagline: "",
    description: "",
    quotes: developers.map(() => ""),
  });

  useEffect(() => {
    const handleScroll = () => {
      const section = document.querySelector(".meet-developer");
      if (
        section &&
        section.getBoundingClientRect().top < window.innerHeight * 0.85
      ) {
        setVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Translate all text when language changes
  useEffect(() => {
    const translateAll = async () => {
      const tagline = await t("Meet the developers");
      const description = await t(
        "We’re not just building tools — we’re shaping the future of legal empowerment. With AI-driven clarity and multilingual support, we make justice more accessible."
      );
      const quotes = await Promise.all(developers.map((dev) => t(dev.quote)));
      setTranslated({ tagline, description, quotes });
    };
    translateAll();
  }, [language, t]);

  return (

    
    <section className={`meet-developer ${visible ? "show" : ""}`}>
      {/* DotGrid background */}
      <div style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <DotGrid
          dotSize={5}
          gap={10}
          baseColor="#c2b8ec"
          activeColor="#5227FF"
          proximity={100}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={.5}
        />
      </div>


    <div className="description_2"><TrueFocus 
    sentence={translated.tagline}
    manualMode={false}
    blurAmount={10}
    borderColor="#8871ec"
    animationDuration={.5}
    pauseBetweenAnimations={.5}
    /></div>
    <br />

      <div className="description">
        <DecryptedText
        text={translated.description}
        speed={100}
        maxIterations={30}
        characters="ABCDEF"
        className="revealed"
        parentClassName="all-letters"
        encryptedClassName="encrypted"
        animateOn="view"
        revealDirection="start"
      />
      </div>
      
      <div className="developer-cards-container">
        {developers.map((dev, index) => (
          <DeveloperCard
            key={index}
            {...dev}
            quote={translated.quotes[index]}
          />
        ))}
      </div>
    </section>
  );
};

export default AboutUs;
