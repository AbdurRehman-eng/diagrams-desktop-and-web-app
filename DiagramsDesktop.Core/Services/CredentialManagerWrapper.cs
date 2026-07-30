using System;
using System.Runtime.InteropServices;
using System.Text;
using System.ComponentModel;

namespace DiagramsDesktop.Core.Services;

public class CredentialManagerWrapper
{
    private const int CRED_TYPE_GENERIC = 1;
    private const int CRED_PERSIST_LOCAL_MACHINE = 2;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CREDENTIALW
    {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string? TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true, EntryPoint = "CredWriteW")]
    private static extern bool CredWriteW(ref CREDENTIALW credential, int flags);

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true, EntryPoint = "CredReadW")]
    private static extern bool CredReadW(string targetName, int type, int flags, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true, EntryPoint = "CredDeleteW")]
    private static extern bool CredDeleteW(string targetName, int type, int flags);

    [DllImport("advapi32.dll", EntryPoint = "CredFree")]
    private static extern void CredFree(IntPtr buffer);

    public static bool SaveSecret(string targetName, string username, string secretValue)
    {
        if (string.IsNullOrEmpty(targetName)) throw new ArgumentNullException(nameof(targetName));
        if (secretValue == null) throw new ArgumentNullException(nameof(secretValue));

        var secretBytes = Encoding.UTF8.GetBytes(secretValue);
        var blobPtr = Marshal.AllocHGlobal(secretBytes.Length);

        try
        {
            Marshal.Copy(secretBytes, 0, blobPtr, secretBytes.Length);

            var credential = new CREDENTIALW
            {
                Flags = 0,
                Type = CRED_TYPE_GENERIC,
                TargetName = targetName,
                Comment = "GML Credential Secret Value",
                LastWritten = new System.Runtime.InteropServices.ComTypes.FILETIME(),
                CredentialBlobSize = secretBytes.Length,
                CredentialBlob = blobPtr,
                Persist = CRED_PERSIST_LOCAL_MACHINE,
                AttributeCount = 0,
                Attributes = IntPtr.Zero,
                TargetAlias = null,
                UserName = username
            };

            var success = CredWriteW(ref credential, 0);
            if (!success)
            {
                int error = Marshal.GetLastWin32Error();
                throw new Win32Exception(error);
            }
            return success;
        }
        finally
        {
            Marshal.FreeHGlobal(blobPtr);
        }
    }

    public static string? ReadSecret(string targetName)
    {
        if (string.IsNullOrEmpty(targetName)) return null;

        if (CredReadW(targetName, CRED_TYPE_GENERIC, 0, out var credentialPtr))
        {
            try
            {
                var credential = Marshal.PtrToStructure<CREDENTIALW>(credentialPtr);
                if (credential.CredentialBlobSize > 0 && credential.CredentialBlob != IntPtr.Zero)
                {
                    var blobBytes = new byte[credential.CredentialBlobSize];
                    Marshal.Copy(credential.CredentialBlob, blobBytes, 0, credential.CredentialBlobSize);
                    return Encoding.UTF8.GetString(blobBytes);
                }
            }
            finally
            {
                CredFree(credentialPtr);
            }
        }
        return null;
    }

    public static bool DeleteSecret(string targetName)
    {
        if (string.IsNullOrEmpty(targetName)) return false;

        var success = CredDeleteW(targetName, CRED_TYPE_GENERIC, 0);
        if (!success)
        {
            int error = Marshal.GetLastWin32Error();
            // Note: Error 1168 (ERROR_NOT_FOUND) means credential doesn't exist, which is a warning we can ignore.
            if (error != 1168)
            {
                System.Diagnostics.Debug.WriteLine($"[CredentialManagerWrapper] CredDeleteW failed for {targetName} with error code: {error}");
            }
        }
        return success;
    }
}
