# PowerShell script to generate SSL certificates for HTTPS development

$sslDir = Join-Path $PSScriptRoot ".." "ssl"

# Create ssl directory if it doesn't exist
if (!(Test-Path $sslDir)) {
    New-Item -ItemType Directory -Path $sslDir -Force
}

Write-Host "🔐 Generating SSL certificates for HTTPS development..." -ForegroundColor Green

try {
    # Check if we have OpenSSL available
    $opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
    
    if ($opensslPath) {
        Write-Host "📝 Using OpenSSL found at: $($opensslPath.Source)" -ForegroundColor Yellow
        
        # Generate private key
        Write-Host "📝 Generating private key..." -ForegroundColor Yellow
        & openssl genrsa -out "$sslDir\server.key" 2048
        
        # Generate certificate signing request
        Write-Host "📝 Generating certificate signing request..." -ForegroundColor Yellow
        & openssl req -new -key "$sslDir\server.key" -out "$sslDir\server.csr" -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        # Generate self-signed certificate
        Write-Host "📝 Generating self-signed certificate..." -ForegroundColor Yellow
        & openssl x509 -req -days 365 -in "$sslDir\server.csr" -signkey "$sslDir\server.key" -out "$sslDir\server.crt"
        
        # Clean up CSR file
        Remove-Item "$sslDir\server.csr" -Force
        
        Write-Host "✅ SSL certificates generated successfully!" -ForegroundColor Green
    } else {
        # Fallback: Use PowerShell's built-in certificate creation
        Write-Host "📝 OpenSSL not found, using PowerShell's built-in certificate creation..." -ForegroundColor Yellow
        
        # Create a self-signed certificate using PowerShell
        $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "Cert:\CurrentUser\My" -KeyUsage DigitalSignature,KeyEncipherment -FriendlyName "Wear Development Certificate"
        
        # Export the certificate to files
        $certPath = "Cert:\CurrentUser\My\$($cert.Thumbprint)"
        
        # Export private key
        $cert.PrivateKey.ExportPkcs8PrivateKey() | Set-Content "$sslDir\server.key" -Encoding Byte
        
        # Export certificate
        Export-Certificate -Cert $certPath -FilePath "$sslDir\server.crt" -Type CERT
        
        Write-Host "✅ SSL certificates generated using PowerShell!" -ForegroundColor Green
    }
    
    Write-Host "📁 Certificates saved in: $sslDir" -ForegroundColor Cyan
    Write-Host "🔒 Files created:" -ForegroundColor Cyan
    Write-Host "   - server.key (private key)" -ForegroundColor White
    Write-Host "   - server.crt (certificate)" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Note: These are self-signed certificates for development only." -ForegroundColor Yellow
    Write-Host "   Your browser will show a security warning - click 'Advanced' and 'Proceed to localhost'" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error generating SSL certificates: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: You can generate certificates manually using:" -ForegroundColor Yellow
    Write-Host "   1. Install Git for Windows (includes OpenSSL)" -ForegroundColor White
    Write-Host "   2. Or use online SSL certificate generators" -ForegroundColor White
    Write-Host "   3. Or use mkcert tool: https://github.com/FiloSottile/mkcert" -ForegroundColor White
}