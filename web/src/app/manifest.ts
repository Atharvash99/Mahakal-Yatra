import type { MetadataRoute } from "next";

// Installable as an app on the driver's phone (add to home screen).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MahakalYatra Driver",
    short_name: "Driver",
    start_url: "/driver",
    scope: "/driver",
    display: "standalone",
    background_color: "#fff8ec",
    theme_color: "#3d0f12",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
