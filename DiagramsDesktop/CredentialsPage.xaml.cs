using System;
using Microsoft.Maui.Controls;

namespace DiagramsDesktop;

public partial class CredentialsPage : ContentPage
{
	public CredentialsPage()
	{
		InitializeComponent();
		LoadCredentialsUrl();
	}

	private void LoadCredentialsUrl()
	{
		string url = $"{MauiProgram.LocalServerUrl.TrimEnd('/')}/credentials.html";
		System.Diagnostics.Debug.WriteLine($"[CredentialsPage] Loading WebView source: {url}");
		CredentialsWebView.Source = url;
	}
}
