using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace DiagramsDesktop;

public static class CsvEncryption
{
    private static readonly byte[] Salt = new byte[] { 0x49, 0x76, 0x61, 0x6e, 0x20, 0x4d, 0x65, 0x64, 0x76, 0x65, 0x64, 0x65, 0x76 }; // fixed salt

    public static byte[] Encrypt(byte[] clearBytes, string password)
    {
        using (var aes = Aes.Create())
        {
            aes.Key = Rfc2898DeriveBytes.Pbkdf2(password, Salt, 1000, HashAlgorithmName.SHA256, 32);
            aes.IV = Rfc2898DeriveBytes.Pbkdf2(password, Salt, 1000, HashAlgorithmName.SHA256, 16);
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(clearBytes, 0, clearBytes.Length);
                    cs.FlushFinalBlock();
                }
                return ms.ToArray();
            }
        }
    }

    public static byte[] Decrypt(byte[] cipherBytes, string password)
    {
        using (var aes = Aes.Create())
        {
            aes.Key = Rfc2898DeriveBytes.Pbkdf2(password, Salt, 1000, HashAlgorithmName.SHA256, 32);
            aes.IV = Rfc2898DeriveBytes.Pbkdf2(password, Salt, 1000, HashAlgorithmName.SHA256, 16);
            using (var ms = new MemoryStream())
            {
                using (var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
                {
                    cs.Write(cipherBytes, 0, cipherBytes.Length);
                    cs.FlushFinalBlock();
                }
                return ms.ToArray();
            }
        }
    }
}
