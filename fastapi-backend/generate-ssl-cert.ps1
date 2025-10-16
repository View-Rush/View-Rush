# PowerShell script to generate self-signed SSL certificate for Windows
# Run this in PowerShell before starting docker-compose

Write-Host "Generating self-signed SSL certificate..." -ForegroundColor Cyan

# Create SSL directory if it doesn't exist
$sslDir = "nginx\ssl"
if (-not (Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force | Out-Null
}

# Check if OpenSSL is available
$openssl = Get-Command openssl -ErrorAction SilentlyContinue

if ($null -eq $openssl) {
    Write-Host "❌ OpenSSL not found. Installing via Chocolatey..." -ForegroundColor Yellow
    
    # Check if Chocolatey is installed
    $choco = Get-Command choco -ErrorAction SilentlyContinue
    if ($null -eq $choco) {
        Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    # Install OpenSSL
    choco install openssl -y
    refreshenv
}

# Generate self-signed certificate
& openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
    -keyout "$sslDir\key.pem" `
    -out "$sslDir\cert.pem" `
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Self-signed certificate generated successfully!" -ForegroundColor Green
    Write-Host "Certificate: $sslDir\cert.pem" -ForegroundColor Green
    Write-Host "Key: $sslDir\key.pem" -ForegroundColor Green
    Write-Host "`n⚠️  WARNING: This is a self-signed certificate for development only." -ForegroundColor Yellow
    Write-Host "For production, use Let's Encrypt." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Failed to generate certificate" -ForegroundColor Red
    exit 1
}
