import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle2, XCircle, FileText } from "lucide-react";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";

export default function UploadDropzone({ jobId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState([]); // [{ name, progress, status: 'uploading'|'done'|'error' }]
  const inputRef = useRef(null);
  const toast = useToast();

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const batchItems = files.map((f) => ({ name: f.name, progress: 0, status: "uploading" }));
    setItems(batchItems);

    try {
      const results = await api.uploadResumesWithProgress(jobId, files, (pct) => {
        setItems((prev) => prev.map((it) => ({ ...it, progress: pct })));
      });

      const failed = results.filter((r) => r.error);
      setItems(
        results.map((r) => ({
          name: r.fileName || r.name || "resume",
          progress: 100,
          status: r.error ? "error" : "done",
        }))
      );

      const succeeded = results.length - failed.length;
      if (succeeded > 0) {
        toast.success(`Scored ${succeeded} resume${succeeded === 1 ? "" : "s"} against this role.`);
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} resume${failed.length === 1 ? "" : "s"} failed to parse.`);
      }
      onUploaded?.();
    } catch (err) {
      setItems((prev) => prev.map((it) => ({ ...it, status: "error" })));
      toast.error(err.message);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setTimeout(() => setItems([]), 2600);
    }
  }

  return (
    <div className="section-card card animate-in">
      <div
        className={`upload-zone ${dragging ? "upload-zone--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input ref={inputRef} type="file" multiple accept=".pdf,.docx,.txt" hidden onChange={(e) => handleFiles(e.target.files)} />
        <div className="upload-zone__icon">
          <UploadCloud size={22} />
        </div>
        <p className="upload-zone__title">Drop resumes here, or click to browse</p>
        <p className="upload-zone__hint">Accepted formats: PDF, DOCX, TXT · scored instantly against this role</p>
      </div>

      {items.length > 0 && (
        <div className="upload-progress-list">
          {items.map((item, i) => (
            <div key={i} className={`upload-progress-item upload-progress-item--${item.status}`}>
              {item.status === "uploading" && <FileText size={15} color="var(--primary)" />}
              {item.status === "done" && <CheckCircle2 size={15} color="var(--success)" />}
              {item.status === "error" && <XCircle size={15} color="var(--danger)" />}
              <span style={{ minWidth: 0, flexShrink: 0, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.name}
              </span>
              <div className="upload-progress-item__bar">
                <div className="upload-progress-item__fill" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
