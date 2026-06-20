import { z } from 'zod'

export const categorySchema = z.object({
  nameEN: z.string().min(1),
  nameAR: z.string().min(1),
  slug: z.string().min(1).optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
})

export const catalogProductSchema = z.object({
  categoryId: z.string().min(1),
  nameEN: z.string().min(1),
  nameAR: z.string().min(1),
  minimumPrice: z.number().nonnegative(),
  maximumPrice: z.number().nonnegative(),
  wholesaleMinPrice: z.number().nonnegative().optional(),
  wholesaleMaxPrice: z.number().nonnegative().optional(),
  retailMinPrice: z.number().nonnegative().optional(),
  retailMaxPrice: z.number().nonnegative().optional(),
  images: z.array(z.string()).optional(),
  descriptionEN: z.string().optional(),
  descriptionAR: z.string().optional(),
})
