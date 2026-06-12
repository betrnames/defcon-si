const OG_IMAGES = [
  "https://defcon.si/og-image-1.jpg",
  "https://defcon.si/og-image-2.jpg",
  "https://defcon.si/og-image-3.jpg",
  "https://defcon.si/og-image-4.jpg",
  "https://defcon.si/og-image-5.jpg",
];

export default async (request, context) => {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const image = OG_IMAGES[Math.floor(Math.random() * OG_IMAGES.length)];
  let html = await response.text();

  html = html.replace(
    /(<meta property="og:image" content=")[^"]+(")/g,
    `$1${image}$2`
  );
  html = html.replace(
    /(<meta name="twitter:image" content=")[^"]+(")/g,
    `$1${image}$2`
  );

  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};