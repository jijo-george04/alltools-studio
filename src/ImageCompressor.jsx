import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Download, Image as ImageIcon, Upload, X, Trash2, ShieldCheck, Zap } from "lucide-react";
import "./compressor.css";

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
const extensionFor = (format) => format === "image/jpeg" ? "jpg" : format.split("/")[1];

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(0.8);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const urlsRef = useRef(new Set());

  const makeUrl = (blob) => {
    const url = URL.createObjectURL(blob);
    urlsRef.current.add(url);
    return url;
  };
  const releaseUrl = (url) => {
    if (url && urlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
    }
  };
  useEffect(() => () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    urlsRef.current.clear();
  }, []);

  const addFiles = (fileList) => {
    const images = Array.from(fileList || []).filter((file) => file.type.startsWith("image/") && ["image/png", "image/jpeg", "image/webp"].includes(file.type));
    const entries = images.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      preview: makeUrl(file),
      result: null,
      error: "",
      status: "Ready"
    }));
    setFiles((current) => [...current, ...entries]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id) => {
    setFiles((current) => {
      const target = current.find((item) => item.id === id);
      if (target) { releaseUrl(target.preview); if (target.result?.url) releaseUrl(target.result.url); }
      return current.filter((item) => item.id !== id);
    });
  };
  const clearAll = () => {
    files.forEach((item) => { releaseUrl(item.preview); if (item.result?.url) releaseUrl(item.result.url); });
    setFiles([]);
  };

  const compressOne = (entry) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Your browser could not process this image.");
        if (format === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(image, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) { resolve({ ...entry, error: "Could not compress this image.", status: "Failed" }); return; }
          // Some browsers may not support a requested output MIME type.
          const actualFormat = blob.type || format;
          const resultFormat = ["image/png", "image/jpeg", "image/webp"].includes(actualFormat) ? actualFormat : format;
          const outputName = `${entry.file.name.replace(/\.[^.]+$/, "")}-compressed.${extensionFor(resultFormat)}`;
          resolve({ ...entry, result: { blob, url: makeUrl(blob), name: outputName, size: blob.size, type: resultFormat }, error: "", status: "Done" });
        }, format, format === "image/png" ? undefined : quality);
      } catch (error) {
        resolve({ ...entry, error: error.message || "Could not process this image.", status: "Failed" });
      }
    };
    image.onerror = () => resolve({ ...entry, error: "This image could not be opened.", status: "Failed" });
    image.src = entry.preview;
  });

  const compressAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    const results = await Promise.all(files.map((entry) => compressOne(entry)));
    setFiles((current) => current.map((entry) => {
      const updated = results.find((result) => result.id === entry.id);
      if (entry.result?.url && entry.result.url !== updated?.result?.url) releaseUrl(entry.result.url);
      return updated || entry;
    }));
    setBusy(false);
  };

  const download = (entry) => {
    if (!entry.result) return;
    const link = document.createElement("a");
    link.href = entry.result.url;
    link.download = entry.result.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const savings = (entry) => entry.result && entry.file.size > 0 ? Math.round((1 - entry.result.size / entry.file.size) * 100) : null;

  return <div className="compressor-page">
    <header className="converter-navbar">
      <a className="converter-brand" href="/"><span className="converter-logo"><Zap size={20} /></span><span>AllTools<span className="brand-accent">Studio</span></span></a>
      <a className="back-link" href="/"><ArrowLeft size={16} /> All tools</a>
    </header>
    <main className="compressor-main">
      <div className="converter-breadcrumb">Home / Images / <strong>Image Compressor</strong></div>
      <div className="compressor-heading"><span className="compressor-kicker">FREE ONLINE IMAGE TOOL</span><h1>Image Compressor</h1><p>Reduce image file sizes in your browser while keeping the quality you need.</p></div>

      <section className="compressor-panel">
        <div className="upload-area" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files); }}>
          <div className="upload-icon"><Upload size={26} /></div>
          <h2>Drop your images here</h2><p>or select files from your device</p>
          <button className="browse-button" type="button" onClick={() => inputRef.current?.click()}>Choose images</button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={(event) => addFiles(event.target.files)} />
          <div className="upload-formats">Supported formats: PNG, JPG, JPEG, WebP</div>
        </div>
        <div className="compressor-settings">
          <div className="format-heading">Compression settings</div>
          <div className="format-row"><label className="format-label" htmlFor="output-format">Output format</label><select id="output-format" value={format} onChange={(event) => { setFormat(event.target.value); setFiles((current) => current.map((item) => ({ ...item, result: null, status: "Ready", error: "" }))); }}><option value="image/webp">WebP — recommended</option><option value="image/jpeg">JPG / JPEG</option><option value="image/png">PNG — lossless</option></select></div>
          <div className="quality-control"><div className="quality-label"><label htmlFor="quality">Image quality</label><strong>{Math.round(quality * 100)}%</strong></div><input id="quality" type="range" min="0.1" max="1" step="0.05" value={quality} onChange={(event) => setQuality(Number(event.target.value))} disabled={format === "image/png"} /><div className="quality-hints"><span>Smaller file</span><span>{format === "image/png" ? "PNG is lossless" : "Higher quality"}</span></div></div>
          <p className="privacy-note"><ShieldCheck size={17} /> Your images stay on your device. No upload to a server.</p>
          <button className="convert-button" type="button" onClick={compressAll} disabled={!files.length || busy}>{busy ? "Compressing…" : <><Zap size={17} /> Compress {files.length ? `${files.length} image${files.length === 1 ? "" : "s"}` : "images"}</>}</button>
        </div>
      </section>

      <section className="file-section">
        <div className="file-section-heading"><div><h2>Your images</h2><p>{files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "Add one or more images to get started."}</p></div>{files.length > 0 && <button className="clear-button" onClick={clearAll}><Trash2 size={15} /> Clear all</button>}</div>
        {files.length === 0 ? <div className="empty-files"><ImageIcon size={28} /><span>Your selected images will appear here.</span></div> : <div className="file-list">{files.map((entry) => <article className="file-item" key={entry.id}>
          <img className="file-preview" src={entry.preview} alt="" />
          <div className="file-info"><strong title={entry.file.name}>{entry.file.name}</strong><span>{formatBytes(entry.file.size)}{entry.result ? ` → ${formatBytes(entry.result.size)}` : ""}</span>{entry.error ? <span className="file-error">{entry.error}</span> : entry.result ? <span className="file-status">{savings(entry) >= 0 ? `${savings(entry)}% smaller` : `${Math.abs(savings(entry))}% larger`} · Ready to download</span> : <span className="file-status">{entry.status}</span>}</div>
          {entry.result && <button className="download-icon" onClick={() => download(entry)} title="Download compressed image" aria-label="Download compressed image"><Download size={18} /></button>}
          <button className="remove-icon" onClick={() => removeFile(entry.id)} title="Remove image" aria-label="Remove image"><X size={18} /></button>
        </article>)}</div>}
      </section>
      <p className="compressor-footnote">Note: PNG compression is lossless and may not reduce file size. Converting transparent images to JPG adds a white background.</p>
    </main>
    <footer className="converter-footer">© {new Date().getFullYear()} AllTools Studio · Free tools, right in your browser.</footer>
  </div>;
}
