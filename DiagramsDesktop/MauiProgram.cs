using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Threading.Tasks;
using System;
using DiagramsDesktop.Core.Repositories;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop;

public static class MauiProgram
{
    public static string LocalServerUrl { get; private set; } = "http://127.0.0.1:5000";

    public static void LogToFile(string message)
    {
        try
        {
            var appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DiagramsDesktop");
            Directory.CreateDirectory(appDataFolder);
            var logPath = Path.Combine(appDataFolder, "startup.log");
            File.AppendAllText(logPath, $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {message}{Environment.NewLine}");
        }
        catch
        {
            // Ignore logging failures
        }
    }

    public static MauiApp CreateMauiApp()
    {
#if WINDOWS
        // Redirect WebView2 cache to a writable AppData path to prevent Program Files write-permission issues
        var wWebView2CachePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DiagramsDesktop", "WebView2Cache");
        try
        {
            Directory.CreateDirectory(wWebView2CachePath);
            Environment.SetEnvironmentVariable("WEBVIEW2_USER_DATA_FOLDER", wWebView2CachePath);
            LogToFile($"[WebView2] Redirected user data folder to: {wWebView2CachePath}");
        }
        catch (Exception ex)
        {
            LogToFile($"[WebView2] Failed to set cache directory: {ex.Message}");
        }
#endif

        LogToFile("=========================================");
        LogToFile("Application Starting...");
        LogToFile($"AppContext.BaseDirectory: {AppContext.BaseDirectory}");
        LogToFile($"Current Directory: {Environment.CurrentDirectory}");
        
        var webRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        LogToFile($"webRootPath: {webRootPath} (Exists: {Directory.Exists(webRootPath)})");

        // 1. Determine local database path and initialize database schema
        var appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DiagramsDesktop");
        var dbPath = Path.Combine(appDataFolder, "diagrams.db");
        var connectionString = $"Data Source={dbPath}";

        try
        {
            var dbInitializer = new DiagramDbInitializer(connectionString);
            dbInitializer.InitializeDatabase();
            LogToFile($"[Database] Successfully initialized at: {dbPath}");
            System.Diagnostics.Debug.WriteLine($"[Database] Successfully initialized at: {dbPath}");
        }
        catch (Exception ex)
        {
            LogToFile($"[Database] Initialization failed: {ex.Message}");
            System.Diagnostics.Debug.WriteLine($"[Database] Initialization failed: {ex.Message}");
        }

        // 2. Start local ASP.NET Core server in the background
        StartLocalServer(connectionString);

        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }

    private static void StartLocalServer(string connectionString)
    {
        int port = GetFreeTcpPort();
        LocalServerUrl = $"http://127.0.0.1:{port}";
        LogToFile($"[LocalServer] Allocating port {port}. Base URL: {LocalServerUrl}");
        System.Diagnostics.Debug.WriteLine($"[LocalServer] Allocating port {port}. Base URL: {LocalServerUrl}");

        Task.Run(() =>
        {
            try
            {
                LogToFile("[LocalServer] Background thread starting Kestrel...");
                var builder = WebApplication.CreateBuilder(new WebApplicationOptions
                {
                    ContentRootPath = AppContext.BaseDirectory,
                    Args = Array.Empty<string>()
                });

                // Listen only on IPv4 loopback address (127.0.0.1) for security and alignment
                builder.WebHost.ConfigureKestrel(options =>
                {
                    options.Listen(IPAddress.Loopback, port);
                });

                // Configure Services and Inject dependencies
                builder.Services.AddSingleton<IDiagramCanvasRepository>(new DiagramCanvasRepository(connectionString));
                builder.Services.AddSingleton<IDiagramCanvasService, DiagramCanvasService>();
                builder.Services.AddSingleton<IConnectionRepository>(new ConnectionRepository(connectionString));
                builder.Services.AddSingleton<IConnectionService, ConnectionService>();

                builder.Services.AddControllers()
                    .AddJsonOptions(options =>
                    {
                        options.JsonSerializerOptions.PropertyNamingPolicy = null;
                    });

                builder.Services.AddCors(options =>
                {
                    options.AddPolicy("AllowAll", policy =>
                    {
                        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                    });
                });

                var app = builder.Build();

                app.UseCors("AllowAll");

                // Serve static files from the wwwroot directory in output path
                var webRootPath = Path.Combine(AppContext.BaseDirectory, "wwwroot");
                if (Directory.Exists(webRootPath))
                {
                    app.UseDefaultFiles(new DefaultFilesOptions
                    {
                        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRootPath),
                        RequestPath = ""
                    });

                    app.UseStaticFiles(new StaticFileOptions
                    {
                        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(webRootPath),
                        RequestPath = ""
                    });
                }
                else
                {
                    LogToFile($"[LocalServer] Warning: wwwroot path does not exist at {webRootPath}");
                    System.Diagnostics.Debug.WriteLine($"[LocalServer] Warning: wwwroot path does not exist at {webRootPath}");
                }

                app.MapControllers();

                LogToFile($"[LocalServer] Running WebApplication on port {port}...");
                app.Run();
                LogToFile("[LocalServer] WebApplication has shut down.");
            }
            catch (Exception ex)
            {
                LogToFile($"[LocalServer] Failed to start: {ex.GetType().Name} - {ex.Message}{Environment.NewLine}{ex.StackTrace}");
                System.Diagnostics.Debug.WriteLine($"[LocalServer] Failed to start: {ex.Message}");
            }
        });
    }

    private static int GetFreeTcpPort()
    {
        try
        {
            var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }
        catch (Exception ex)
        {
            LogToFile($"[GetFreeTcpPort] Error: {ex.Message}. Falling back to 5000.");
            // fallback
            return 5000;
        }
    }
}
