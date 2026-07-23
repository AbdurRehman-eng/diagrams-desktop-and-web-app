using System;
using Xunit;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Tests;

public class CredentialManagerWrapperTests
{
    [Fact]
    public void SaveReadDelete_GenericCredential_Succeeds()
    {
        // Arrange
        var testId = Guid.NewGuid().ToString();
        var targetName = $"GML:GMLDiagrams:TestProvider:{testId}:SecretValue";
        var username = "test-username";
        var secret = "super-secret-password-123!@#\nWithNewLines\nAndSpecialCharacters";

        try
        {
            // Act - Save
            var saved = CredentialManagerWrapper.SaveSecret(targetName, username, secret);
            Assert.True(saved, "Failed to save generic credential to Windows Credential Manager.");

            // Act - Read
            var retrievedSecret = CredentialManagerWrapper.ReadSecret(targetName);
            
            // Assert
            Assert.NotNull(retrievedSecret);
            Assert.Equal(secret, retrievedSecret);

            // Act - Delete
            var deleted = CredentialManagerWrapper.DeleteSecret(targetName);
            Assert.True(deleted, "Failed to delete generic credential from Windows Credential Manager.");

            // Act - Read again
            var postDeleteSecret = CredentialManagerWrapper.ReadSecret(targetName);
            
            // Assert
            Assert.Null(postDeleteSecret);
        }
        finally
        {
            // Cleanup in case of failures
            CredentialManagerWrapper.DeleteSecret(targetName);
        }
    }
}
