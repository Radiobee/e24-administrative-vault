param (
    [string]$Tag = "v1.0.0"
)

# -----------------------------
# Preconditions
# -----------------------------

# Ensure git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is required but not found in PATH."
    exit 1
}

# Verify tag exists
$tagExists = git tag --list $Tag
if (-not $tagExists) {
    Write-Error "Git tag '$Tag' does not exist."
    exit 1
}

# -----------------------------
# Metadata
# -----------------------------

$repoName   = Split-Path (Get-Location) -Leaf
$outputFile = "RELEASE-$Tag.md"

$commitDate = git log -1 --format=%ad $Tag
$commitHash = git rev-list -n 1 $Tag

# -----------------------------
# Release Notes
# -----------------------------

$notes = @"
# $repoName — Release $Tag

**Release type:** Initial public release  
**Scope:** Local-only administrative vault  
**Telemetry:** None  
**Network activity:** None  
**Execution model:** User-invoked only  

---

## Integrity

- Git tag: `$Tag`
- Commit: `$commitHash`
- Date: $commitDate
- All files tracked via Git
- No background services
- No auto-execution

---

## Contents

- Vite + TypeScript frontend
- PowerShell automation utilities
- Local filesystem operations only
- No cloud dependencies
- No telemetry
- No hidden processes

---

## Usage

1. Install Node.js
2. Run `npm install`
3. Run `npm run dev`
4. PowerShell scripts must be run manually

---

## Notes

This release is intentionally minimal and auditable.
It is designed for inspection, not persuasion.

"@

# -----------------------------
# Write file
# -----------------------------

$notes | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "[OK] Release notes generated: $outputFile"
