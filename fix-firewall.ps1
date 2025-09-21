# PowerShell script to fix Windows Firewall for Node.js server
# Run this as Administrator

Write-Host "Adding Windows Firewall rule for port 8080..."

try {
    netsh advfirewall firewall add rule name="Node.js Server Port 8080" dir=in action=allow protocol=TCP localport=8080
    Write-Host "✅ Firewall rule added successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to add firewall rule. Make sure to run as Administrator." -ForegroundColor Red
}

Write-Host "Testing connection to localhost:8080..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/profile" -TimeoutSec 5
    Write-Host "✅ Local connection successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Local connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testing connection to 192.168.1.6:8080..."
try {
    $response = Invoke-WebRequest -Uri "http://192.168.1.6:8080/api/auth/profile" -TimeoutSec 5
    Write-Host "✅ Network connection successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Network connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Press Enter to continue..."
