using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authorization.Policy;

namespace Api.Etc;

public sealed class AuthorizationExceptionHandler : IAuthorizationMiddlewareResultHandler
{
    private readonly AuthorizationMiddlewareResultHandler _fallback = new();

    public Task HandleAsync(
        RequestDelegate next,
        HttpContext context,
        AuthorizationPolicy policy,
        PolicyAuthorizationResult authorizeResult)
    {
        if (authorizeResult.Challenged)
            throw new AuthenticationRequiredException("Authentication required");

        if (authorizeResult.Forbidden)
            throw new AccessForbiddenException("You are not allowed to perform this action");

        return _fallback.HandleAsync(next, context, policy, authorizeResult);
    }
}