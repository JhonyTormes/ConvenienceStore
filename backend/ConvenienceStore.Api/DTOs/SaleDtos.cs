using System.ComponentModel.DataAnnotations;
using ConvenienceStore.Api.Models;

namespace ConvenienceStore.Api.DTOs;

public class CreateSaleRequest
{
    public List<SaleItemRequest> Items { get; set; } = [];

    public PaymentMethod PaymentMethod { get; set; }

    [Range(0, double.MaxValue)]
    public decimal AmountPaid { get; set; }
}

public class SaleItemRequest
{
    public int ProductId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}

public class SaleResponse
{
    public int Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal ChangeAmount { get; set; }
    public List<SaleItemResponse> Items { get; set; } = [];
}

public class SaleItemResponse
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal { get; set; }
}

public static class SaleMapper
{
    public static SaleResponse ToResponse(this Sale sale) => new()
    {
        Id = sale.Id,
        CreatedAt = sale.CreatedAt,
        TotalAmount = sale.TotalAmount,
        PaymentMethod = sale.PaymentMethod,
        AmountPaid = sale.AmountPaid,
        ChangeAmount = sale.ChangeAmount,
        Items = sale.Items.Select(i => new SaleItemResponse
        {
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            Subtotal = i.Subtotal
        }).ToList()
    };
}
