$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

param(
  [string]$Python = "python",
  [string]$BackendDir = "backend"
)

$requirementsPath = Join-Path $BackendDir "requirements.txt"
if (-not (Test-Path -LiteralPath $requirementsPath)) {
  throw "Missing requirements file: $requirementsPath"
}

$venvDir = Join-Path $BackendDir ".venv"
$venvPython = Join-Path $venvDir "Scripts\\python.exe"

if (-not (Test-Path -LiteralPath $venvPython)) {
  Write-Host "Creating venv at $venvDir using '$Python'..."
  & $Python -m venv $venvDir
}

Write-Host "Upgrading pip..."
& $venvPython -m pip install --upgrade pip

Write-Host "Installing backend requirements from $requirementsPath..."
& $venvPython -m pip install -r $requirementsPath

Write-Host "Done. Activate with: $venvDir\\Scripts\\Activate.ps1"

