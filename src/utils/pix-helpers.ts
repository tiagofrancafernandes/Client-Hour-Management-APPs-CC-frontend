import qrcode from 'qrcode-generator';

type PixCode = {
    amount: string;
    copyAndPasteCode: string;
    qrCodeUrl: string;
    qrCodeBase64: string;
};

const PIX_MINIMUM_AMOUNT = 100;
const PIX_COUNTRY_CODE = 'BR';
const PIX_CURRENCY_CODE = '986';
const PIX_GUI = 'br.gov.bcb.pix';

export async function generatePixCopyAndPasteCode(
    amountInCents: number,
    pixKey: string,
    receiverName = 'PIX',
    receiverCityName = 'BRASIL'
): Promise<PixCode> {
    validatePixAmount(amountInCents);

    const amount = formatPixAmount(amountInCents);

    const normalizedReceiverName = normalizeText(receiverName, 25);
    const normalizedReceiverCityName = normalizeText(receiverCityName, 15);

    const payloadWithoutCRC = buildPixPayload(pixKey, amount, normalizedReceiverName, normalizedReceiverCityName);

    const copyAndPasteCode = `${payloadWithoutCRC}${calculateCRC16(payloadWithoutCRC)}`;

    const qrCodeUrl = createQRCodeUrl(copyAndPasteCode);
    const qrCodeBase64 = createQRCodeBase64(copyAndPasteCode);

    return {
        amount,
        copyAndPasteCode,
        qrCodeUrl,
        qrCodeBase64,
    };
}

function validatePixAmount(amountInCents: number): void {
    if (!Number.isInteger(amountInCents)) {
        throw new Error('Amount must be an integer.');
    }

    if (amountInCents < PIX_MINIMUM_AMOUNT) {
        throw new Error('Amount must be greater than or equal to 100.');
    }
}

function formatPixAmount(amountInCents: number): string {
    return (amountInCents / 100).toFixed(2);
}

function normalizeText(text: string, maxLength: number): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
        .slice(0, maxLength);
}

function buildPixPayload(pixKey: string, amount: string, receiverName: string, receiverCityName: string): string {
    const merchantAccount = [createField('00', PIX_GUI), createField('01', pixKey)].join('');

    const payload = [
        createField('00', '01'),
        createField('01', '11'),
        createField('26', merchantAccount),
        createField('52', '0000'),
        createField('53', PIX_CURRENCY_CODE),
        createField('54', amount),
        createField('58', PIX_COUNTRY_CODE),
        createField('59', receiverName),
        createField('60', receiverCityName),
        createField('62', createField('05', '***')),
    ].join('');

    return `${payload}6304`;
}

function createField(identifier: string, content: string): string {
    const size = content.length.toString().padStart(2, '0');

    return `${identifier}${size}${content}`;
}

function createQRCodeUrl(payload: string): string {
    const encodedPayload = encodeURIComponent(payload);

    return `https://quickchart.io/qr?size=300&text=${encodedPayload}`;
}

function createQRCodeBase64(payload: string): string {
    const qr = qrcode(0, 'M');

    qr.addData(payload);
    qr.make();

    return qr.createDataURL(8);
}

// CRC16-CCITT required by PIX EMV specification.
function calculateCRC16(payload: string): string {
    let crc = 0xffff;

    for (let position = 0; position < payload.length; position++) {
        crc ^= payload.charCodeAt(position) << 8;

        for (let bit = 0; bit < 8; bit++) {
            const hasOverflow = (crc & 0x8000) !== 0;

            crc <<= 1;

            if (hasOverflow) {
                crc ^= 0x1021;
            }

            crc &= 0xffff;
        }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
}
