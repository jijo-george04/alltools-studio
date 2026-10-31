import { useState } from "react";
import {
  ArrowRight, Image, FileImage, ScanLine, FileText,
  Menu, X, Search, ShieldCheck, Zap, Globe
} from "lucide-react";
import ImageConverter from "./ImageConverter.jsx";
import ImageCompressor from "./ImageCompressor.jsx";

const tools = [
  { name: "Image Converter", description: "Convert PNG, JPG and WebP images into different formats.", category: "Images", icon: FileImage, status: "Available", path: "/image-converter" },
  { name: "Image Compressor", description: "Reduce image file size while maintaining visual quality.", category: "Images", icon: Image, status: "Available", path: "/image-compressor" },
  { name: "Image Resizer", description: "Resize images to your preferred dimensions.", category: "Images", icon: ScanLine, status: "Coming Soon" },
  { name: "QR Code Generator", description: "Create QR codes for links, text and other information.", category: "Utilities", icon: ScanLine, status: "Coming Soon" },
  { name: "Word Counter", description: "Count words, characters and sentences instantly.", category: "Text", icon: FileText, status: "Coming Soon" },
  { name: "PDF Tools", description: "Simple tools to work with your PDF documents.", category: "Documents", icon: FileText, status: "Coming Soon" }
];

function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [mobileMenu, setMobileMenu] = useState(false);
  const categories = ["All", "Images", "Utilities", "Text", "Documents"];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch = `${tool.name} ${tool.description}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === "All" || tool.category === category);
  });

  return (
    <div className="site">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon"><Zap size={21} /></span>
          <span>AllTools<span className="brand-accent">Studio</span></span>
        </a>
        <button className="mobile-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">
          {mobileMenu ? <X /> : <Menu />}
        </button>
        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          <a href="#tools" onClick={() => setMobileMenu(false)}>Tools</a>
          <a href="#about" onClick={() => setMobileMenu(false)}>About</a>
          <a href="#footer" onClick={() => setMobileMenu(false)}>Contact</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow" />
          <div className="hero-content">
            <div className="hero-label"><span className="status-dot" /> SIMPLE TOOLS. BETTER WORKFLOW.</div>
            <h1>Everything you need.<br /><span>All in one place.</span></h1>
            <p className="hero-description">Powerful, simple and free online tools to make your everyday digital tasks easier.</p>
            <a href="#tools" className="primary-button">Explore Tools <ArrowRight size={18} /></a>
            <div className="hero-features">
              <span><ShieldCheck size={16} /> Privacy focused</span>
              <span><Zap size={16} /> Fast processing</span>
              <span><Globe size={16} /> Works in browser</span>
            </div>
          </div>
        </section>

        <section className="tools-section" id="tools">
          <div className="section-heading">
            <div><span className="section-eyebrow">OUR TOOLKIT</span><h2>Explore our tools</h2><p>Everything you need to get things done.</p></div>
          </div>
          <div className="tool-search">
            <Search size={19} />
            <input type="search" placeholder="Search for a tool..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="category-list">
            {categories.map((item) => (
              <button key={item} className={category === item ? "category active" : "category"} onClick={() => setCategory(item)}>{item}</button>
            ))}
          </div>
          <div className="tools-grid">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const available = tool.status === "Available";
              return (
                <article className="tool-card" key={tool.name}>
                  <div className="tool-card-top">
                    <div className="tool-icon"><Icon size={23} /></div>
                    <span className={available ? "tool-status available" : "tool-status"}>{tool.status}</span>
                  </div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  {available ? <a className="tool-link" href={tool.path}>Open Tool <ArrowRight size={16} /></a> : <span className="tool-coming">Under development</span>}
                </article>
              );
            })}
          </div>
          {filteredTools.length === 0 && <div className="empty-search">No tools found. Try another search.</div>}
        </section>

        <section className="about-section" id="about">
          <div className="about-icon"><ShieldCheck size={30} /></div>
          <span className="section-eyebrow">BUILT FOR EVERYONE</span>
          <h2>Simple tools. No unnecessary complications.</h2>
          <p>AllTools Studio is designed to make everyday digital tasks accessible, simple and convenient. Our browser-based tools process supported files directly on your device.</p>
        </section>
      </main>

      <footer className="footer" id="footer">
        <a className="brand" href="/"><span className="brand-icon"><Zap size={19} /></span><span>AllTools<span className="brand-accent">Studio</span></span></a>
        <p>Useful tools for everyday work.</p>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} AllTools Studio</span><span>Made with care.</span></div>
      </footer>
    </div>
  );
}

export default function App() {
  if (window.location.pathname === "/image-converter") return <ImageConverter />;
  if (window.location.pathname === "/image-compressor") return <ImageCompressor />;
  return <Home />;
}
