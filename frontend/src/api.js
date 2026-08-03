/**
 * api.js — every HTTP call the frontend makes, in one place.
 */

const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Jobs
  listJobs: () => request("/jobs"),
  getJob: (id) => request(`/jobs/${id}`),
  createJob: (job) =>
    request("/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
    }),
  deleteJob: (id) => request(`/jobs/${id}`, { method: "DELETE" }),
  updateJobStatus: (id, status) =>
    request(`/jobs/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  // Candidates
  listCandidates: (jobId) => request(`/jobs/${jobId}/candidates`),
  listAllCandidates: () => request(`/candidates`),
  getCandidate: (id) => request(`/candidates/${id}`),
  uploadResumes: (jobId, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("resumes", file));
    return request(`/jobs/${jobId}/candidates`, { method: "POST", body: formData });
  },
  updateStatus: (candidateId, status) =>
    request(`/candidates/${candidateId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: "DELETE" }),
  fileUrl: (id) => `${BASE}/candidates/${id}/file`,

  /**
   * Uploads resumes with real upload-progress events (fetch can't report
   * upload progress, so this uses XMLHttpRequest instead).
   */
  uploadResumesWithProgress: (jobId, files, onProgress) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("resumes", file));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE}/jobs/${jobId}/candidates`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(body);
          else reject(new Error(body.error || `Upload failed: ${xhr.status}`));
        } catch (err) {
          reject(err);
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(formData);
    });
  },

  // Dashboard
  getSummary: () => request("/dashboard/summary"),
  getAnalytics: () => request("/dashboard/analytics"),
};
