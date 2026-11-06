# Docker and Local Supabase Setup

This guide covers running the Little Plans Around Here Supabase stack on macOS with Docker
Desktop. The local stack is separate from the linked Supabase cloud project.

## 1. Start Docker Desktop

Open Docker Desktop from Applications, or run:

```bash
open -a Docker
```

Wait until Docker Desktop reports that the engine is running.

## 2. Make the Docker CLI available

If `docker` is not found in your terminal, add Docker Desktop's CLI directory
to `PATH` for the current terminal:

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

Verify that both the Docker client and server are available:

```bash
docker --version
docker info
```

If `docker info` only shows client information and says it cannot connect to
the Docker API, the Docker Desktop engine may still be starting. Wait and try
again.

To keep this path in future zsh terminals, add the following line to
`~/.zshrc`, then open a new terminal:

```bash
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
```

If Docker Desktop is installed in a different location, adjust the path to
match its CLI installation.

## 3. Start the local Supabase stack

From the repository root, start Supabase:

```bash
supabase start
```

On the first start, Docker downloads the Supabase images, so startup may take a
while. When it finishes, inspect the local URLs and keys:

```bash
supabase status
```

The local API URL is typically `http://127.0.0.1:54321`. Use the values printed
by `supabase status` rather than assuming a key or URL.

## 4. Apply migrations locally

To create or reset the local database from the migrations in
`supabase/migrations/`, run:

```bash
supabase db reset
```

**This resets the local Supabase database and removes its existing local data**
before applying migrations and any configured seed scripts. It does not reset
the linked cloud database.

## 5. Point the app at local Supabase

Set these variables in `.env.development.local` using the local values printed
by `supabase status`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-local-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key
```

The app also accepts the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` variable in
place of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use the local publishable/anon
key for browser access and keep the service-role key server-only. Never add
`NEXT_PUBLIC_` to the service-role key, commit real keys, or share them.

Restart `pnpm dev` after changing environment variables. Next.js reads
`.env.development.local` in development.

## 6. Stop the local stack

When finished, stop the Supabase containers with:

```bash
supabase stop
```

This stops the local services without removing the project's local database
volume. To remove local Supabase data too, use the CLI's `--no-backup` option
only when you intentionally want to discard it:

```bash
supabase stop --no-backup
```

## Troubleshooting

- **`docker: command not found`:** Add Docker Desktop's CLI directory to
  `PATH` as described above, then open a new terminal if you changed `~/.zshrc`.
- **Cannot connect to the Docker API:** Start Docker Desktop and wait for its
  engine to become ready; verify with `docker info`.
- **`supabase start` cannot find Docker:** Check that `docker --version` and
  `docker info` both work in the same terminal where you run the Supabase CLI.
- **The app still connects to the cloud project:** Check that
  `.env.development.local` contains the local values from `supabase status`,
  then restart the Next.js dev server.
- **Port conflicts:** Check `supabase/config.toml` for the configured local
  ports, stop any conflicting services, or change the Supabase port settings
  before starting the stack again.
