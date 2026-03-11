FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY server/server.slnx server/
COPY server/api/api.csproj server/api/
COPY server/DataAccess/DataAccess.csproj server/DataAccess/

RUN dotnet restore server/server.slnx

COPY server/api/ server/api/
COPY server/DataAccess/ server/DataAccess/

RUN dotnet publish server/api/api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "api.dll"]