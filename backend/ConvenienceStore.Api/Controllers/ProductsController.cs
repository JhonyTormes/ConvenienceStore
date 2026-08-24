using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ProductResponse>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool includeInactive = false)
    {
        var query = db.Products.AsNoTracking();

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search));

        var products = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products.Select(p => p.ToResponse()).ToList());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProductResponse>> GetById(int id)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Id == id)
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product.ToResponse());
    }

    [HttpGet("barcode/{barcode}")]
    public async Task<ActionResult<ProductResponse>> GetByBarcode(string barcode)
    {
        var product = await db.Products
            .AsNoTracking()
            .Where(p => p.Barcode == barcode && p.IsActive)
            .FirstOrDefaultAsync();

        return product is null ? NotFound() : Ok(product.ToResponse());
    }

    [HttpPost]
    public async Task<ActionResult<ProductResponse>> Create(CreateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim(),
            Price = request.Price,
            StockQuantity = request.InitialStock
        };

        if (product.StockQuantity > 0)
        {
            product.StockMovements.Add(new StockMovement
            {
                Type = StockMovementType.In,
                QuantityChange = product.StockQuantity,
                StockAfter = product.StockQuantity,
                Reason = "Initial stock"
            });
        }

        db.Products.Add(product);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product.ToResponse());
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductResponse>> Update(int id, UpdateProductRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null || !product.IsActive)
            return NotFound();

        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.Barcode = string.IsNullOrWhiteSpace(request.Barcode) ? null : request.Barcode.Trim();
        product.Price = request.Price;
        product.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return Ok(product.ToResponse());
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null || !product.IsActive)
            return NotFound();

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/adjust-stock")]
    public async Task<ActionResult<ProductResponse>> AdjustStock(int id, AdjustStockRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null || !product.IsActive)
            return NotFound();

        var currentStock = product.StockQuantity;
        var newStock = request.Type switch
        {
            StockMovementType.In => currentStock + request.Quantity,
            StockMovementType.Out => currentStock - request.Quantity,
            StockMovementType.Adjustment => request.Quantity,
            _ => currentStock
        };

        if (newStock < 0)
            return BadRequest(new { message = "Stock cannot be negative." });

        product.StockQuantity = newStock;
        product.UpdatedAt = DateTime.UtcNow;

        product.StockMovements.Add(new StockMovement
        {
            Type = request.Type,
            QuantityChange = newStock - currentStock,
            StockAfter = newStock,
            Reason = request.Reason?.Trim()
        });

        await db.SaveChangesAsync();

        return Ok(product.ToResponse());
    }

    [HttpGet("{id:int}/movements")]
    public async Task<ActionResult<List<StockMovementResponse>>> GetMovements(int id)
    {
        var productExists = await db.Products.AnyAsync(p => p.Id == id);
        if (!productExists)
            return NotFound();

        var movements = await db.StockMovements
            .AsNoTracking()
            .Include(m => m.Product)
            .Where(m => m.ProductId == id)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(movements.Select(m => m.ToResponse()).ToList());
    }
}
