namespace Api;

public sealed class ConnectionStrings
{
    public string DbConnectionString { get; set; } = "";
    public string MqttBroker { get; set; } = "broker.hivemq.com";
    public int MqttPort { get; set; } = 1883;
    public string Redis { get; set; } = "";
    public string Secret { get; set; } = "CHANGE_ME_TO_32+_CHARS_SECRET________________";
}