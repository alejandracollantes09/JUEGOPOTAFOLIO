$candidatePorts = @(8080, 8081, 8082, 8085, 3000, 5000, 8000)
$folder = $PSScriptRoot

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".glb"  = "model/gltf-binary"
    ".gltf" = "model/gltf+json"
    ".mp3"  = "audio/mpeg"
    ".ogg"  = "audio/ogg"
    ".wav"  = "audio/wav"
}

$listener = $null
$startedPort = $null
$url = ""

foreach ($p in $candidatePorts) {
    try {
        $tempUrl = "http://localhost:$p/"
        $testListener = New-Object System.Net.HttpListener
        $testListener.Prefixes.Add($tempUrl)
        $testListener.Start()
        $listener = $testListener
        $startedPort = $p
        $url = $tempUrl
        break
    } catch {
        if ($testListener) {
            try { $testListener.Close() } catch {}
        }
    }
}

if (-not $listener) {
    Write-Host "[ERROR] No se encontro ningun puerto libre en: $($candidatePorts -join ', ')." -ForegroundColor Red
    Exit 1
}

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Hospital Olvidado — Juego Portafolio 3D               " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[OK] Servidor iniciado exitosamente en $url" -ForegroundColor Green
Write-Host "Abriendo en tu navegador predeterminado..." -ForegroundColor Gray
Start-Process $url

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $path = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($path)) {
            $path = "index.html"
        }

        $filePath = Join-Path $folder $path

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $buf = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
            $response.OutputStream.Write($buf, 0, $buf.Length)
        }
        $response.Close()
    } catch {
        # Ignore client disconnects
    }
}
