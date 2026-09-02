using System.Net.Http.Json;
using System.Text.Json;

namespace ConvenienceStore.Api.Services;

public record BridgePaymentResult(bool Success, string? Signature, string? Message, string? Status);

public class SolanaPayBridgeClient(HttpClient http)
{
    public async Task<BridgePaymentResult> RequestPaymentAsync(decimal amount, string orderId, CancellationToken ct)
    {
        try
        {
            using var response = await http.PostAsJsonAsync("pay", new { amount, orderId }, ct);

            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadFromJsonAsync<BridgePayResponse>(ct);
                if (body?.Status == "success")
                    return new BridgePaymentResult(true, body.Signature, null, body.Status);

                return body?.Status switch
                {
                    "cancelled" => new BridgePaymentResult(false, null, "Pagamento cancelado.", body?.Status),
                    "timeout" => new BridgePaymentResult(false, null, "O tempo do pagamento acabou.", body?.Status),
                    _ => new BridgePaymentResult(false, null, body?.Error ?? "Falha no pagamento.", body?.Status)
                };
            }

            var errorBody = await response.Content.ReadFromJsonAsync<BridgePayResponse>(ct);
            return new BridgePaymentResult(false, null,
                errorBody?.Error ?? $"Falha no caixa de pagamento (HTTP {response.StatusCode}).",
                errorBody?.Status);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return new BridgePaymentResult(false, null,
                "O caixa de pagamento Solana não está aberto. Inicie o SolanaPay PDV Bridge nesta máquina.",
                "unavailable");
        }
    }

    private sealed record BridgePayResponse(string? Status, string? Signature, string? Error);
}
