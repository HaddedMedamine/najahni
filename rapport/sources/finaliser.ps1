# Met a jour la table des matieres et les listes (figures, tableaux) avec Word, puis exporte le PDF.
param([string]$Docx = "$PSScriptRoot\..\Rapport_PFA_Najahni.docx")
$Docx = (Resolve-Path $Docx).Path
$Pdf = [System.IO.Path]::ChangeExtension($Docx, ".pdf")
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($Docx)
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Save()
    $doc.ExportAsFixedFormat($Pdf, 17)   # 17 = wdExportFormatPDF
    "Pages : " + $doc.ComputeStatistics(2)
    $doc.Close()
    "PDF : $Pdf"
} finally {
    $word.Quit()
}
