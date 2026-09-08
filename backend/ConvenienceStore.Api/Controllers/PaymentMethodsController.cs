using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/payment-methods")]
public class PaymentMethodsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PaymentMethodResponse>>> GetAll([FromQuery] bool activeOnly = false)
    {
        var query = db.PaymentMethods.AsNoTracking();

        if (activeOnly)
            query = query.Where(pm => pm.IsActive);

        var paymentMethods = await query
            .OrderBy(pm => pm.DisplayOrder)
            .ThenBy(pm => pm.Id)
            .ToListAsync();

        return Ok(paymentMethods.Select(pm => pm.ToResponse()).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<PaymentMethodResponse>> Create(CreatePaymentMethodRequest request)
    {
        var name = request.Name.Trim();

        if (await db.PaymentMethods.AnyAsync(pm => pm.Name == name))
            return Conflict(new { message = "Já existe uma forma de pagamento com este nome." });

        var maxOrder = await db.PaymentMethods.MaxAsync(pm => (int?)pm.DisplayOrder) ?? 0;

        var paymentMethod = new PaymentMethod
        {
            Name = name,
            DisplayOrder = maxOrder + 1
        };

        db.PaymentMethods.Add(paymentMethod);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), paymentMethod.ToResponse());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PaymentMethodResponse>> Update(int id, UpdatePaymentMethodRequest request)
    {
        var paymentMethod = await db.PaymentMethods.FindAsync(id);
        if (paymentMethod is null)
            return NotFound();

        var name = request.Name.Trim();

        if (await db.PaymentMethods.AnyAsync(pm => pm.Id != id && pm.Name == name))
            return Conflict(new { message = "Já existe uma forma de pagamento com este nome." });

        paymentMethod.Name = name;
        paymentMethod.IsActive = request.IsActive;

        await db.SaveChangesAsync();

        return Ok(paymentMethod.ToResponse());
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var paymentMethod = await db.PaymentMethods.FindAsync(id);
        if (paymentMethod is null)
            return NotFound();

        if (await db.Sales.AnyAsync(s => s.PaymentMethodId == id))
            return Conflict(new
            {
                message = "Esta forma de pagamento já foi usada em vendas e não pode ser excluída. Você pode desativá-la."
            });

        db.PaymentMethods.Remove(paymentMethod);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
