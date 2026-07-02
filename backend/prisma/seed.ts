import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'alex' },
      update: {},
      create: {
        username: 'alex',
        email: 'alex@example.com',
        passwordHash: hash,
        name: 'Alex Rivera',
        bio: 'Documenting the everyday.',
        birthday: new Date('1992-04-15'),
        timezone: 'America/New_York',
        currentStreak: 14,
        longestStreak: 30,
        totalPostsDays: 47,
      },
    }),
    prisma.user.upsert({
      where: { username: 'sam' },
      update: {},
      create: {
        username: 'sam',
        email: 'sam@example.com',
        passwordHash: hash,
        name: 'Sam Chen',
        bio: 'Runner. Cook. Dad.',
        birthday: new Date('1988-09-03'),
        timezone: 'America/Los_Angeles',
        currentStreak: 7,
        longestStreak: 100,
        totalPostsDays: 182,
      },
    }),
    prisma.user.upsert({
      where: { username: 'jordan' },
      update: {},
      create: {
        username: 'jordan',
        email: 'jordan@example.com',
        passwordHash: hash,
        name: 'Jordan Taylor',
        birthday: new Date('1995-12-20'),
        timezone: 'Europe/London',
        currentStreak: 3,
        longestStreak: 30,
        totalPostsDays: 22,
      },
    }),
    prisma.user.upsert({
      where: { username: 'mia' },
      update: {},
      create: {
        username: 'mia',
        email: 'mia@example.com',
        passwordHash: hash,
        name: 'Mia Okonkwo',
        bio: 'Photographer by trade, human by nature.',
        birthday: new Date('1990-06-08'),
        timezone: 'Africa/Lagos',
        currentStreak: 365,
        longestStreak: 365,
        totalPostsDays: 365,
      },
    }),
    prisma.user.upsert({
      where: { username: 'kai' },
      update: {},
      create: {
        username: 'kai',
        email: 'kai@example.com',
        passwordHash: hash,
        name: 'Kai Nakamura',
        birthday: new Date('2000-03-11'),
        timezone: 'Asia/Tokyo',
        currentStreak: 0,
        longestStreak: 7,
        totalPostsDays: 5,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create follows
  await prisma.follow.createMany({
    data: [
      { followerId: users[0].id, followingId: users[1].id, status: 'ACCEPTED' },
      { followerId: users[0].id, followingId: users[3].id, status: 'ACCEPTED' },
      { followerId: users[1].id, followingId: users[0].id, status: 'ACCEPTED' },
      { followerId: users[2].id, followingId: users[0].id, status: 'ACCEPTED' },
      { followerId: users[3].id, followingId: users[0].id, status: 'ACCEPTED' },
    ],
    skipDuplicates: true,
  });

  // Create communities
  const communities = await Promise.all([
    prisma.community.upsert({
      where: { slug: 'running' },
      update: {},
      create: {
        name: 'Running',
        slug: 'running',
        description: 'Daily runners sharing their miles.',
        creatorId: users[1].id,
        memberCount: 1,
        members: { create: { userId: users[1].id, role: 'ADMIN' } },
      },
    }),
    prisma.community.upsert({
      where: { slug: 'photography' },
      update: {},
      create: {
        name: 'Photography',
        slug: 'photography',
        description: 'Through the lens, one day at a time.',
        creatorId: users[3].id,
        memberCount: 1,
        members: { create: { userId: users[3].id, role: 'ADMIN' } },
      },
    }),
    prisma.community.upsert({
      where: { slug: 'cooking' },
      update: {},
      create: {
        name: 'Cooking',
        slug: 'cooking',
        description: 'Meals made, memories kept.',
        creatorId: users[0].id,
        memberCount: 1,
        members: { create: { userId: users[0].id, role: 'ADMIN' } },
      },
    }),
    prisma.community.upsert({
      where: { slug: 'travel' },
      update: {},
      create: {
        name: 'Travel',
        slug: 'travel',
        description: 'Every place deserves a memory.',
        creatorId: users[2].id,
        memberCount: 1,
        members: { create: { userId: users[2].id, role: 'ADMIN' } },
      },
    }),
    prisma.community.upsert({
      where: { slug: 'climbing' },
      update: {},
      create: {
        name: 'Climbing',
        slug: 'climbing',
        description: 'Vertical days, honest moments.',
        creatorId: users[4].id,
        memberCount: 1,
        members: { create: { userId: users[4].id, role: 'ADMIN' } },
      },
    }),
  ]);

  console.log(`Created ${communities.length} communities`);
  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
