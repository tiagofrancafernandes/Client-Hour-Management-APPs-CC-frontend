export async function generatePixQRCode(pixKey: string): Promise<string> {
    if (!pixKey) {
        return '';
    }

    try {
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixKey)}`;
        const response = await fetch(qrApi);

        if (!response.ok) {
            return '';
        }

        const blob = await response.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = () => {
                resolve('');
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Erro ao gerar QR code:', error);
        return '';
    }
}
