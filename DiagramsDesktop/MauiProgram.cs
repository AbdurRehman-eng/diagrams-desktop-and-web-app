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
    public static string LocalServerUrl { get; private set; } = "http://localhost:5000";

    public static MauiApp CreateMauiApp()
    {
        // 1. Determine local database path and initialize database schema
        var appDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DiagramsDesktop");
        var dbPath = Path.Combine(appDataFolder, "diagrams.db");
        var connectionString = $"Data Source={dbPath}";

        try
        {
            var dbInitializer = new DiagramDbInitializer(connectionString);
            dbInitializer.InitializeDatabase();
            System.Diagnostics.Debug.WriteLine($"[Database] Successfully initialized at: {dbPath}");
        }
        catch (Exception ex)
        {
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
        LocalServerUrl = $"http://localhost:{port}";
        System.Diagnostics.Debug.WriteLine($"[LocalServer] Allocating port {port}. Base URL: {LocalServerUrl}");

        Task.Run(() =>
        {
            try
            {
                var builder = WebApplication.CreateBuilder();

                // Listen only on loopback address for security
                builder.WebHost.ConfigureKestrel(options =>
                {
                    options.Listen(IPAddress.Loopback, port);
                });

                // Configure Services and Inject dependencies
                builder.Services.AddSingleton<IDiagramCanvasRepository>(new DiagramCanvasRepository(connectionString));
                builder.Services.AddSingleton<IDiagramCanvasService, DiagramCanvasService>();

                builder.Services.AddControllers();

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
                    System.Diagnostics.Debug.WriteLine($"[LocalServer] Warning: wwwroot path does not exist at {webRootPath}");
                }

                app.MapControllers();

                app.Run();
            }
            catch (Exception ex)
            {
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
        catch
        {
            // fallback
            return 5000;
        }
    }
}
