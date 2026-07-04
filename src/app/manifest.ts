import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Meera",
    short_name: "Meera",
    description:
      "A private memory engine for patterns, open loops, weekly reviews, and next moves.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f8fc",
    theme_color: "#0d6e66",
    icons: [
      {
        src: "https://meera.zynnode.cc/logo.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
