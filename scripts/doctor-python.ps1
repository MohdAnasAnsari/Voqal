$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Write-Host "== Command resolution =="
Get-Command python,py,pip,pip3 -ErrorAction SilentlyContinue |
  Select-Object Name,Source,Version |
  Format-Table -AutoSize

Write-Host "`n== Active python =="
try {
  & python -c "import sys; print(sys.version); print(sys.executable)"
} catch {
  Write-Host "python not found on PATH"
}

Write-Host "`n== Recommended install command =="
Write-Host "python -m pip install -r .\\backend\\requirements.txt"

Write-Host "`nIf 'pip' points to an old Python (e.g. Python310\\Scripts\\pip.exe), remove that entry from your PATH or uninstall the old Python."

