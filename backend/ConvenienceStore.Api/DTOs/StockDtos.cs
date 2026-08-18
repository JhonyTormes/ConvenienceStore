using System.ComponentModel.DataAnnotations;
using ConvenienceStore.Api.Models;

namespace ConvenienceStore.Api.DTOs;

public class AdjustStockRequest
{
    [Required]
    public StockMovementType Type { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}

public class StockMovementResponse
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public StockMovementType Type { get; set; }
    public int QuantityChange { get; set; }
    public int StockAfter { get; set; }
    public string? Reason { get; set; }
    public DateTime CreatedAt { get; set; }
}

public static class StockMovementMapper
{
    public static StockMovementResponse ToResponse(this StockMovement movement) => new()
    {
        Id = movement.Id,
        ProductId = movement.ProductId,
        ProductName = movement.Product.Name,
        Type = movement.Type,
        QuantityChange = movement.QuantityChange,
        StockAfter = movement.StockAfter,
        Reason = movement.Reason,
        CreatedAt = movement.CreatedAt
    };
}
