namespace DiagramsDesktop;

public partial class MainPage : ContentPage
{
	public MainPage()
	{
		InitializeComponent();
		DiagramWebView.Source = MauiProgram.LocalServerUrl;
	}
}
