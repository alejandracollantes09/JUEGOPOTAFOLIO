# ════════════════════════════════════════════════════════
#  Hospital Olvidado - Servidor Local PowerShell
#  Streaming por bloques (64KB) y recuperacion de desconexion
# ════════════════════════════════════════════════════════

$candidatePorts = @(8080, 8081, 8082, 8085, 3000, 5000, 8000)
$folder = $PSScriptRoot

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".mjs"  = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
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
Write-Host "  Hospital Olvidado - Juego Portafolio 3D               " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "[OK] Servidor iniciado exitosamente en $url" -ForegroundColor Green
Write-Host "Abriendo en tu navegador predeterminado..." -ForegroundColor Gray
Start-Process $url

while ($listener.IsListening) {
    $context = $null
    $fileStream = $null
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($rawPath)) {
            $rawPath = "index.html"
        }

        $filePath = Join-Path $folder $rawPath

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $response.ContentType = $mime
            $response.AddHeader("Access-Control-Allow-Origin", "*")
            $response.AddHeader("Accept-Ranges", "bytes")

            $fileStream = [System.IO.File]::OpenRead($filePath)
            $response.ContentLength64 = $fileStream.Length

            $buffer = New-Object byte[] 65536
            while ($fileStream.Position -lt $fileStream.Length) {
                $bytesRead = $fileStream.Read($buffer, 0, $buffer.Length)
                if ($bytesRead -le 0) { break }
                $response.OutputStream.Write($buffer, 0, $bytesRead)
            }
            $fileStream.Close()
            $fileStream = $null
            $response.Close()
        } else {
            $response.StatusCode = 404
            $msg = "404 Not Found: " + $rawPath
            $buf = [System.Text.Encoding]::UTF8.GetBytes($msg)
            $response.OutputStream.Write($buf, 0, $buf.Length)
            $response.Close()
        }
    } catch {
        if ($fileStream) {
            try { $fileStream.Close() } catch {}
        }
        if ($context -and $context.Response) {
            try { $context.Response.Abort() } catch {}
        }
    }
}
