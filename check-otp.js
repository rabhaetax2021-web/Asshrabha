const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ 
    where: { mobile: '01094056919' },
    include: { otpCodes: { orderBy: { createdAt: 'desc' }, take: 1 } }
  });
  if (user) {
    console.log('User ID:', user.id);
    console.log('Mobile:', user.mobile);
    console.log('Latest OTP:', user.otpCodes[0]);
  } else {
    console.log('No user found');
  }
  await prisma.$disconnect();
})();
