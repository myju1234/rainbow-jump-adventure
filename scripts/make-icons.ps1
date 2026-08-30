# 여우 원본 이미지(1024px)를 각 플랫폼이 요구하는 아이콘 크기로 변환합니다.
# 이 파일은 반드시 UTF-8 BOM으로 저장해야 합니다. BOM이 없으면 Windows PowerShell이
# 한글을 ANSI로 잘못 읽어 스크립트 일부가 실행되지 않고 그대로 출력됩니다.
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
param(
  [string]$Source = "assets/icon-source.png",
  [string]$Maskable = "assets/icon-source-maskable.png"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot

function Resize-Icon([string]$from, [string]$to, [int]$size) {
  $src = [System.Drawing.Image]::FromFile((Join-Path $root $from))
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $gfx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $gfx.DrawImage($src, 0, 0, $size, $size)

  $target = Join-Path $root $to
  $dir = Split-Path -Parent $target
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)

  $gfx.Dispose(); $bmp.Dispose(); $src.Dispose()
  Write-Host ("  {0} ({1}x{1})" -f $to, $size)
}

Write-Host "[1/2] Expo / web icons"
Resize-Icon $Source   "assets/icon.png"                            1024
Resize-Icon $Maskable "assets/adaptive-icon.png"                   1024
Resize-Icon $Source   "public/icons/icon-192.png"                  192
Resize-Icon $Source   "public/icons/icon-512.png"                  512
Resize-Icon $Maskable "public/icons/icon-maskable-512.png"         512
Resize-Icon $Source   "public/icons/apple-touch-icon.png"          180
Resize-Icon $Source   "public/favicon.png"                         64

Write-Host "[2/2] Android launcher icons"
$launcher = [ordered]@{ mdpi = 48; hdpi = 72; xhdpi = 96; xxhdpi = 144; xxxhdpi = 192 }
$foreground = @{ mdpi = 108; hdpi = 162; xhdpi = 216; xxhdpi = 324; xxxhdpi = 432 }
foreach ($dpi in $launcher.Keys) {
  Resize-Icon $Source   "android/app/src/main/res/mipmap-$dpi/ic_launcher.png"            $launcher[$dpi]
  Resize-Icon $Source   "android/app/src/main/res/mipmap-$dpi/ic_launcher_round.png"      $launcher[$dpi]
  Resize-Icon $Maskable "android/app/src/main/res/mipmap-$dpi/ic_launcher_foreground.png" $foreground[$dpi]
}

Write-Host "Done."
