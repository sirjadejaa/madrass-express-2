import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Check if already seeded
  const existingRestaurant = await prisma.restaurant.findFirst()
  if (existingRestaurant && process.env.RESET_DB !== 'true') {
    console.log('Database already seeded. Set RESET_DB="true" to force re-seed.')
    return
  }

  // Clean the database if requested
  if (process.env.RESET_DB === 'true') {
    console.log('Cleaning database...')
    await prisma.auditLog.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.orderItemOption.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.token.deleteMany()
    await prisma.order.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.table.deleteMany()
    await prisma.productRecommendation.deleteMany()
    await prisma.productComboItem.deleteMany()
    await prisma.productOption.deleteMany()
    await prisma.productOptionGroup.deleteMany()
    await prisma.product3DModel.deleteMany()
    await prisma.productImage.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.printerSetting.deleteMany()
    await prisma.displaySetting.deleteMany()
    await prisma.restaurantSetting.deleteMany()
    await prisma.coupon.deleteMany()
    await prisma.restaurant.deleteMany()
  }

  // 1. Create Restaurant
  console.log('Creating restaurant...')
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'South Indian Restaurant',
      settings: {
        create: {
          currency: 'INR',
          taxPercent: 5.0,
          dailyTokenStartNumber: 1
        }
      },
      displaySetting: {
        create: {
          enableVoice: true,
          voiceVolume: 1.0,
          tokensCount: 6
        }
      }
    }
  })

  // 2. Create Admin User
  console.log('Creating admin user...')
  const passwordHash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@madrass.com',
      name: 'Restaurant Admin',
      passwordHash,
      role: 'ADMIN',
      restaurantId: restaurant.id
    }
  })

  // 3. Create Categories
  console.log('Creating categories...')
  const catNames = ['Dosa', 'Idli', 'Vada', 'Uttapam', 'Rice', 'Meals', 'Combos', 'Beverages', 'Desserts']
  const categories: Record<string, string> = {}
  
  for (let i = 0; i < catNames.length; i++) {
    const name = catNames[i]
    const cat = await prisma.category.create({
      data: {
        name,
        restaurantId: restaurant.id,
        order: i,
        isActive: true
      }
    })
    categories[name] = cat.id
  }

  // 4. Create Products
  console.log('Creating products...')

  // Idli
  const idli = await prisma.product.create({
    data: {
      name: 'Idli (2 pcs)',
      description: 'Soft, fluffy steamed rice and lentil cakes served with sambar and chutney.',
      price: 60,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Idli'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  const miniIdli = await prisma.product.create({
    data: {
      name: 'Mini Ghee Idli (14 pcs)',
      description: 'Bite-sized idlis soaked in sambar, topped with pure ghee.',
      price: 90,
      isVegetarian: true,
      categoryId: categories['Idli'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  // Vada
  const meduVada = await prisma.product.create({
    data: {
      name: 'Medu Vada (2 pcs)',
      description: 'Crispy deep-fried lentil donuts.',
      price: 70,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Vada'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  // Dosa
  const plainDosa = await prisma.product.create({
    data: {
      name: 'Plain Dosa',
      description: 'Thin, crispy crepe made from rice and lentil batter.',
      price: 80,
      isVegetarian: true,
      categoryId: categories['Dosa'],
      restaurantId: restaurant.id,
      preparationTime: 10
    }
  })

  const masalaDosa = await prisma.product.create({
    data: {
      name: 'Masala Dosa',
      description: 'Crispy dosa filled with spiced potato curry.',
      price: 110,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Dosa'],
      restaurantId: restaurant.id,
      preparationTime: 10
    }
  })

  const mysoreMasalaDosa = await prisma.product.create({
    data: {
      name: 'Mysore Masala Dosa',
      description: 'Spicy red chutney spread inside the dosa with potato filling.',
      price: 130,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Dosa'],
      restaurantId: restaurant.id,
      preparationTime: 12
    }
  })

  // Uttapam
  const onionUttapam = await prisma.product.create({
    data: {
      name: 'Onion Uttapam',
      description: 'Thick pancake topped with finely chopped onions.',
      price: 120,
      isVegetarian: true,
      categoryId: categories['Uttapam'],
      restaurantId: restaurant.id,
      preparationTime: 12
    }
  })

  // Rice
  const lemonRice = await prisma.product.create({
    data: {
      name: 'Lemon Rice',
      description: 'Tangy and flavorful rice tempered with mustard, peanuts, and lemon juice.',
      price: 100,
      isVegetarian: true,
      categoryId: categories['Rice'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  // Meals
  const southIndianMeals = await prisma.product.create({
    data: {
      name: 'South Indian Thali',
      description: 'Complete meal with rice, sambar, rasam, kootu, poriyal, papad, and sweet.',
      price: 250,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Meals'],
      restaurantId: restaurant.id,
      preparationTime: 15
    }
  })

  // Beverages
  const filterCoffee = await prisma.product.create({
    data: {
      name: 'Filter Coffee',
      description: 'Authentic South Indian degree coffee.',
      price: 50,
      isVegetarian: true,
      isPopular: true,
      categoryId: categories['Beverages'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  const buttermilk = await prisma.product.create({
    data: {
      name: 'Neer Mor (Buttermilk)',
      description: 'Spiced traditional buttermilk.',
      price: 40,
      isVegetarian: true,
      categoryId: categories['Beverages'],
      restaurantId: restaurant.id,
      preparationTime: 3
    }
  })

  // Desserts
  const kesari = await prisma.product.create({
    data: {
      name: 'Pineapple Kesari',
      description: 'Sweet semolina dessert flavored with pineapple and ghee.',
      price: 80,
      isVegetarian: true,
      categoryId: categories['Desserts'],
      restaurantId: restaurant.id,
      preparationTime: 5
    }
  })

  // 5. Create Recommendations
  console.log('Adding recommendations...')
  await prisma.productRecommendation.create({
    data: { productId: masalaDosa.id, recommendedId: filterCoffee.id }
  })
  await prisma.productRecommendation.create({
    data: { productId: idli.id, recommendedId: meduVada.id }
  })
  await prisma.productRecommendation.create({
    data: { productId: southIndianMeals.id, recommendedId: buttermilk.id }
  })

  // 6. Create Option Groups
  console.log('Adding product options...')
  const dosaOptions = await prisma.productOptionGroup.create({
    data: {
      name: 'Extras',
      isRequired: false,
      minSelections: 0,
      maxSelections: 2,
      productId: masalaDosa.id,
      options: {
        create: [
          { name: 'Extra Butter', price: 20, maxQuantity: 1, order: 0 },
          { name: 'Extra Cheese', price: 30, maxQuantity: 1, order: 1 }
        ]
      }
    }
  })

  // 7. Create Combos
  console.log('Creating combos...')
  const breakfastCombo = await prisma.product.create({
    data: {
      name: 'Breakfast Combo',
      description: '2 Idli, 1 Vada, and Filter Coffee.',
      price: 160,
      isVegetarian: true,
      isCombo: true,
      categoryId: categories['Combos'],
      restaurantId: restaurant.id,
      preparationTime: 8,
      productComboItems: {
        create: [
          { productId: idli.id, quantity: 1 },
          { productId: meduVada.id, quantity: 1 },
          { productId: filterCoffee.id, quantity: 1 }
        ]
      }
    }
  })

  // 8. Create Tables
  console.log('Creating tables...')
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: {
        number: `T${i}`,
        restaurantId: restaurant.id
      }
    })
  }

  console.log('Seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
