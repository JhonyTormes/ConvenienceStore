using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using ConvenienceStore.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/sales")]
public class SalesController(AppDbContext db, SolanaPayBridgeClient solanaPay) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<SaleResponse>> Create(CreateSaleRequest request, CancellationToken ct)
    {
        if (request.Items.Count == 0)
            return BadRequest(new { message = "A sale must have at least one item." });

        var buildResult = BuildSale(request);
        if (buildResult.Error is not null)
            return BadRequest(new { message = buildResult.Error });

        var sale = buildResult.Sale!;

        if (request.PaymentMethod == PaymentMethod.SolanaPay)
        {
            var orderId = $"POS-{Guid.NewGuid():N}"[..12];
            var payment = await solanaPay.RequestPaymentAsync(sale.TotalAmount, orderId, ct);

            if (!payment.Success)
                return BadRequest(new { message = payment.Message, paymentStatus = payment.Status });

            sale.PaymentSignature = payment.Signature;
        }

        db.Sales.Add(sale);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = sale.Id }, sale.ToResponse());
    }

    private (Sale? Sale, string? Error) BuildSale(CreateSaleRequest request)
    {
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = db.Products.Where(p => productIds.Contains(p.Id)).ToList();
        var productById = products.ToDictionary(p => p.Id);

        var sale = new Sale();
        var now = DateTime.UtcNow;

        foreach (var item in request.Items)
        {
            if (!productById.TryGetValue(item.ProductId, out var product) || !product.IsActive)
                return (null, $"Product {item.ProductId} was not found.");

            if (product.StockQuantity < item.Quantity)
                return (null, $"Not enough stock for '{product.Name}'.");

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
            return (null, "The amount paid is less than the total.");

        sale.ChangeAmount = sale.AmountPaid - sale.TotalAmount;

        return (sale, null);
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
