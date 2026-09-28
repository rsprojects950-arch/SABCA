import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Alert } from 'react-native';

interface Transaction {
    id: string;
    txn_ref?: string;
    date: string;
    amount: string | number;
    description: string;
    type: string;
    status: string;
    payment_method?: string;
}

interface UserProfile {
    full_name: string;
    email: string;
    membership_id?: string;
    sabca_id?: string;
    phone?: string;
}

export const generateReceiptPDF = async (transaction: Transaction, user: UserProfile) => {
    try {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #FDFBF7;
            color: #1a1a1a;
            width: 794px; /* A4 Width @ 96 DPI */
            height: 1123px; /* A4 Height @ 96 DPI */
            margin: 0 auto;
            position: relative;
        }
        .header-bg {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: linear-gradient(135deg, #8B0000 0%, #A52A2A 100%); 
            background-color: #8B0000; /* Fallback */
            z-index: -1;
        }
        
        .container {
            padding: 40px;
            width: 100%;
        }
        
        .logo-box {
            width: 80px;
            height: 80px;
            background-color: #fff;
            border: 2px solid #D4AF37;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
        .logo-text {
            font-size: 40px;
            font-weight: bold;
            color: #D4AF37;
        }
        h1 {
            font-size: 42px;
            text-transform: uppercase;
            margin: 0;
            color: #000;
            letter-spacing: 2px;
            margin-bottom: 40px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-bottom: 1px solid #D4AF37;
            padding-bottom: 20px;
        }
        .meta-col {
            flex: 1;
        }
        .meta-col strong {
            display: block;
            font-size: 14px;
            color: #666;
            margin-bottom: 4px;
        }
        .meta-col span {
            font-size: 18px;
            font-weight: bold;
            color: #000;
        }
        .billing-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 20px;
        }
        .bill-to, .payment-summary {
            flex: 1;
        }
        h3 {
            font-size: 18px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .info-line {
            display: flex;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .info-label {
            font-weight: bold;
            width: 120px;
            color: #000;
            flex-shrink: 0;
        }
        .info-value {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
            border: 1px solid #D4AF37;
        }
        th {
            background-color: #F3E5AB;
            text-align: left;
            padding: 15px;
            border-bottom: 1px solid #D4AF37;
            font-weight: bold;
        }
        td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            background-color: #fff;
        }
        .footer-row {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            gap: 20px;
        }
        .terms {
            flex: 1;
            font-size: 12px;
            color: #666;
        }
        .auth-sign {
            flex: 1;
            text-align: left;
        }
        .sign-line {
            margin-top: 40px;
            border-top: 1px solid #D4AF37;
            padding-top: 10px;
            font-size: 14px;
        }
        .thank-you {
            margin-top: 40px;
            font-size: 24px;
            font-weight: bold;
            color: #000;
        }
        /* Footer positioned absolutely at bottom of A4 page */
        .bottom-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 40px;
            background-color: #8B0000;
            display: flex;
            align-items: center;
            justify-content: space-around;
            color: #fff;
            font-size: 10px;
            width: 100%;
        }
    </style>
</head>
<body>
    
    <!-- Header Shape -->
    <div style="position:absolute; top:0; left:0; width:100%; height:150px; overflow:hidden; z-index:-1;">
         <svg viewBox="0 0 500 150" preserveAspectRatio="none" style="height: 100%; width: 100%;">
            <path d="M0,0 L500,0 L500,100 Q250,180 0,100 Z" fill="#8B0000" />
            <path d="M0,100 Q250,180 500,100 L500,120 Q250,200 0,120 Z" fill="#D4AF37" />
        </svg>
    </div>

    <div class="container" style="margin-top: 60px;">
        <div class="logo-box">
            <span class="logo-text">S</span>
        </div>

        <h1>PAYMENT RECEIPT</h1>

        <div class="meta-row">
            <div class="meta-col">
                <strong>Receipt No:</strong>
                <span>${transaction.txn_ref || transaction.id}</span>
            </div>
            <div class="meta-col">
                <strong>Date:</strong>
                <span>${new Date(transaction.date || new Date().toISOString()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>

        <div class="billing-row">
            <div class="bill-to">
                <h3>Billed To:</h3>
                <div class="info-line">
                    <span class="info-label">Name:</span>
                    <span class="info-value">${user.full_name}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${user.email}</span>
                </div>
                 <div class="info-line">
                    <span class="info-label">Member ID:</span>
                    <span class="info-value">${user.sabca_id || 'PENDING'}</span>
                </div>
            </div>

            <div class="payment-summary">
                <h3>Payment Summary:</h3>
                <div class="info-line">
                    <span class="info-label">Total Paid:</span>
                    <span class="info-value" style="font-weight:bold;">${typeof transaction.amount === 'number' ? '₹' + transaction.amount.toLocaleString() : transaction.amount}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">Method:</span>
                    <span class="info-value">${transaction.payment_method || 'Cash'}</span>
                </div>
                <div class="info-line">
                    <span class="info-label">Status:</span>
                    <span class="info-value">${transaction.status}</span>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="width: 150px;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${transaction.description}</td>
                    <td style="font-weight:bold;">${typeof transaction.amount === 'number' ? '₹' + transaction.amount.toLocaleString() : transaction.amount}</td>
                </tr>
            </tbody>
        </table>

        <div class="footer-row">
            <div class="terms">
                <h3>Payment Terms:</h3>
                <p>For inquiries, contact support@infraxpert.in or +91-9876543210.</p>
                <p>This is a computer generated receipt.</p>
            </div>
            <div class="auth-sign">
                <h3>Authorized By:</h3>
                <p style="font-weight:bold; font-size:16px;">SABCA Treasurer</p>
                <div class="sign-line">
                    Signature
                </div>
            </div>
        </div>

        <div class="thank-you">
            Thank You for<br>Your Contribution!
        </div>

    </div>

    <div class="bottom-bar">
        <span>+91-9876543210</span>
        <span>www.sabca.org</span>
        <span>support@infraxpert.in</span>
        <span>Andhra Pradesh, India</span>
    </div>
</body>
</html>
        `;

        const { uri } = await printToFileAsync({
            html,
            base64: false
        });

        // Show helpful message to guide users
        Alert.alert(
            'Receipt Generated',
            'Your receipt is ready! Use the share menu to:\n\n📥 Save to Files\n📧 Email to yourself\n💬 Share via WhatsApp\n\nTip: Choose "Save to Files" to download it to your device.',
            [
                {
                    text: 'Open Share Menu',
                    onPress: async () => {
                        await shareAsync(uri, {
                            UTI: '.pdf',
                            mimeType: 'application/pdf',
                            dialogTitle: 'Save or Share Receipt'
                        });
                    }
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );

    } catch (error) {
        console.error('Error generating PDF:', error);
        Alert.alert('Error', 'Failed to generate receipt PDF');
    }
};
