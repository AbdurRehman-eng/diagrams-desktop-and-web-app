using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace DiagramsDesktop.Models;

public class GlobalVariable : INotifyPropertyChanged
{
    private string _key = "";
    private string _value = "";

    public string Key
    {
        get => _key;
        set
        {
            if (_key != value)
            {
                _key = value;
                OnPropertyChanged();
            }
        }
    }

    public string Value
    {
        get => _value;
        set
        {
            if (_value != value)
            {
                _value = value;
                OnPropertyChanged();
            }
        }
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected virtual void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
