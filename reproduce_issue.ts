
import { PrismaClient, OrderStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Starting reproduction script...');

  // 1. Create a Product
  const product = await prisma.product.create({
    data: {
      name: 'Test Product ' + Date.now(),
      unit: 'UN',
      status: 1,
      price: 100,
      stockOnHand: 100,
    },
  });
  console.log('Created Product:', product.id, 'Stock:', product.stockOnHand);

  // 2. Create an Order (DRAFT)
  const client = await prisma.client.findFirst();
  if (!client) {
      console.error('No client found to create order');
      return;
  }
  
  const user = await prisma.user.findFirst();
    if (!user) {
      console.error('No user found to create order');
      return;
  }

  const order = await prisma.order.create({
    data: {
      clientId: client.id,
      userId: user.id,
      status: OrderStatus.DRAFT,
      totalItems: 10,
      finalTotal: 1000,
      items: {
        create: {
          productId: product.id,
          quantity: 10,
          price: 100,
          subtotal: 1000,
        },
      },
    },
    include: { items: true },
  });
  console.log('Created Order:', order.id, 'Status:', order.status);

  // 3. Simulate changeStatus logic
  const id = order.id;
  const status = OrderStatus.CONFIRMED;

  // Simulate OrderService.changeStatus
  await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!order) throw new Error('Order not found');

      const previousStatus = order.status;
      console.log('Previous Status:', previousStatus);
      console.log('Target Status:', status);

      // Same logic as OrderService
      const isStarting =
        previousStatus === OrderStatus.DRAFT ||
        previousStatus === OrderStatus.CANCELLED;

      const isConfirming =
        status === OrderStatus.CONFIRMED ||
        status === OrderStatus.SHIPMENT ||
        status === OrderStatus.DONE;

      console.log('isStarting:', isStarting);
      console.log('isConfirming:', isConfirming);

      if (isStarting && isConfirming) {
        console.log('Decrementing stock...');
        for (const item of order.items) {
          console.log(`Product ${item.productId}, Quantity: ${item.quantity}`);
          await tx.product.update({
            where: { id: item.productId },
            data: { stockOnHand: { decrement: item.quantity } },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status },
      });
  });

  // 4. Check Product Stock
  const updatedProduct = await prisma.product.findUnique({
    where: { id: product.id },
  });
  console.log('Updated Product Stock:', updatedProduct?.stockOnHand);

  // Cleanup
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.product.delete({ where: { id: product.id } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
