// Set NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local (country code, digits only).
const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "910000000000";

export function whatsappLink(message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
