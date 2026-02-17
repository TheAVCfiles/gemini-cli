const apiBase =
  process.env.NEXT_PUBLIC_API_BASE ?? 'https://yourdomain.com/api';

export default function Home() {
  return (
    <main>
      <p className="eyebrow">MythOS host kit</p>
      <h1>Vercel-ish on your own box</h1>
      <p>
        This starter pairs a Next.js frontend with a FastAPI backend and
        Postgres, all fronted by Caddy with automatic HTTPS. Update{' '}
        <code>docker-compose.yml</code> with your domain, set a<code>.env</code>{' '}
        file that contains <code>DB_PASSWORD</code>, and run{' '}
        <code>docker compose up -d</code>
        to launch everything on a single host.
      </p>
      <ul>
        <li>Frontend served at port 3000 and routed through Caddy.</li>
        <li>
          FastAPI available at <code>{`${apiBase}/health`}</code>.
        </li>
        <li>
          Database connection managed via <code>DB_URL</code> in the API
          service.
        </li>
      </ul>
      <p>
        The included GitHub Actions workflow deploys by syncing the repo over
        SSH and restarting the stack so you can push-to-deploy without a
        registry.
      </p>
    </main>
  );
}
