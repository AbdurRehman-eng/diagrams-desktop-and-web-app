param (
    [string]$TargetDir,
    [string]$Password
)

Write-Output "[EncryptData] Target Directory: $TargetDir"
if (-not (Test-Path $TargetDir)) {
    Write-Error "[EncryptData] Target directory does not exist: $TargetDir"
    exit 1
}

# Salt (must match CsvEncryption.cs salt)
$Salt = [byte[]](0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76)

$files = Get-ChildItem -Path $TargetDir -Filter "*.csv"
foreach ($file in $files) {
    Write-Output "[EncryptData] Encrypting file: $($file.FullName)"
    $clearBytes = [System.IO.File]::ReadAllBytes($file.FullName)
    
    # Check magic header: 'G','M','L','E','N','C' (71, 77, 76, 69, 78, 67)
    if ($clearBytes.Length -ge 6 -and 
        $clearBytes[0] -eq 71 -and $clearBytes[1] -eq 77 -and $clearBytes[2] -eq 76 -and 
        $clearBytes[3] -eq 69 -and $clearBytes[4] -eq 78 -and $clearBytes[5] -eq 67) {
        Write-Output "[EncryptData] File already encrypted. Skipping."
        continue
    }

    # Initialize AES
    $aes = [System.Security.Cryptography.Aes]::Create()
    $pdb = New-Object System.Security.Cryptography.Rfc2898DeriveBytes($Password, $Salt, 1000, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    $aes.Key = $pdb.GetBytes(32)
    $aes.IV = $pdb.GetBytes(16)
    
    # Cryptographic Write
    $ms = New-Object System.IO.MemoryStream
    $cs = New-Object System.Security.Cryptography.CryptoStream($ms, $aes.CreateEncryptor(), [System.Security.Cryptography.CryptoStreamMode]::Write)
    $cs.Write($clearBytes, 0, $clearBytes.Length)
    $cs.FlushFinalBlock()
    $cipherBytes = $ms.ToArray()
    
    # Clean up crypto resources
    $cs.Dispose()
    $ms.Dispose()
    $aes.Dispose()
    $pdb.Dispose()

    # Prepend GMLENC magic bytes
    $magicBytes = [byte[]](71, 77, 76, 69, 78, 67)
    $finalBytes = New-Object byte[] ($magicBytes.Length + $cipherBytes.Length)
    [System.Buffer]::BlockCopy($magicBytes, 0, $finalBytes, 0, $magicBytes.Length)
    [System.Buffer]::BlockCopy($cipherBytes, 0, $finalBytes, $magicBytes.Length, $cipherBytes.Length)

    # Overwrite the original file with encrypted data
    [System.IO.File]::WriteAllBytes($file.FullName, $finalBytes)
    Write-Output "[EncryptData] Successfully encrypted $($file.Name)"
}
