import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduPanel — Student Management Dashboard" },
      { name: "description", content: "A modern, responsive student management admin dashboard built with vanilla HTML, CSS, and JavaScript." },
      { property: "og:title", content: "EduPanel — Student Management Dashboard" },
      { property: "og:description", content: "Modern admin panel for managing students, courses, and attendance." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/dashboard.html"
      title="EduPanel Dashboard"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
      }}
    />
  );
}
