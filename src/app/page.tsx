import Navbar from "@/components/ui/Navbar/Navbar";
import Footer from "@/components/ui/Footer/Footer";
import Hero from "@/components/sections/Hero/Hero";
import About from "@/components/sections/About/About";
import Experience from "@/components/sections/Experience/Experience";
import Projects from "@/components/sections/Projects/Projects";
import Contact from "@/components/sections/Contact/Contact";

export default function Home() {
    return (
        <>
            <Navbar />
            <main id="main-content">
                <Hero />
                <About />
                <Experience />
                <Projects />
                <Contact />
            </main>
            <Footer />
        </>
    );
}
