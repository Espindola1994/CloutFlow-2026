import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import argon2 from 'argon2';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function seed() {
  console.log('Seeding database...');
  
  try {
    // Check if platforms exist
    const existingPlatforms = await db.query.platforms.findMany();
    
    if (existingPlatforms.length === 0) {
      console.log('Inserting platforms...');
      
      const platformsData = [
        { name: 'Instagram', slug: 'instagram', sortOrder: 1 },
        { name: 'TikTok', slug: 'tiktok', sortOrder: 2 },
        { name: 'X / Twitter', slug: 'twitter', sortOrder: 3 },
        { name: 'Facebook', slug: 'facebook', sortOrder: 4 },
      ];
      
      const insertedPlatforms = await db.insert(schema.platforms).values(platformsData).returning();
      
      const instagram = insertedPlatforms.find(p => p.slug === 'instagram');
      
      if (instagram) {
        console.log('Inserting Instagram services...');
        
        const servicesData = [
          { platformId: instagram.id, name: 'Followers', slug: 'instagram-followers', requiresProfile: true, requiresNiche: true, requiresMedia: false, sortOrder: 1, deliveryEstimate: '1-2 hours' },
          { platformId: instagram.id, name: 'Likes', slug: 'instagram-likes', requiresProfile: true, requiresNiche: false, requiresMedia: true, sortOrder: 2, deliveryEstimate: 'Instant' },
          { platformId: instagram.id, name: 'Views', slug: 'instagram-views', requiresProfile: true, requiresNiche: false, requiresMedia: true, sortOrder: 3, deliveryEstimate: 'Instant' },
        ];
        
        const insertedServices = await db.insert(schema.services).values(servicesData).returning();
        
        console.log('Inserting plans...');
        
        const plansData = [];
        for (const service of insertedServices) {
          plansData.push(
            { serviceId: service.id, name: '100', slug: `${service.slug}-100`, quantity: 100, regularPriceCents: 199, sortOrder: 1 },
            { serviceId: service.id, name: '250', slug: `${service.slug}-250`, quantity: 250, regularPriceCents: 399, sortOrder: 2 },
            { serviceId: service.id, name: '500', slug: `${service.slug}-500`, quantity: 500, regularPriceCents: 699, sortOrder: 3 },
            { serviceId: service.id, name: '1000', slug: `${service.slug}-1000`, quantity: 1000, regularPriceCents: 1299, popular: true, sortOrder: 4 }
          );
        }
        
        await db.insert(schema.plans).values(plansData);
      }
    }
    
    // Check if niches exist
    const existingNiches = await db.query.niches.findMany();
    if (existingNiches.length === 0) {
      console.log('Inserting niches...');
      const nichesData = [
        'Fitness', 'Beauty', 'Fashion', 'Business', 'Marketing', 
        'Finance', 'Gaming', 'Food', 'Travel', 'Photography', 
        'Real Estate', 'Music', 'Technology', 'Education', 'Lifestyle'
      ].map((name, index) => ({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        sortOrder: index + 1
      }));
      
      await db.insert(schema.niches).values(nichesData);
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await pool.end();
  }
}

seed();
