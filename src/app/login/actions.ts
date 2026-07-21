'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { signIn, signOut } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    await signIn('credentials', { email, password, redirect: false })
  } catch (error) {
    return { error: 'Invalid email or password' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return { error: 'Email already exists' }
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
      }
    })

    // Automatically login after signup
    await signIn('credentials', { email, password, redirect: false })
  } catch (error: any) {
    return { error: error.message || 'Error signing up' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function logout() {
  await signOut({ redirect: false })
  revalidatePath('/', 'layout')
  redirect('/login')
}

