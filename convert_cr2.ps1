Add-Type -AssemblyName PresentationCore

function Convert-Image {
    param([string]$in, [string]$out)
    try {
        $fs = New-Object System.IO.FileStream($in, [System.IO.FileMode]::Open)
        $decoder = [System.Windows.Media.Imaging.BitmapDecoder]::Create($fs, [System.Windows.Media.Imaging.BitmapCreateOptions]::PreservePixelFormat, [System.Windows.Media.Imaging.BitmapCacheOption]::Default)
        $frame = $decoder.Frames[0]
        
        $encoder = New-Object System.Windows.Media.Imaging.JpegBitmapEncoder
        $encoder.Frames.Add($frame)
        
        $outFs = New-Object System.IO.FileStream($out, [System.IO.FileMode]::Create)
        $encoder.Save($outFs)
        $outFs.Close()
        $fs.Close()
        Write-Host "Converted $in to $out"
    } catch {
        Write-Host "Error converting $in : $_"
    }
}

Convert-Image -in "MS2.CR2" -out "MS2.jpg"
