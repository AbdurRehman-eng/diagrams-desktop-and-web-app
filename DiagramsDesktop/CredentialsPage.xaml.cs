using System;
using Microsoft.Maui.Controls;

namespace DiagramsDesktop;

public partial class CredentialsPage : ContentPage
{
	public CredentialsPage()
	{
		InitializeComponent();

#if WINDOWS
		CredentialsWebView.Navigating += (s, e) => TryHookScriptDialog();
		CredentialsWebView.Navigated += (s, e) => TryHookScriptDialog();
		CredentialsWebView.HandlerChanged += (s, e) => TryHookScriptDialog();
#endif

		LoadCredentialsUrl();
	}

#if WINDOWS
	private void TryHookScriptDialog()
	{
		try
		{
			if (CredentialsWebView.Handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 winWebView)
			{
				if (winWebView.CoreWebView2 != null)
				{
					winWebView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = false; // Disable default dialogs!
					winWebView.CoreWebView2.ScriptDialogOpening -= CoreWebView2_ScriptDialogOpening;
					winWebView.CoreWebView2.ScriptDialogOpening += CoreWebView2_ScriptDialogOpening;
				}
				else
				{
					winWebView.CoreWebView2Initialized -= OnCoreWebView2Initialized;
					winWebView.CoreWebView2Initialized += OnCoreWebView2Initialized;
				}
			}
		}
		catch (Exception ex)
		{
			System.Diagnostics.Debug.WriteLine($"[ScriptDialog] Hook error: {ex.Message}");
		}
	}

	private void OnCoreWebView2Initialized(object? sender, Microsoft.UI.Xaml.Controls.CoreWebView2InitializedEventArgs args)
	{
		if (CredentialsWebView.Handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 winWebView && winWebView.CoreWebView2 != null)
		{
			winWebView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = false; // Disable default dialogs!
			winWebView.CoreWebView2.ScriptDialogOpening -= CoreWebView2_ScriptDialogOpening;
			winWebView.CoreWebView2.ScriptDialogOpening += CoreWebView2_ScriptDialogOpening;
		}
	}

	private void CoreWebView2_ScriptDialogOpening(object sender, Microsoft.Web.WebView2.Core.CoreWebView2ScriptDialogOpeningEventArgs e)
	{
		var deferral = e.GetDeferral();
		var message = e.Message;
		var kind = e.Kind;
		var defaultText = e.DefaultText;

		Microsoft.Maui.ApplicationModel.MainThread.BeginInvokeOnMainThread(async () =>
		{
			try
			{
				if (kind == Microsoft.Web.WebView2.Core.CoreWebView2ScriptDialogKind.Alert)
				{
					await DisplayAlertAsync("Credentials Manager", message, "OK");
					e.Accept();
				}
				else if (kind == Microsoft.Web.WebView2.Core.CoreWebView2ScriptDialogKind.Confirm)
				{
					bool accepted = await DisplayAlertAsync("Credentials Manager", message, "OK", "Cancel");
					if (accepted)
					{
						e.Accept();
					}
				}
				else if (kind == Microsoft.Web.WebView2.Core.CoreWebView2ScriptDialogKind.Prompt)
				{
					string result = await DisplayPromptAsync("Credentials Manager", message, "OK", "Cancel", defaultText);
					if (result != null)
					{
						e.ResultText = result;
						e.Accept();
					}
				}
			}
			catch (Exception ex)
			{
				System.Diagnostics.Debug.WriteLine($"[ScriptDialog] Error showing dialog: {ex.Message}");
			}
			finally
			{
				deferral.Complete();
			}
		});
	}
#endif

	private void LoadCredentialsUrl()
	{
		string url = $"{MauiProgram.LocalServerUrl.TrimEnd('/')}/credentials.html";
		System.Diagnostics.Debug.WriteLine($"[CredentialsPage] Loading WebView source: {url}");
#if WINDOWS
		TryHookScriptDialog();
#endif
		CredentialsWebView.Source = url;
	}
}
