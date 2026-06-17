'use server';
import { cookies } from 'next/headers';
import { updateMatchResult } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function login(password: string) {
  const adminPass = process.env.ADMIN_PASSWORD || 'smcl2026';
  if (password === adminPass) {
    const cookieStore = await cookies();
    cookieStore.set('admin', 'true', { secure: true, httpOnly: true });
    return true;
  }
  return false;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin');
  revalidatePath('/admin');
}

export async function saveResult(matchId: number, homeScore: number, awayScore: number) {
  const cookieStore = await cookies();
  if (cookieStore.get('admin')?.value !== 'true') throw new Error('Unauthorized');
  
  await updateMatchResult(matchId, homeScore, awayScore);
  revalidatePath('/');
  revalidatePath('/admin');
}
