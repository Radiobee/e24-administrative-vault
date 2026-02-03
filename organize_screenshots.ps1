$source = 'C:\Users\9jame\OneDrive\Pictures\Screenshots'
$baseArchive = 'C:\Users\9jame\OneDrive\Desktop\e24-administrative-vault\_screenshots'

$map = @{
    'WellsFargo' = 'banks\wells_fargo'
    'Mercury'    = 'banks\mercury'
    'USPS'       = 'mail\usps'
    'Court'      = 'court'
    'UCC'        = 'ucc'
    'Treasury'   = 'treasury'
}

if (-not (Test-Path $baseArchive)) {
    New-Item -ItemType Directory -Path $baseArchive | Out-Null
}

Get-ChildItem $source -File | ForEach-Object {
    $file = $_
    $moved = $false

    foreach ($key in $map.Keys) {
        if ($file.Name -match $key) {
            $dest = Join-Path $baseArchive $map[$key]
            if (-not (Test-Path $dest)) {
                New-Item -ItemType Directory -Path $dest -Force | Out-Null
            }
            Move-Item $file.FullName (Join-Path $dest $file.Name)
            $moved = $true
            break
        }
    }

    if (-not $moved) {
        $misc = Join-Path $baseArchive 'misc'
        if (-not (Test-Path $misc)) {
            New-Item -ItemType Directory -Path $misc | Out-Null
        }
        Move-Item $file.FullName (Join-Path $misc $file.Name)
    }
}

Write-Host 'Screenshot organization complete.'
Write-Host "Source:            $source"
Write-Host "Internal archive:  $baseArchive"
