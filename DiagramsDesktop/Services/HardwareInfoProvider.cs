using System;
using System.Management;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;
using DiagramsDesktop.Core.Models;

namespace DiagramsDesktop.Services;

public interface IHardwareInfoProvider
{
    HardwareInfoV1 GetHardwareInfo();
}

public class HardwareInfoProvider : IHardwareInfoProvider
{
    public HardwareInfoV1 GetHardwareInfo()
    {
        var info = new HardwareInfoV1
        {
            SystemUuid = GetSystemUuid(),
            MotherboardSerial = GetMotherboardSerial(),
            BiosSerial = GetBiosSerial(),
            CpuId = GetCpuId(),
            PrimaryDiskSerial = GetPrimaryDiskSerial(),
            OsMachineGuid = GetOsMachineGuid(),
            MacPrimary = GetPrimaryMacAddress()
        };

        info.HardwareFingerprint = GenerateFingerprint(info);
        return info;
    }

    private static string GetSystemUuid()
    {
        return GetWmiValue("Win32_ComputerSystemProduct", "UUID");
    }

    private static string GetMotherboardSerial()
    {
        return GetWmiValue("Win32_BaseBoard", "SerialNumber");
    }

    private static string GetBiosSerial()
    {
        return GetWmiValue("Win32_Bios", "SerialNumber");
    }

    private static string GetCpuId()
    {
        return GetWmiValue("Win32_Processor", "ProcessorId");
    }

    private static string GetPrimaryDiskSerial()
    {
        return GetWmiValue("Win32_DiskDrive", "SerialNumber");
    }

    private static string GetOsMachineGuid()
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
            var val = key?.GetValue("MachineGuid")?.ToString();
            if (!string.IsNullOrWhiteSpace(val))
            {
                return val.Trim();
            }
        }
        catch
        {
            // Fallback
        }
        return string.Empty;
    }

    private static string GetPrimaryMacAddress()
    {
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus == OperationalStatus.Up && 
                    ni.NetworkInterfaceType != NetworkInterfaceType.Loopback && 
                    ni.NetworkInterfaceType != NetworkInterfaceType.Tunnel)
                {
                    var mac = ni.GetPhysicalAddress().ToString();
                    if (!string.IsNullOrEmpty(mac))
                    {
                        // Format MAC as XX:XX:XX:XX:XX:XX for consistency
                        var formattedMac = new StringBuilder();
                        for (int i = 0; i < mac.Length; i++)
                        {
                            formattedMac.Append(mac[i]);
                            if (i % 2 == 1 && i < mac.Length - 1)
                            {
                                formattedMac.Append(':');
                            }
                        }
                        return formattedMac.ToString();
                    }
                }
            }
        }
        catch
        {
            // Fallback
        }
        return string.Empty;
    }

    private static string GetWmiValue(string table, string property)
    {
        try
        {
            using var searcher = new ManagementObjectSearcher($"SELECT {property} FROM {table}");
            using var collection = searcher.Get();
            foreach (var obj in collection)
            {
                var val = obj[property]?.ToString();
                if (!string.IsNullOrWhiteSpace(val))
                {
                    return val.Trim();
                }
            }
        }
        catch
        {
            // Ignore WMI errors (WMI database could be corrupt, restricted access, etc.)
        }
        return string.Empty;
    }

    private static string GenerateFingerprint(HardwareInfoV1 info)
    {
        // Trim, convert to lowercase, and join values to compute a unique SHA-256 fingerprint hash
        var uuid = (info.SystemUuid ?? string.Empty).Trim().ToLowerInvariant();
        var mb = (info.MotherboardSerial ?? string.Empty).Trim().ToLowerInvariant();
        var bios = (info.BiosSerial ?? string.Empty).Trim().ToLowerInvariant();
        var cpu = (info.CpuId ?? string.Empty).Trim().ToLowerInvariant();
        var disk = (info.PrimaryDiskSerial ?? string.Empty).Trim().ToLowerInvariant();
        var guid = (info.OsMachineGuid ?? string.Empty).Trim().ToLowerInvariant();
        var mac = (info.MacPrimary ?? string.Empty).Trim().ToLowerInvariant();

        var combinedString = $"{uuid}:{mb}:{bios}:{cpu}:{disk}:{guid}:{mac}";
        byte[] inputBytes = Encoding.UTF8.GetBytes(combinedString);
        byte[] hashBytes = SHA256.HashData(inputBytes);

        var sb = new StringBuilder();
        foreach (byte b in hashBytes)
        {
            sb.Append(b.ToString("x2"));
        }
        return sb.ToString();
    }
}
