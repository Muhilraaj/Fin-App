$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$baseUrl = 'http://localhost:8081'
$signInUrl = "$baseUrl/page/login"
$container = 'myfinapp-reverse-proxy'
$image = 'myfinapp-reverse-proxy:local'
$frontend = Join-Path $root 'front-end'
$backend = Join-Path $root 'backend-api'

function Test-MyFinApp {
    $PSNativeCommandUseErrorActionPreference = $false
    $page = curl.exe --noproxy '*' --silent --max-time 3 --output NUL --write-out '%{http_code}' $signInUrl
    $api = curl.exe --noproxy '*' --silent --max-time 3 --output NUL --write-out '%{http_code}' "$baseUrl/api/checkCookie"
    return ($page -eq '200' -and $api -eq '401')
}

function Start-LocalService {
    param($Name, $Executable, $Arguments, $Directory, $Variables)

    $previous = @{}
    try {
        foreach ($key in $Variables.Keys) {
            $previous[$key] = [Environment]::GetEnvironmentVariable($key)
            [Environment]::SetEnvironmentVariable($key, $Variables[$key])
        }
        $launch = @{
            FilePath = $Executable
            ArgumentList = $Arguments
            WorkingDirectory = $Directory
            WindowStyle = 'Hidden'
            PassThru = $true
            RedirectStandardOutput = Join-Path $logs "$Name.out.log"
            RedirectStandardError = Join-Path $logs "$Name.err.log"
        }
        Start-Process @launch
    } finally {
        foreach ($key in $previous.Keys) {
            [Environment]::SetEnvironmentVariable($key, $previous[$key])
        }
    }
}

$dockerOs = docker version --format '{{.Server.Os}}'
if ($LASTEXITCODE -ne 0 -or $dockerOs -ne 'linux') {
    throw 'Docker Desktop must be running Linux containers and accessible from this PowerShell.'
}

$runningContainer = docker ps --filter "name=^/$container$" --format '{{.Names}}'
if ($LASTEXITCODE -ne 0) { throw 'Could not list running containers.' }
if ($runningContainer -eq $container) {
    if (-not (Test-MyFinApp)) { throw "The existing $container container failed the startup checks. Run docker logs $container." }
    Start-Process $signInUrl
    return
}

$go = (Get-Command go.exe).Source
$node = (Get-Command node.exe).Source
$settings = Get-Content -LiteralPath (Join-Path $backend 'local.settings.json') -Raw | ConvertFrom-Json
if (-not $settings.Values) { throw 'backend-api/local.settings.json must contain Values.' }

if (-not (Test-Path -LiteralPath (Join-Path $frontend 'node_modules/react-scripts/bin/react-scripts.js'))) {
    npm.cmd --prefix $frontend ci
    if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
}

docker build --tag $image (Join-Path $root 'reverseProxy')
if ($LASTEXITCODE -ne 0) { throw 'Reverse proxy image build failed.' }

$logs = Join-Path ([IO.Path]::GetTempPath()) ('MyFinApp-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $logs
$services = @()
$containerStarted = $false

try {
    $dockerArgs = @(
        'run', '--detach', '--rm', '--name', $container, '--publish', '127.0.0.1:8081:443'
        '--env', 'FRONTEND_URL=http://host.docker.internal:3000'
        '--env', 'BACKEND_URL=http://host.docker.internal:8080', $image
    )
    docker @dockerArgs
    if ($LASTEXITCODE -ne 0) { throw 'Reverse proxy container failed to start.' }
    $containerStarted = $true

    $frontendVariables = @{ HOST = '0.0.0.0'; PORT = '3000'; BROWSER = 'none'; REACT_APP_API_URL = $baseUrl }
    $backendVariables = @{}
    foreach ($setting in $settings.Values.PSObject.Properties) {
        $backendVariables[$setting.Name] = [string]$setting.Value
    }
    $backendVariables['FUNCTIONS_CUSTOMHANDLER_PORT'] = '8080'

    $services += Start-LocalService 'react' $node @('node_modules/react-scripts/bin/react-scripts.js', 'start') $frontend $frontendVariables
    $services += Start-LocalService 'api' $go @('run', '.') $backend $backendVariables

    Write-Host "Waiting for React and the Go API. Logs are in $logs."
    $deadline = (Get-Date).AddMinutes(5)
    while (-not (Test-MyFinApp)) {
        if (($services | Where-Object HasExited) -or (Get-Date) -ge $deadline) {
            throw "MyFinApp failed the startup checks. See $logs and run docker logs $container."
        }
        Start-Sleep -Seconds 2
    }

    Write-Host "MyFinApp is ready at $signInUrl. Press Ctrl+C here to stop it."
    try {
        Start-Process $signInUrl
    } catch {
        Write-Warning "Open $signInUrl in your browser."
    }
    while (-not ($services | Where-Object HasExited)) { Start-Sleep -Seconds 2 }
    throw "A MyFinApp service exited. See $logs."
} finally {
    foreach ($service in $services) {
        if (-not $service.HasExited) { taskkill.exe /PID $service.Id /T /F | Out-Null }
    }
    if ($containerStarted) { docker stop $container | Out-Null }
}
