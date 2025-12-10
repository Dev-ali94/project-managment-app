import prisma from './prisma/prisma.config.js';

async function test() {
  try {
    const user = await prisma.user.create({
      data: {
        id: 'test123',
        name: 'Test User',
        email: 'test@example.com',
        image: '',
      },
    });
    console.log('User created:', user);
  } catch (err) {
    console.error('Prisma error:', err);
  }
}

test();
