using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/sales")]
public class SalesController(AppDbContext db) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SaleResponse>> Create(CreateSaleRequest request)
    {
        if (request.Items.Count == 0)
            return BadRequest(new { message = "A sale must have at least one item." });

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
        var productById = products.ToDictionary(p => p.Id);

        var sale = new Sale();
        var now = DateTime.UtcNow;

        foreach (var item in request.Items)
        {
            if (!productById.TryGetValue(item.ProductId, out var product) || !product.IsActive)
                return BadRequest(new { message = $"Product {item.ProductId} was not found." });

            if (product.StockQuantity < item.Quantity)
                return BadRequest(new { message = $"Not enough stock for '{product.Name}'." });

            var subtotal = product.Price * item.Quantity;
            sale.Items.Add(new SaleItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                Subtotal = subtotal
            });
            sale.TotalAmount += subtotal;

            product.StockQuantity -= item.Quantity;
            product.UpdatedAt = now;
            product.StockMovements.Add(new StockMovement
            {
                Type = StockMovementType.Out,
                QuantityChange = -item.Quantity,
                StockAfter = product.StockQuantity,
                Reason = "Sale"
            });
        }

        sale.PaymentMethod = request.PaymentMethod;
        sale.AmountPaid = request.AmountPaid;

        if (sale.AmountPaid < sale.TotalAmount)
            return BadRequest(new { message = "The amount paid is less than the total." });

        sale.ChangeAmount = sale.AmountPaid - sale.TotalAmount;

        db.Sales.Add(sale);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale.ToResponse());
    }

    [HttpGet]
    public async Task<ActionResult<List<SaleResponse>>> GetAll([FromQuery] int limit = 100)
    {
        var sales = await db.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .OrderByDescending(s => s.CreatedAt)
            .Take(Math.Clamp(limit, 1, 500))
            .ToListAsync();

        return Ok(sales.Select(s => s.ToResponse()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SaleResponse>> GetById(int id)
    {
        var sale = await db.Sales
            .AsNoTracking()
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == id);

        return sale is null ? NotFound() : Ok(sale.ToResponse());
    }
}
