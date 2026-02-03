# =====================================================
# Administrative Vault v1.0 Installer (Windows)
# =====================================================

Clear-Host
Write-Host ""
Write-Host "Administrative Vault v1.0 Installer"
Write-Host "-----------------------------------"
Write-Host ""

# -----------------------------------------------------
# Safety check: must be run from project root
# -----------------------------------------------------
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found."
    Write-Host "Please run this installer from the project root folder."
    Read-Host "Press ENTER to exit"
    exit 1
}

# -----------------------------------------------------
# Check Node.js
# -----------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not detected."
    Write-Host ""
    Write-Host "Please install Node.js (LTS) from:"
    Write-Host "https://nodejs.org"
    Write-Host ""
    Write-Host "Then re-run this installer."
    Read-Host "Press ENTER to exit"
    exit 1
}

# -----------------------------------------------------
# Check npm
# -----------------------------------------------------
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: npm not detected."
    Write-Host "Your Node.js installation appears incomplete."
    Read-Host "Press ENTER to exit"
    exit 1
}

Write-Host "Node.js detected:"
node -v
Write-Host "npm detected:"
npm -v
Write-Host ""

# -----------------------------------------------------
# Install dependencies
# -----------------------------------------------------
Write-Host "Installing dependencies..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed."
    Read-Host "Press ENTER to exit"
    exit 1
}

# -----------------------------------------------------
# Build production bundle
# -----------------------------------------------------
Write-Host ""
Write-Host "Building Administrative Vault..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed."
    Read-Host "Press ENTER to exit"
    exit 1
}

# -----------------------------------------------------
# Create Desktop Shortcut
# -----------------------------------------------------
try {
    $desktop = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = Join-Path $desktop "Administrative Vault.lnk"

    $wsh = New-Object -ComObject WScript.Shell
    $shortcut = $wsh.CreateShortcut($shortcutPath)

    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoExit -Command `"cd '$PWD'; npm run preview`""
    $shortcut.WorkingDirectory = $PWD

    if (Test-Path "$PWD\public\favicon.ico") {
        $shortcut.IconLocation = "$PWD\public\favicon.ico,0"
    }

    $shortcut.Save()
    Write-Host "Desktop shortcut created."
}
catch {
    Write-Host "WARNING: Desktop shortcut could not be created."
}

# -----------------------------------------------------
# Start preview server in new PowerShell window
# -----------------------------------------------------
Write-Host ""
Write-Host "Starting Administrative Vault..."
Write-Host ""

Start-Process powershell `
    -ArgumentList '-NoExit', '-Command', 'npm run preview' `
    -WorkingDirectory $PWD

# -----------------------------------------------------
# Open browser
# -----------------------------------------------------
Start-Sleep -Seconds 2
Start-Process "http://localhost:4173"

# -----------------------------------------------------
# Final message
# -----------------------------------------------------
Write-Host ""
Write-Host "-----------------------------------"
Write-Host "Installation COMPLETE"
Write-Host "-----------------------------------"
Write-Host ""
Write-Host "Administrative Vault is now installed and running."
Write-Host ""
Write-Host "• Server: http://localhost:4173"
Write-Host "• Desktop shortcut created"
Write-Host ""
Write-Host "You may close this window at any time."
Write-Host ""

Read-Host "Press ENTER to finish"
