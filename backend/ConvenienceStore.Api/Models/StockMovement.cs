using System.ComponentModel.DataAnnotations;

namespace ConvenienceStore.Api.Models;

public enum StockMovementType
{
    In = 1,
    Out = 2,
    Adjustment = 3
}

public class StockMovement
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public Product Product { get; set; } = null!;

    public StockMovementType Type { get; set; }

    public int QuantityChange { get; set; }

    public int StockAfter { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
