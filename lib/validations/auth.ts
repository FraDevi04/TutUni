import { z } from 'zod'

export const signInSchema = z.object({
  email: z
    .string()
    .email('Inserisci un indirizzo email valido')
    .min(1, 'Email richiesta'),
  password: z
    .string()
    .min(6, 'La password deve contenere almeno 6 caratteri')
    .max(100, 'La password non può superare i 100 caratteri'),
})

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(50, 'Il nome non può superare i 50 caratteri')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Il nome può contenere solo lettere e spazi'),
  email: z
    .string()
    .email('Inserisci un indirizzo email valido')
    .min(1, 'Email richiesta'),
  password: z
    .string()
    .min(6, 'La password deve contenere almeno 6 caratteri')
    .max(100, 'La password non può superare i 100 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una lettera minuscola, una maiuscola e un numero'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email('Inserisci un indirizzo email valido')
    .min(1, 'Email richiesta'),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema> 