"use client";

import Navbar from "@/components/ui/Navbar/Navbar";
import Footer from "@/components/ui/Footer/Footer";
import Chatbot from "@/components/ui/Chatbot/Chatbot";
import ProgressThread from "@/components/ui/ProgressThread/ProgressThread";
import Hero from "@/components/sections/Hero/Hero";
import About from "@/components/sections/About/About";
import Experience from "@/components/sections/Experience/Experience";
import Projects from "@/components/sections/Projects/Projects";
import Contact from "@/components/sections/Contact/Contact";
import { PortfolioProvider } from "@/components/PortfolioProvider";
import type { PublicContentResponse } from "@/content/portfolio";

export default function PortfolioApp({ snapshot }: { snapshot: PublicContentResponse }) {
    return (
        <PortfolioProvider initialSnapshot={snapshot}>
            <Navbar />
            <ProgressThread />
            <main id="main-content">
                <Hero />
                <About />
                <Experience />
                <Projects />
                <Contact />
            </main>
            <Footer />
            <Chatbot />
        </PortfolioProvider>
    );
}

