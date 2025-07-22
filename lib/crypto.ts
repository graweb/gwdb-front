import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const algorithm = "aes-256-cbc";

// Chave precisa ter 32 bytes (256 bits)
// Converte uma string hexadecimal de 64 caracteres em um buffer
const key = Buffer.from(
  "7a8f17554daf9e64f134efa8c91f580a5c1927facf648c8413d988979883ec3a",
  "hex"
);

/**
 * Criptografa um texto e retorna no formato:
 * ENC:<ivHex>:<encryptedHex>
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16); // 16 bytes para AES
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return `ENC:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Descriptografa uma string criptografada no formato ENC:<iv>:<encrypted>
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3 || parts[0] !== "ENC") {
    throw new Error("Formato inválido ou dado não criptografado");
  }

  const [_, ivHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString();
}

/**
 * Verifica se uma string está no formato criptografado
 */
export function isEncrypted(text: string): boolean {
  if (!text.startsWith("ENC:")) return false;
  const parts = text.split(":");
  if (parts.length !== 3) return false;

  const [_, ivHex, encryptedHex] = parts;
  return (
    /^[0-9a-fA-F]+$/.test(ivHex) &&
    ivHex.length === 32 && // 16 bytes = 32 hex chars
    /^[0-9a-fA-F]+$/.test(encryptedHex)
  );
}
