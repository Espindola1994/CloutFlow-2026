export default function EmailPreviewPage() {
  return (
    <main
      style={{
        margin: 0,
        minHeight: "100vh",
        background: "#eef2f7",
      }}
    >
      <iframe
        src="/email-preview/post-purchase-25.html"
        title="CloutFlow Post Purchase 25% Email Preview"
        style={{
          display: "block",
          width: "100%",
          height: "100vh",
          border: 0,
          background: "#eef2f7",
        }}
      />
    </main>
  );
}
