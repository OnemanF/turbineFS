namespace Api.Etc;

public sealed class AuthenticationRequiredException(string message) : Exception(message);

public sealed class AccessForbiddenException(string message) : Exception(message);