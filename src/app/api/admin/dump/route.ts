// AN ENDLESS STREAM HONEYPOT ("ZIP BOMB" CONCEPT)
// Hackers automating path enumeration (DirBuster/Gobuster) or scraping
// will hit this endpoint thinking it's a juicy database dump.
// It returns an infinite stream of junk JSON, designed to hang their threads
// and infinitely consume their RAM until their tool crashes.

export const dynamic = 'force-dynamic';

export function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      // Loop forever
      while (true) {
        // Enqueue 1MB blocks of stringified junk data
        const junkBlock = JSON.stringify(
          Array.from({ length: 1000 }).map(() => ({
            id: crypto.randomUUID(),
            passwordHash: '$2b$12$' + crypto.randomUUID().replace(/-/g, ''),
            creditCard: '4XXX-XXXX-XXXX-' + Math.floor(1000 + Math.random() * 9000),
            isAdmin: Math.random() > 0.5
          }))
        ) + '\n';
        
        try {
          controller.enqueue(new TextEncoder().encode(junkBlock));
          // Wait 500ms between blasts so we don't crash our own Node server process
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          // The hacker killed the connection or crashed
          break;
        }
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      // Explicitly tell scrapers not to cache it so they keep downloading
      'Cache-Control': 'no-store',
    },
  });
}
