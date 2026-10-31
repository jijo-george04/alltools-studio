import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Upload, Download, Trash2, Image as ImageIcon, CheckCircle2, AlertCircle, X, Zap, ShieldCheck, RefreshCw } from "lucide-react";
import "./converter.css";

const FORMATS = [
  { label: "PNG", mime: "image/png", extension: "png" },
  { label: "JPG", mime: "image/jpeg", extension: "jpg" },
  { label: "WebP", mime: "image/webp", extension: "webp" }
];

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageConverter() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState("image/webp");
  const [quality, setQuality] = useState(85);
  const [dragging, setDragging] = useState(false);
  const [converting, setConverting] = useState(false);
  const inputRef = useRef(null);
  const activeUrls = useRef(new Set());

  function makeUrl(blob) {
    const url = URL.createObjectURL(blob);
    activeUrls.current.add(url);
    return url;
  }
  function releaseUrl(url) {
    if (!url) return;
    URL.revokeObjectURL(url);
    activeUrls.current.delete(url);
  }
  useEffect(() => () => {
    activeUrls.current.forEach((url) => URL.revokeObjectURL(url));
    activeUrls.current.clear();
  }, []);

  function addFiles(fileList) {
    const accepted = Array.from(fileList).filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
    const rejected = Array.from(fileList).length - accepted.length;
    const newFiles = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random()}`, file, name: file.name,
      preview: makeUrl(file), output: null, outputUrl: null, status: "Ready", error: null
    }));
    setFiles((previous) => [...previous, ...newFiles]);
    if (rejected) window.alert(`${rejected} file(s) were skipped. Please choose PNG, JPG or WebP images.`);
  }
  function handleFileInput(event) {
    addFiles(event.target.files);
    event.target.value = "";
  }
  function removeFile(id) {
    setFiles((previous) => {
      const item = previous.find((file) => file.id === id);
      if (item) { releaseUrl(item.preview); releaseUrl(item.outputUrl); }
      return previous.filter((file) => file.id !== id);
    });
  }
  function clearAll() {
    files.forEach((item) => { releaseUrl(item.preview); releaseUrl(item.outputUrl); });
    setFiles([]);
  }
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = makeUrl(file);
      image.onload = () => { releaseUrl(url); resolve(image); };
      image.onerror = () => { releaseUrl(url); reject(new Error("Unable to load this image.")); };
      image.src = url;
    });
  }
  async function convertImage(file, format, selectedQuality) {
    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported by this browser.");
    if (format === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.drawImage(image, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result && result.type === format) resolve(result);
        else reject(new Error("Your browser could not export this format. Try another format."));
      }, format, selectedQuality / 100);
    });
    canvas.width = 0;
    canvas.height = 0;
    return blob;
  }
  async function convertAll() {
    if (!files.length || converting) return;
    setConverting(true);
    for (const item of files) {
      setFiles((previous) => previous.map((file) => file.id === item.id ? { ...file, status: "Converting", error: null } : file));
      try {
        const blob = await convertImage(item.file, targetFormat, quality);
        const outputUrl = makeUrl(blob);
        setFiles((previous) => previous.map((file) => {
          if (file.id !== item.id) return file;
          releaseUrl(file.outputUrl);
          return { ...file, output: blob, outputUrl, status: "Completed", error: null };
        }));
      } catch (error) {
        setFiles((previous) => previous.map((file) => file.id === item.id ? { ...file, status: "Failed", error: error.message } : file));
      }
    }
    setConverting(false);
  }
  function downloadFile(item) {
    if (!item.outputUrl) return;
    const format = FORMATS.find((f) => f.mime === targetFormat);
    const baseName = item.name.replace(/\.[^/.]+$/, "");
    const link = document.createElement("a");
    link.href = item.outputUrl;
    link.download = `${baseName}.${format.extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  const completedCount = files.filter((item) => item.status === "Completed").length;
  const totalOutputSize = files.reduce((sum, item) => sum + (item.output?.size || 0), 0);

  return (
    <div className="converter-page">
      <header className="converter-navbar">
        <a href="/" className="converter-brand"><span className="converter-logo"><Zap size={19} /></span>AllTools<span>Studio</span></a>
        <a href="/" className="back-link"><ArrowLeft size={16} /> Back to tools</a>
      </header>
      <main className="converter-main">
        <div className="converter-heading">
          <div className="converter-breadcrumb">TOOLS / IMAGE TOOLS</div>
          <h1>Image Converter</h1>
          <p>Convert your images between PNG, JPG and WebP formats. Simple, fast and completely private.</p>
        </div>

        <section className="converter-workspace">
          <div className={`upload-area ${dragging ? "drag-active" : ""}`}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={handleFileInput} />
            <div className="upload-icon"><Upload size={27} /></div>
            <h2>Drop your images here</h2>
            <p>or click the button below to browse files</p>
            <button className="browse-button" onClick={() => inputRef.current?.click()}><Upload size={16} /> Choose Images</button>
            <span className="upload-formats">Supports PNG, JPG, JPEG and WebP</span>
          </div>

          <div className="format-panel">
            <div className="format-heading"><div><h3>Conversion settings</h3><p>Choose your desired output format.</p></div><span className="format-label">OUTPUT FORMAT</span></div>
            <div className="format-options">
              {FORMATS.map((format) => (
                <button key={format.mime} className={targetFormat === format.mime ? "format-option selected" : "format-option"} onClick={() => setTargetFormat(format.mime)}>
                  <span className="format-option-name">{format.label}</span>
                  <span className="format-option-check">{targetFormat === format.mime && <CheckCircle2 size={17} />}</span>
                </button>
              ))}
            </div>
            {targetFormat !== "image/png" && <div className="quality-control">
              <div className="quality-label"><label htmlFor="quality">Image quality</label><strong>{quality}%</strong></div>
              <input id="quality" type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
              <div className="quality-hints"><span>Smaller file</span><span>Better quality</span></div>
            </div>}
            <div className="privacy-note"><ShieldCheck size={17} /> Your images are processed locally in your browser. They are not uploaded to our server.</div>
          </div>

          <div className="file-section">
            <div className="file-section-heading"><div><h3>Your images</h3><p>{files.length} {files.length === 1 ? "image" : "images"} added</p></div>
              {files.length > 0 && <button className="clear-button" onClick={clearAll}><Trash2 size={15} /> Clear all</button>}
            </div>
            {files.length === 0 ? <div className="empty-files"><ImageIcon size={30} /><p>No images added yet</p><span>Your selected images will appear here.</span></div> :
              <div className="file-list">{files.map((item) => (
                <div className="file-item" key={item.id}>
                  <img src={item.preview} alt={item.name} className="file-preview" />
                  <div className="file-info"><strong>{item.name}</strong><span>{formatSize(item.file.size)}{item.output ? ` → ${formatSize(item.output.size)}` : ""}</span>{item.error && <span className="file-error">{item.error}</span>}</div>
                  <div className={`file-status ${item.status.toLowerCase()}`}>
                    {item.status === "Completed" ? <CheckCircle2 size={15} /> : item.status === "Failed" ? <AlertCircle size={15} /> : item.status === "Converting" ? <RefreshCw size={15} className="spin" /> : null}
                    {item.status}
                  </div>
                  {item.outputUrl && <button className="download-icon" onClick={() => downloadFile(item)} aria-label={`Download ${item.name}`}><Download size={18} /></button>}
                  <button className="remove-icon" onClick={() => removeFile(item.id)} aria-label={`Remove ${item.name}`}><X size={17} /></button>
                </div>
              ))}</div>}
            {files.length > 0 && <div className="conversion-footer">
              <div className="conversion-summary"><span>{completedCount} / {files.length} completed</span>{completedCount > 0 && <span>Output: {formatSize(totalOutputSize)}</span>}</div>
              <div className="conversion-actions">
                {completedCount > 0 && <button className="download-all-button" onClick={() => files.filter((item) => item.outputUrl).forEach(downloadFile)}><Download size={16} /> Download converted</button>}
                <button className="convert-button" onClick={convertAll} disabled={converting}>{converting ? <><RefreshCw size={16} className="spin" /> Converting...</> : <><Zap size={16} /> Convert images</>}</button>
              </div>
            </div>}
          </div>
        </section>

        <section className="converter-info">
          <div><h2>How to convert images</h2><p>Three simple steps to change your image format.</p></div>
          <div className="steps-grid">
            <article><span>01</span><h3>Upload images</h3><p>Select one or multiple images from your device.</p></article>
            <article><span>02</span><h3>Choose a format</h3><p>Select PNG, JPG or WebP as your output format.</p></article>
            <article><span>03</span><h3>Convert and download</h3><p>Convert your images and save them to your device.</p></article>
          </div>
        </section>
        <div className="converter-faq">
          <h2>Frequently asked questions</h2>
          <details><summary>Are my images uploaded to a server?</summary><p>No. This converter uses your browser to process the images locally on your device.</p></details>
          <details><summary>What image formats are supported?</summary><p>PNG, JPG, JPEG and WebP are supported. JPG and JPEG are two extensions for the same image format.</p></details>
          <details><summary>What happens to transparent images converted to JPG?</summary><p>JPG does not support transparency. Transparent areas are filled with white when exporting to JPG.</p></details>
          <details><summary>Is the image converter free?</summary><p>Yes. You can use this browser-based converter without an account or payment.</p></details>
        </div>
      </main>
      <footer className="converter-footer"><a href="/" className="converter-brand"><span className="converter-logo"><Zap size={17} /></span>AllTools<span>Studio</span></a><span>Free tools for everyday work.</span></footer>
    </div>
  );
}
