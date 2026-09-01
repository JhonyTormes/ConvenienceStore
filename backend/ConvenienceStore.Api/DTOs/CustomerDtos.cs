using System.ComponentModel.DataAnnotations;
using ConvenienceStore.Api.Models;

namespace ConvenienceStore.Api.DTOs;

public class CreateCustomerRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(14)]
    public string? Cpf { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }
}

public class UpdateCustomerRequest
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(14)]
    public string? Cpf { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }
}

public class CustomerResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; }
}

public static class CustomerMapper
{
    public static CustomerResponse ToResponse(this Customer customer) => new()
    {
        Id = customer.Id,
        Name = customer.Name,
        Cpf = customer.Cpf,
        Phone = customer.Phone,
        CreatedAt = customer.CreatedAt
    };
}
