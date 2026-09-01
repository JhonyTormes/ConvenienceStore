using ConvenienceStore.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ConvenienceStore.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Name).IsRequired();
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            entity.HasIndex(p => p.Name);
            entity.HasIndex(p => p.Barcode).IsUnique();
        });

        modelBuilder.Entity<StockMovement>(entity =>
        {
            entity.HasOne(m => m.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(m => m.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(m => m.ProductId);
        });

        modelBuilder.Entity<Sale>(entity =>
        {
            entity.Property(s => s.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(s => s.AmountPaid).HasColumnType("decimal(18,2)");
            entity.Property(s => s.ChangeAmount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
            entity.HasOne(i => i.Sale)
                .WithMany(s => s.Items)
                .HasForeignKey(i => i.SaleId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(i => i.ProductId);
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.Property(c => c.Name).IsRequired();
            entity.HasIndex(c => c.Cpf).IsUnique();
        });
    }
}
