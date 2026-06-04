Add-Type -AssemblyName System.Drawing
$dir = $PSScriptRoot

function Make($file, $color, $type) {
    $bmp = New-Object System.Drawing.Bitmap 81, 81
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.Clear([System.Drawing.Color]::Transparent)
    $c = [System.Drawing.ColorTranslator]::FromHtml($color)
    $brush = New-Object System.Drawing.SolidBrush $c
    $pen = New-Object System.Drawing.Pen $c, 6
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'

    if ($type -eq 'home') {
        # 房子轮廓
        $pts = @(
            (New-Object System.Drawing.PointF 40, 12),
            (New-Object System.Drawing.PointF 12, 40),
            (New-Object System.Drawing.PointF 20, 40),
            (New-Object System.Drawing.PointF 20, 68),
            (New-Object System.Drawing.PointF 60, 68),
            (New-Object System.Drawing.PointF 60, 40),
            (New-Object System.Drawing.PointF 68, 40)
        )
        $g.DrawPolygon($pen, $pts)
        # 门
        $g.FillRectangle($brush, 33, 48, 14, 20)
    }
    else {
        # 头部圆
        $g.FillEllipse($brush, 28, 16, 25, 25)
        # 身体半圆
        $g.FillPie($brush, 14, 42, 53, 53, 180, 180)
        # 透明背景下方裁剪
        $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::Transparent)), 0, 70, 81, 11)
    }

    $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

Make (Join-Path $dir 'home.png')   '#999999' 'home'
Make (Join-Path $dir 'home_a.png') '#4ADE80' 'home'
Make (Join-Path $dir 'mine.png')   '#999999' 'mine'
Make (Join-Path $dir 'mine_a.png') '#4ADE80' 'mine'

Get-ChildItem $dir -Filter *.png | Select-Object Name, Length
