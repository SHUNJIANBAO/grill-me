$ErrorActionPreference = 'Stop'

$source = Join-Path $PSScriptRoot 'SKILL.md'
if (!(Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Skill source not found: $source"
}

$targetDir = Join-Path $HOME '.agents\skills\grill-me'
$target = Join-Path $targetDir 'SKILL.md'

if (Test-Path -LiteralPath $target -PathType Leaf) {
    $sourceText = [System.IO.File]::ReadAllText($source).Replace("`r`n", "`n").Replace("`r", "`n")
    $targetText = [System.IO.File]::ReadAllText($target).Replace("`r`n", "`n").Replace("`r", "`n")
    if ($sourceText -cne $targetText) {
        throw "Refusing to overwrite a different skill at '$target'. Back it up or merge changes, then rerun."
    }
    Write-Output "grill-me skill is already installed: $target"
    return
}

New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
Copy-Item -LiteralPath $source -Destination $target
Write-Output "Installed grill-me skill: $target"
