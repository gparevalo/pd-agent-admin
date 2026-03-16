// /src/lib/whatsapp.ts



export const copyWhatsAppMessage = async (message: string) => {
    await navigator.clipboard.writeText(message);
};

export const buildCredentialsMessage = ({
    name,
    company,
    email,
    password
}: {
    name: string;
    company: string;
    email: string;
    password: string;
}) => {

    return `Hola ${name},

Tu cuenta para ${company} ha sido creada.

Acceso al sistema:
Email: ${email}
Contraseña: ${password}

Ingresa aquí:
${window.location.origin}/login

Te recomendamos cambiar tu contraseña después de ingresar.`;
};

export const openWhatsApp = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, "_blank");
};