const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const count = await prisma.facility.count()
  console.log(`Total facilities: ${count}`)
  await prisma.$disconnect()
}
main()
