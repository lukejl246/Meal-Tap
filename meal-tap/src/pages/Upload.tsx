// src/pages/Upload.tsx
export default function Upload() {
    return (
      <section>
        <h2>Upload</h2>
        <p className="card">
          This is a placeholder. Next phase we’ll open the camera and upload to <code>meal-photos</code>.
        </p>
  
        <p>For now, a simple file input:</p>
        <input type="file" accept="image/*" capture="environment" />
        <small className="muted">On mobile, this opens the camera.</small>
      </section>
    )
  }