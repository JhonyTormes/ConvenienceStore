using System.ComponentModel.DataAnnotations;
using ConvenienceStore.Api.Models;

namespace ConvenienceStore.Api.DTOs;

public class CreatePaymentMethodRequest
{
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;
}

public class UpdatePaymentMethodRequest
{
    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

public class PaymentMethodResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int DisplayOrder { get; set; }
}

public static class PaymentMethodMapper
{
    public static PaymentMethodResponse ToResponse(this PaymentMethod paymentMethod) => new()
    {
        Id = paymentMethod.Id,
        Name = paymentMethod.Name,
        IsActive = paymentMethod.IsActive,
        DisplayOrder = paymentMethod.DisplayOrder
    };
}
