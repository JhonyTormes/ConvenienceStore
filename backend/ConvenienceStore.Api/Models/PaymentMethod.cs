using System.ComponentModel.DataAnnotations;

namespace ConvenienceStore.Api.Models;

public class PaymentMethod
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; }
}
