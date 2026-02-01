import jsPDF from 'jspdf';

interface TransactionItem {
    name: string;
    quantity: number;
    price: number;
    total: number;
}

interface TransactionData {
    id: string;
    date: Date | string;
    buyerAddress: string;
    sellerAddress: string;
    items: TransactionItem[];
    subtotal: number;
    platformFee: number;
    total: number;
    txHash: string;
    network?: 'devnet' | 'mainnet-beta';
}

interface PajReceiptData {
    id: string;
    date: Date | string;
    type: 'deposit' | 'withdrawal';
    userAddress: string;
    userName?: string | null;
    amountFiat: number;
    fiatCurrency: string;
    amountToken: number;
    tokenSymbol: string;
    pajOrderId: string;
    trackingCode: string;
    network?: 'devnet' | 'mainnet-beta';
    status?: string;
}

type TextAlign = 'left' | 'center' | 'right';
type TextOptions = {
    align?: TextAlign;
};

export function generateReceipt(transaction: TransactionData): void {
    // Create new PDF document (A4 size)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    // Helper function to add text
    const addText = (text: string, x: number, y: number, options?: TextOptions) => {
        doc.text(text, x, y, options);
    };

    // Helper function to add line
    const addLine = (y: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
    };

    // ===== HEADER =====
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(139, 92, 246); // Purple color
    addText('StudIQ Campus Store', pageWidth / 2, yPos, { align: 'center' });

    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    addText('Transaction Receipt', pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    addLine(yPos);
    yPos += 10;

    // ===== TRANSACTION INFO =====
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    addText('Receipt Information', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const transactionDate = transaction.date instanceof Date
        ? transaction.date.toLocaleString()
        : new Date(transaction.date).toLocaleString();

    addText(`Order ID: ${transaction.id}`, margin, yPos);
    yPos += 6;
    addText(`Date: ${transactionDate}`, margin, yPos);
    yPos += 6;
    addText(`Network: Solana ${transaction.network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}`, margin, yPos);

    yPos += 10;
    addLine(yPos);
    yPos += 10;

    // ===== ADDRESSES =====
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    addText('Wallet Addresses', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);

    addText('Buyer:', margin, yPos);
    addText(shortenAddress(transaction.buyerAddress), margin + 20, yPos);

    yPos += 6;
    addText('Seller:', margin, yPos);
    addText(shortenAddress(transaction.sellerAddress), margin + 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    addLine(yPos);
    yPos += 10;

    // ===== ITEMS TABLE =====
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    addText('Items', margin, yPos);

    yPos += 7;

    // Table header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 8, 'F');

    doc.setFontSize(9);
    addText('Item', margin + 2, yPos);
    addText('Qty', pageWidth - margin - 50, yPos);
    addText('Price', pageWidth - margin - 35, yPos);
    addText('Total', pageWidth - margin - 15, yPos, { align: 'right' });

    yPos += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    transaction.items.forEach((item, index) => {
        if (yPos > 260) { // Check if we need a new page
            doc.addPage();
            yPos = 20;
        }

        // Alternate row background
        if (index % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPos - 4, pageWidth - 2 * margin, 7, 'F');
        }

        addText(truncateText(item.name, 35), margin + 2, yPos);
        addText(item.quantity.toString(), pageWidth - margin - 50, yPos);
        addText(`${item.price.toFixed(2)} SOL`, pageWidth - margin - 35, yPos);
        addText(`${item.total.toFixed(2)} SOL`, pageWidth - margin - 15, yPos, { align: 'right' });

        yPos += 7;
    });

    yPos += 5;
    addLine(yPos);
    yPos += 8;

    // ===== TOTALS =====
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    addText('Subtotal:', pageWidth - margin - 50, yPos);
    addText(`${transaction.subtotal.toFixed(2)} SOL`, pageWidth - margin - 15, yPos, { align: 'right' });

    yPos += 6;
    addText('Platform Fee (5%):', pageWidth - margin - 50, yPos);
    addText(`${transaction.platformFee.toFixed(2)} SOL`, pageWidth - margin - 15, yPos, { align: 'right' });

    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    addText('Total:', pageWidth - margin - 50, yPos);
    addText(`${transaction.total.toFixed(2)} SOL`, pageWidth - margin - 15, yPos, { align: 'right' });

    yPos += 12;
    addLine(yPos);
    yPos += 10;

    // ===== BLOCKCHAIN INFO =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    addText('Blockchain Transaction', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    addText('Transaction Hash:', margin, yPos);
    yPos += 5;
    doc.setTextColor(139, 92, 246); // Purple for the hash
    addText(shortenHash(transaction.txHash), margin, yPos);

    yPos += 8;
    doc.setTextColor(60, 60, 60);
    const explorerUrl = transaction.network === 'mainnet-beta'
        ? 'explorer.solana.com'
        : 'explorer.solana.com/?cluster=devnet';
    addText(`View on Solana Explorer: ${explorerUrl}`, margin, yPos);

    // ===== FOOTER =====
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    addText('Thank you for using StudIQ Campus Store!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    addText('For support, contact: support@studiq.fun', pageWidth / 2, yPos, { align: 'center' });

    // ===== SAVE PDF =====
    const fileName = `StudIQ_Receipt_${transaction.id}.pdf`;
    doc.save(fileName);
}

export function generatePajReceipt(receipt: PajReceiptData): void {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = 20;

    const addText = (text: string, x: number, y: number, options?: TextOptions) => {
        doc.text(text, x, y, options);
    };

    const addLine = (y: number) => {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, pageWidth - margin, y);
    };

    const isDeposit = receipt.type === 'deposit';
    const primaryColor = isDeposit
        ? { r: 34, g: 197, b: 94 }
        : { r: 249, g: 115, b: 22 };
    const accentColor = isDeposit
        ? { r: 16, g: 185, b: 129 }
        : { r: 234, g: 88, b: 12 };

    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(margin, yPos, pageWidth - margin * 2, 24, 'F');

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    addText(
        isDeposit ? 'Paj Cash Deposit Receipt' : 'Paj Cash Withdrawal Receipt',
        pageWidth / 2,
        yPos + 9,
        { align: 'center' }
    );

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(226, 232, 240);
    addText('StudIQ Campus Store • Solana Web3', pageWidth / 2, yPos + 17, {
        align: 'center',
    });

    yPos += 34;
    addLine(yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    addText('Receipt Information', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const receiptDate = receipt.date instanceof Date
        ? receipt.date.toLocaleString()
        : new Date(receipt.date).toLocaleString();

    addText(`Receipt ID: ${receipt.id}`, margin, yPos);
    yPos += 6;
    addText(`Tracking Code: ${receipt.trackingCode}`, margin, yPos);
    yPos += 6;
    addText(`Date: ${receiptDate}`, margin, yPos);
    yPos += 6;
    addText(`Type: ${isDeposit ? 'Deposit' : 'Withdrawal'}`, margin, yPos);
    yPos += 6;
    if (receipt.status) {
        doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
        addText(`Status: ${receipt.status}`, margin, yPos);
        doc.setTextColor(60, 60, 60);
        yPos += 6;
    }
    if (receipt.network) {
        addText(`Network: Solana ${receipt.network === 'mainnet-beta' ? 'Mainnet' : 'Devnet'}`, margin, yPos);
        yPos += 6;
    }

    yPos += 4;
    addLine(yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    addText('User Details', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);

    if (receipt.userName) {
        addText(`Name: ${receipt.userName}`, margin, yPos);
        yPos += 6;
    }
    addText('Wallet:', margin, yPos);
    addText(shortenAddress(receipt.userAddress), margin + 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    addLine(yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    addText('Payment Summary', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);

    addText(`Fiat Amount: ${receipt.amountFiat.toFixed(2)} ${receipt.fiatCurrency}`, margin, yPos);
    yPos += 6;
    addText(`Token Amount: ${receipt.amountToken.toFixed(6)} ${receipt.tokenSymbol}`, margin, yPos);
    yPos += 6;
    addText(`Paj Order ID: ${receipt.pajOrderId}`, margin, yPos);

    yPos += 10;
    addLine(yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    addText('Verification', margin, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    addText('Keep this receipt and tracking code for your records.', margin, yPos);
    yPos += 5;
    addText('In case of any dispute, share the tracking code with support', margin, yPos);
    yPos += 5;
    addText('so we can quickly locate and verify this Paj Cash transaction.', margin, yPos);

    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    addText('Thank you for using StudIQ Campus Store!', pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    addText('For support, contact: support@studiq.fun', pageWidth / 2, yPos, { align: 'center' });

    const fileName = `StudIQ_Paj_Receipt_${receipt.id}.pdf`;
    doc.save(fileName);
}

// Helper functions
function shortenAddress(address: string): string {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
}

function shortenHash(hash: string): string {
    if (hash.length <= 32) return hash;
    return `${hash.slice(0, 16)}...${hash.slice(-16)}`;
}

function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 3)}...`;
}
