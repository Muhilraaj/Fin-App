# MyFinApp local development

Start the Go API and React development server on Windows. Always run the reverse proxy in Docker Desktop. Open [MyFinApp sign-in](http://localhost:8081/page/login) through the proxy. It forwards `/api/*` to the Go API on port `8080` and page and asset requests to React on port `3000`.

Use Go, Node.js with npm, and Docker Desktop running Linux containers. Start each terminal from the repository root. Create `backend-api/local.settings.json` with your development settings under `Values` before starting the API. Signing in and working with transactions requires access to the configured Azure Cosmos DB and a MyFinApp account. Changes made through the app are saved to the configured database.

## Start everything from one terminal

Run this from a Windows PowerShell with access to Docker Desktop.

```powershell
.\scripts\Start-Local.ps1
```

The launcher starts the API and React on Windows, runs the reverse proxy in Docker, and opens the sign-in page once both startup checks pass. Keep the terminal open and press `Ctrl+C` there to stop the services it started. Use the steps below to start or diagnose each service individually.

## 1. Start the Go API

```powershell
Set-Location .\backend-api
$settings = Get-Content -LiteralPath local.settings.json -Raw | ConvertFrom-Json
if (-not $settings.Values) { throw 'local.settings.json must contain Values' }
foreach ($setting in $settings.Values.PSObject.Properties) {
    Set-Item -LiteralPath ('Env:' + $setting.Name) -Value ([string]$setting.Value)
}
$env:FUNCTIONS_CUSTOMHANDLER_PORT = '8080'
go run .
```

Wait for the API to report that it is listening on port `8080`.

## 2. Start React

Run `npm.cmd ci` on a fresh checkout or when `package-lock.json` changes.

```powershell
Set-Location .\front-end
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency install failed' }
$env:HOST = '0.0.0.0'
$env:PORT = '3000'
$env:BROWSER = 'none'
$env:REACT_APP_API_URL = 'http://localhost:8081'
npm.cmd start
```

Wait for React to finish compiling. Use the proxy URL in the browser so the sign-in page and API share the same origin.

## 3. Start the reverse proxy in Docker

From the repository root, build the existing proxy image and run it as a container. The proxy listens on port `443` inside the container. Docker publishes it as HTTP on port `8081` on Windows. The container reaches both Windows services via `host.docker.internal`.

```powershell
docker build --tag myfinapp-reverse-proxy:local .\reverseProxy
if ($LASTEXITCODE -ne 0) { throw 'Reverse proxy image build failed' }
docker run --detach --rm --name myfinapp-reverse-proxy `
    --publish 127.0.0.1:8081:443 `
    --env FRONTEND_URL=http://host.docker.internal:3000 `
    --env BACKEND_URL=http://host.docker.internal:8080 `
    myfinapp-reverse-proxy:local
```

Keep the Go and React terminals running while using the app. Stop them with `Ctrl+C` and stop the container with `docker stop myfinapp-reverse-proxy`.

## Verify startup

Run these read-only checks in the Docker terminal. Reuse the existing container and services if both checks pass.

```powershell
curl.exe --noproxy '*' -sS --max-time 5 -o NUL -w 'Frontend through proxy: %{http_code}\n' http://localhost:8081/page/login
curl.exe --noproxy '*' -sS --max-time 5 -o NUL -w 'API through proxy: %{http_code}\n' http://localhost:8081/api/checkCookie
```

- **Frontend `200`** means the proxy reached React and served the sign-in page.
- **API `401`** is expected without a session cookie. It confirms that the proxy reached the Go API. Signing in with your account verifies the full login flow.

## Troubleshooting

- **Docker returns `Access is denied`.** Run `docker version` from a regular Windows PowerShell terminal with access to Docker Desktop. Check that it prints a server version before building the image.
- **Proxy returns `502`.** Run `docker logs myfinapp-reverse-proxy`. Check that React and the Go API are listening on ports `3000` and `8080` and that both upstream URLs use `host.docker.internal`.
- **Port is already in use.** Check for a listener with `netstat -ano -p tcp`. Reuse it if the startup checks pass for MyFinApp.
- **The page loads but sign-in fails.** Check the Go API log, confirm the local Cosmos DB and RSA settings, and open the app using the `localhost` proxy URL above.
