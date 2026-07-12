using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace DiagramsDesktop;

public partial class MainPage : ContentPage
{
	public MainPage()
	{
		InitializeComponent();
		LoadWebViewAsync();
	}

	private async void LoadWebViewAsync()
	{
		string url = MauiProgram.LocalServerUrl;
		bool isServerResponsive = false;

		MauiProgram.LogToFile($"[WebView] Starting polling loop for Kestrel server at {url}...");

		// Poll the local server to verify it has fully started up and is listening.
		// This avoids a race condition where the WebView tries to connect before Kestrel is ready.
		using (var client = new HttpClient())
		{
			client.Timeout = TimeSpan.FromMilliseconds(500);
			int maxTries = 40; // Try for up to 20 seconds
			for (int i = 0; i < maxTries; i++)
			{
				try
				{
					// Any response (even a 404/500) indicates Kestrel is listening on the port.
					var response = await client.GetAsync(url);
					isServerResponsive = true;
					MauiProgram.LogToFile($"[WebView] Kestrel responded successfully on try {i + 1}.");
					break;
				}
				catch
				{
					// Server is not ready yet; wait 500ms and retry
					await Task.Delay(500);
				}
			}
		}

		if (isServerResponsive)
		{
			// Once the port is open and responding, set the WebView Source to navigate
			DiagramWebView.Source = url;
		}
		else
		{
			var logPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "DiagramsDesktop", "startup.log");
			MauiProgram.LogToFile($"[WebView] Error: Kestrel server did not respond at {url} after 20 seconds.");

			// Show a professional error page instead of a blank screen
			DiagramWebView.Source = new HtmlWebViewSource
			{
				Html = $@"
<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8' />
<style>
body {{
    background-color: #0f172a;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
    text-align: center;
    padding: 16px;
}}
.card {{
    background-color: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 32px;
    max-width: 480px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}}
h1 {{
    color: #f43f5e;
    font-size: 22px;
    margin-top: 0;
    font-weight: 600;
}}
p {{
    color: #94a3b8;
    font-size: 14px;
    line-height: 1.6;
    margin-bottom: 20px;
}}
.btn {{
    background-color: #6366f1;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    margin-top: 8px;
    text-decoration: none;
    display: inline-block;
    transition: background-color 0.2s;
}}
.btn:hover {{
    background-color: #4f46e5;
}}
.log-path {{
    font-family: 'Courier New', Courier, monospace;
    background-color: #020617;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 11px;
    color: #cbd5e1;
    word-break: break-all;
    user-select: all;
    text-align: left;
    border: 1px solid #1e293b;
}}
</style>
</head>
<body>
<div class='card'>
    <h1>Local Server Connection Timeout</h1>
    <p>The local application server failed to respond within 20 seconds. This can happen if a firewall, anti-virus, or permission restriction is blocking loopback ports, or if a runtime dependency failed to load.</p>
    <p style='text-align: left; font-weight: 500; margin-bottom: 4px; color: #cbd5e1;'>Diagnostic Log File:</p>
    <div class='log-path'>{logPath}</div>
    <p style='font-size: 12px; margin-top: 8px; color: #64748b;'>Please check the file above to see the exact error.</p>
    <button class='btn' onclick='window.location.reload()'>Retry Connection</button>
</div>
</body>
</html>"
			};
		}
	}
}
