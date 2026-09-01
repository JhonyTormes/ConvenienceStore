using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CustomerResponse>>> GetAll([FromQuery] string? search)
    {
        var query = db.Customers.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c =>
                c.Name.Contains(search) ||
                (c.Cpf != null && c.Cpf.Contains(search)) ||
                (c.Phone != null && c.Phone.Contains(search)));

        var customers = await query
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(customers.Select(c => c.ToResponse()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerResponse>> GetById(int id)
    {
        var customer = await db.Customers
            .AsNoTracking()
            .Where(c => c.Id == id)
            .FirstOrDefaultAsync();

        return customer is null ? NotFound() : Ok(customer.ToResponse());
    }

    [HttpPost]
    public async Task<ActionResult<CustomerResponse>> Create(CreateCustomerRequest request)
    {
        var customer = new Customer
        {
            Name = request.Name.Trim(),
            Cpf = string.IsNullOrWhiteSpace(request.Cpf) ? null : request.Cpf.Trim(),
            Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim()
        };

        db.Customers.Add(customer);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Já existe um cliente com este CPF." });
        }

        return CreatedAtAction(nameof(GetById), new { id = customer.Id }, customer.ToResponse());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerResponse>> Update(int id, UpdateCustomerRequest request)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null)
            return NotFound();

        customer.Name = request.Name.Trim();
        customer.Cpf = string.IsNullOrWhiteSpace(request.Cpf) ? null : request.Cpf.Trim();
        customer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Já existe um cliente com este CPF." });
        }

        return Ok(customer.ToResponse());
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await db.Customers.FindAsync(id);
        if (customer is null)
            return NotFound();

        db.Customers.Remove(customer);
        await db.SaveChangesAsync();

        return NoContent();
    }
}
