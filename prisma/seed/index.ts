import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD is not set in .env');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 6);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@grupomodularms.com' },
    update: {}, // não atualiza, só cria se não existir
    create: {
      fullName: 'Administrador',
      email: 'admin@grupomodularms.com',
      password: passwordHash,
      role: 1,
      document: '000000000',
      phone: '00000000000',
      status: 1,
    },
  });

  console.log('Admin user created:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
