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

/**
 * Generate and download a PDF receipt for a transaction
 * 
 * @param transaction - Transaction data including items, amounts, and blockchain info
 * 
 * @example
 * generateReceipt({
 *   id: 'ORDER-123',
 *   date: new Date(),
 *   buyerAddress: 'ABC...XYZ',
 *   sellerAddress: 'DEF...UVW',
 *   items: [
 *     { name: 'Textbook', quantity: 1, price: 50, total: 50 }
 *   ],
 *   subtotal: 50,
 *   platformFee: 2.5,
 *   total: 52.5,
 *   txHash: '5x...',
 *   network: 'devnet'
 * });
 */
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
    const addText = (text: string, x: number, y: number, options?: any) => {
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
