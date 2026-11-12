namespace ConvenienceStore.Api.Models;

public class Sale
{
    public int Id { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public decimal TotalAmount { get; set; }

    public int PaymentMethodId { get; set; }

    public PaymentMethod PaymentMethod { get; set; } = null!;

    public decimal AmountPaid { get; set; }

    public decimal ChangeAmount { get; set; }

    public string? PaymentSignature { get; set; }

    public bool IsCanceled { get; set; }

    public DateTime? CanceledAt { get; set; }

    public List<SaleItem> Items { get; set; } = [];
}

public class SaleItem
{
    public int Id { get; set; }

    public int SaleId { get; set; }

    public Sale Sale { get; set; } = null!;

    public int ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal Subtotal { get; set; }
}
