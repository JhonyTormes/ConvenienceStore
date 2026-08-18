using ConvenienceStore.Api.Data;
using ConvenienceStore.Api.DTOs;
using ConvenienceStore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Controllers;

[ApiController]
[Route("api/stock-movements")]
public class StockMovementsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<StockMovementResponse>>> GetAll(
        [FromQuery] int? productId,
        [FromQuery] int limit = 100)
    {
        IQueryable<StockMovement> query = db.StockMovements.AsNoTracking().Include(m => m.Product);

        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);

        var movements = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(Math.Clamp(limit, 1, 500))
            .ToListAsync();

        return Ok(movements.Select(m => m.ToResponse()).ToList());
    }
}
