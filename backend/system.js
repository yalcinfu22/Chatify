// system.js
import mongoose from 'mongoose';
import User from './models/userModel.js';
import consola from "consola";

// Sistem kullanıcısı için sabit ve tahmin edilemez bir ID kullanmak daha iyidir.
// "000..." yerine gerçek bir ObjectId oluşturup sabit olarak kullanabiliriz.
export const SYSTEM_USER_ID = new mongoose.Types.ObjectId("65f9a2e6e4b0a4e6b3a0b1c2"); // Örnek bir sabit ID
const {success, error} = consola;
/**
 * Sistem kullanıcısının veritabanında var olmasını sağlar.
 * Eğer yoksa, oluşturur. Sunucu başlangıcında çağrılmalıdır.
 */
export async function createSystemUser() {
  try {
    const existing = await User.findById(SYSTEM_USER_ID);
    if (!existing) {
      await User.create({
        _id: SYSTEM_USER_ID,
        name: 'System',
        surname: " ",
        isSystem: true // Bu alan sadece system için var geri kalan hiçbir obje kullanmayacak! NO-SQL!
        // username ve password'e gerek yok şemada fonkisyon kullandık bunun için
      });
      success({ 
        message: 'System user successfully created.',
        badge:true,
      });
    }
  } catch (err) {
    error('Error ensuring system user exists:', err);
    process.exit(1); // Sistem kullanıcısı olmadan uygulama çalışmamalı.
  }
}