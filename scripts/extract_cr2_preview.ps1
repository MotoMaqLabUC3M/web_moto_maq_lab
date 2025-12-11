# Extrae la vista previa JPEG embebida dentro de un archivo CR2
# Uso: ejecuta este script desde PowerShell

param(
    [string]$inFile = 'd:\\Moto\\web\\fotos\\4F3A1709.CR2',
    [string]$outFile = 'd:\\Moto\\web\\fotos\\4F3A1709.jpg'
)

if (-not (Test-Path $inFile)){
    Write-Error "Archivo de entrada no encontrado: $inFile"
    exit 1
}

$bytes = [System.IO.File]::ReadAllBytes($inFile)
$start = -1
$end = -1

# Buscar SOI (0xFF 0xD8)
for ($i = 0; $i -lt $bytes.Length - 1; $i++) {
    if ($bytes[$i] -eq 0xFF -and $bytes[$i+1] -eq 0xD8) {
        $start = $i
        break
    }
}

# Buscar EOI (0xFF 0xD9) buscando desde el final
for ($i = $bytes.Length - 2; $i -ge 0; $i--) {
    if ($bytes[$i] -eq 0xFF -and $bytes[$i+1] -eq 0xD9) {
        $end = $i + 1
        break
    }
}

if ($start -ge 0 -and $end -ge $start) {
    $length = $end - $start + 1
    $out = New-Object byte[] $length
    [System.Array]::Copy($bytes, $start, $out, 0, $length)
    [System.IO.File]::WriteAllBytes($outFile, $out)
    Write-Output "Extracción completada: $outFile"
    exit 0
} else {
    Write-Error "No se encontró un preview JPEG dentro del CR2."
    exit 2
}
