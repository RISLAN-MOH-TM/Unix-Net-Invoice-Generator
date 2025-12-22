document.addEventListener('DOMContentLoaded', function() {
    // Set default dates only
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    document.getElementById('invoiceDate').value = today.toISOString().split('T')[0];
    document.getElementById('dueDate').value = nextWeek.toISOString().split('T')[0];
    
    // Set automatic invoice number
    setNextInvoiceNumber();
    
    // Load saved invoice data if exists
    loadSavedInvoiceData();
    
    // Keep form clean - no sample data
    
    // Add item functionality
    document.getElementById('addItem').addEventListener('click', addItem);
    
    // Remove item functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            e.target.parentElement.remove();
        }
    });
    
    // Form submission
    document.getElementById('invoiceForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generateInvoice();
    });
    
    // Auto-save form data as user types
    document.addEventListener('input', function(e) {
        if (e.target.closest('#invoiceForm')) {
            saveInvoiceData();
        }
    });
});

function addItem() {
    const itemsContainer = document.getElementById('itemsContainer');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <input type="text" placeholder="Description" class="item-desc" required>
        <input type="number" placeholder="Price" class="item-price" step="0.01" required>
        <input type="number" placeholder="Qty" class="item-qty" value="1" min="1" required>
        <button type="button" class="remove-item">Remove</button>
    `;
    itemsContainer.appendChild(itemRow);
}

function generateInvoice() {
    // Get form data
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceDate = formatDate(document.getElementById('invoiceDate').value);
    const dueDate = formatDate(document.getElementById('dueDate').value);
    const clientName = document.getElementById('clientName').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientPhone = document.getElementById('clientPhone').value;
    const alreadyPaid = parseFloat(document.getElementById('alreadyPaid').value) || 0;
    const bankName = document.getElementById('bankName').value;
    const accountName = document.getElementById('accountName').value;
    const accountNumber = document.getElementById('accountNumber').value;
    
    // Get items
    const itemRows = document.querySelectorAll('.item-row');
    const items = [];
    let subtotal = 0;
    
    itemRows.forEach((row, index) => {
        const desc = row.querySelector('.item-desc').value;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const qty = parseInt(row.querySelector('.item-qty').value) || 1;
        const total = price * qty;
        
        items.push({
            no: index + 1,
            description: desc,
            price: price,
            qty: qty,
            total: total
        });
        
        subtotal += total;
    });
    
    const totalDue = subtotal - alreadyPaid;
    
    // Update invoice display
    document.getElementById('displayInvoiceNumber').textContent = invoiceNumber;
    document.getElementById('displayInvoiceDate').textContent = invoiceDate;
    document.getElementById('displayDueDate').textContent = dueDate;
    document.getElementById('displayClientName').textContent = clientName;
    document.getElementById('displayClientAddress').textContent = clientAddress;
    document.getElementById('displayClientPhone').textContent = clientPhone;
    document.getElementById('displaySubTotal').textContent = formatCurrency(subtotal);
    document.getElementById('displayAlreadyPaid').textContent = formatCurrency(alreadyPaid);
    document.getElementById('displayTotalDue').textContent = formatCurrency(totalDue);
    document.getElementById('displayBankName').textContent = bankName;
    document.getElementById('displayAccountName').textContent = accountName;
    document.getElementById('displayAccountNumber').textContent = accountNumber;
    
    // Update items table
    const itemsTableBody = document.getElementById('invoiceItems');
    itemsTableBody.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.no}</td>
            <td>${item.description}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${item.qty}</td>
            <td>${formatCurrency(item.total)}</td>
        `;
        itemsTableBody.appendChild(row);
    });
    
    // Show invoice and hide form
    document.querySelector('.form-section').style.display = 'none';
    document.getElementById('invoicePreview').style.display = 'block';
    
    // Save completed invoice to history
    const completedInvoiceData = {
        invoiceNumber,
        invoiceDate,
        dueDate,
        clientName,
        clientAddress,
        clientPhone,
        items,
        subtotal,
        alreadyPaid,
        totalDue,
        bankName,
        accountName,
        accountNumber
    };
    
    saveCompletedInvoice(completedInvoiceData);
    
    // Save current invoice number and increment for next
    saveInvoiceNumber();
    
    // Clear current draft data
    localStorage.removeItem('currentInvoiceData');
    
    // Scroll to invoice
    document.getElementById('invoicePreview').scrollIntoView({ behavior: 'smooth' });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return 'RS.' + amount.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function downloadPDF() {
    try {
        // Get invoice details for filename
        const invoiceNumber = document.getElementById('displayInvoiceNumber').textContent || '001';
        const clientName = document.getElementById('displayClientName').textContent || 'Client';
        
        // Create a new window with a proper name
        const windowName = `Invoice_${invoiceNumber}_${clientName.replace(/\s+/g, '_')}`;
        const printWindow = window.open('', windowName);
        
        if (!printWindow) {
            throw new Error('Pop-up blocked. Please allow pop-ups for this site and try again.');
        }
        
        const invoiceContainer = document.querySelector('.invoice-container');
        
        if (!invoiceContainer) {
            throw new Error('Invoice container not found. Please generate the invoice first.');
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Unix-Net Technologies - Invoice ${invoiceNumber} - ${clientName}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        background: white; 
                        margin: 0;
                        padding: 20px;
                    }
                    .invoice-container { 
                        max-width: 700px; 
                        margin: 0 auto; 
                        background: white;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 0 20px rgba(0,0,0,0.1);
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                    }
                    .invoice-header { 
                        display: flex; 
                        height: 140px; 
                        margin-bottom: 0; 
                    }
                    .logo { 
                        background: #4a4a4a; 
                        padding: 20px 30px; 
                        border-radius: 0 0 60px 0; 
                        width: 320px; 
                        display: flex; 
                        align-items: center; 
                        justify-content: flex-start; 
                    }
                    .logo-image { 
                        height: 60px; 
                        width: auto; 
                        margin-right: 15px; 
                        object-fit: contain; 
                    }
                    .company-name { 
                        font-size: 14px; 
                        font-weight: bold; 
                        line-height: 1.1; 
                        color: white; 
                        letter-spacing: 1px; 
                    }
                    .invoice-title { 
                        background: #f0f0f0; 
                        padding: 20px 40px; 
                        border-radius: 60px 0 0 0; 
                        flex: 1; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                    }
                    .invoice-title h1 { 
                        font-size: 42px; 
                        color: #333; 
                        font-weight: bold; 
                        margin: 0; 
                        letter-spacing: 4px; 
                    }
                    .invoice-details { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 20px; 
                        padding: 30px 40px 20px 40px; 
                        background: white; 
                    }
                    .invoice-info { flex: 1; }
                    .invoice-number { 
                        font-size: 18px; 
                        margin-bottom: 20px; 
                        font-weight: normal; 
                    }
                    .invoice-number strong { font-weight: bold; }
                    .dates div { 
                        margin-bottom: 6px; 
                        font-size: 14px; 
                    }
                    .dates strong { font-weight: bold; }
                    .bill-to { 
                        flex: 1; 
                        text-align: left; 
                        padding-left: 60px; 
                    }
                    .bill-to div:first-child { 
                        font-weight: bold; 
                        margin-bottom: 10px; 
                        font-size: 16px; 
                    }
                    .bill-to div:nth-child(2) { 
                        font-weight: bold; 
                        margin-bottom: 4px; 
                        font-size: 16px; 
                    }
                    .bill-to div:nth-child(3) { 
                        margin-bottom: 4px; 
                        font-size: 14px; 
                        line-height: 1.3; 
                    }
                    .bill-to div:nth-child(4) { font-size: 14px; }
                    .invoice-table { 
                        width: calc(100% - 80px); 
                        border-collapse: collapse; 
                        margin: 0 40px 20px 40px; 
                    }
                    .invoice-table thead { 
                        background: #9cb357; 
                        color: white; 
                    }
                    .invoice-table th { 
                        padding: 10px 12px; 
                        text-align: center; 
                        font-weight: bold; 
                        font-size: 13px; 
                        letter-spacing: 0.5px; 
                    }
                    .invoice-table th:first-child { 
                        text-align: center; 
                        width: 50px; 
                    }
                    .invoice-table th:nth-child(2) { 
                        text-align: left; 
                        width: 45%; 
                    }
                    .invoice-table th:nth-child(3),
                    .invoice-table th:nth-child(4),
                    .invoice-table th:nth-child(5) { 
                        text-align: center; 
                        width: 18%; 
                    }
                    .invoice-table td { 
                        padding: 12px; 
                        text-align: center; 
                        border-bottom: 1px solid #eee; 
                        font-size: 14px; 
                    }
                    .invoice-table td:nth-child(2) { 
                        text-align: left; 
                        font-weight: bold; 
                    }
                    .invoice-table tbody tr:nth-child(even) { 
                        background: #f8f9fa; 
                    }
                    .invoice-table tbody tr:nth-child(odd) { 
                        background: white; 
                    }
                    .invoice-totals { 
                        margin-left: auto; 
                        width: 250px; 
                        margin-bottom: 25px; 
                        margin-right: 40px; 
                        margin-top: 10px; 
                    }
                    .totals-row { 
                        display: flex; 
                        justify-content: space-between; 
                        padding: 6px 12px; 
                        font-size: 14px; 
                    }
                    .totals-row:not(.total-due) { 
                        border-bottom: none; 
                        background: white; 
                    }
                    .total-due { 
                        background: #9cb357; 
                        color: white; 
                        padding: 10px 12px; 
                        font-weight: bold; 
                        font-size: 16px; 
                        margin-top: 3px; 
                    }
                    .payment-info { 
                        display: grid; 
                        grid-template-columns: 1fr 2fr 1fr; 
                        gap: 40px; 
                        margin-bottom: 40px; 
                        padding: 30px 40px; 
                        background: white; 
                        flex-grow: 1;
                    }
                    .payment-method h3,
                    .terms h3 { 
                        margin-bottom: 15px; 
                        color: #333; 
                        font-size: 16px; 
                        font-weight: bold; 
                    }
                    .payment-method div { 
                        font-size: 14px; 
                        margin-bottom: 8px; 
                        color: #666; 
                    }
                    .terms p { 
                        font-size: 13px; 
                        line-height: 1.5; 
                        text-align: justify; 
                        color: #555; 
                    }
                    .signature { 
                        text-align: center; 
                        align-self: end; 
                    }
                    .signature div:first-child { 
                        font-weight: bold; 
                        margin-bottom: 0px; 
                        font-size: 16px; 
                        color: #333; 
                    }
                    .signature div:last-child { 
                        font-size: 14px; 
                        color: #666; 
                    }
                    .invoice-footer { 
                        background: #4a4a4a; 
                        color: white; 
                        text-align: center; 
                        padding: 30px; 
                        border-radius: 60px 60px 0 0; 
                        margin-top: auto; 
                        font-size: 18px; 
                        font-weight: bold; 
                    }
                    .company-footer { 
                        color: #9cb357; 
                        font-weight: bold; 
                        margin-top: 8px; 
                        font-size: 16px; 
                        letter-spacing: 2px; 
                    }
                    @media print {
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: white !important; 
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .invoice-container { 
                            box-shadow: none; 
                            border-radius: 0;
                            max-width: none;
                            width: 100%;
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                        }
                        .invoice-header { 
                            height: 140px !important; 
                        }
                        .logo { 
                            background: #4a4a4a !important; 
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .invoice-title { 
                            background: #f0f0f0 !important; 
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .invoice-table thead { 
                            background: #9cb357 !important; 
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .total-due { 
                            background: #9cb357 !important; 
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .invoice-footer { 
                            background: #4a4a4a !important; 
                            color: white !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            margin-top: auto;
                        }
                        .company-footer { 
                            color: #9cb357 !important;
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                        .payment-info {
                            flex-grow: 1;
                        }
                    }
                </style>
            </head>
            <body>
                ${invoiceContainer.outerHTML}
                <script>
                    // Ensure title is set
                    document.title = 'Unix-Net Technologies - Invoice ${invoiceNumber} - ${clientName}';
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Set the title again after document is closed
        setTimeout(() => {
            printWindow.document.title = 'Unix-Net Technologies - Invoice ' + invoiceNumber + ' - ' + clientName;
        }, 100);
        
        // Wait for content to load, then trigger print dialog
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            
            // Close the window after printing
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        }, 500);
        
    } catch (error) {
        console.error('Download error:', error);
        showDownloadError(error.message);
    }
}

function showDownloadError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 20px; border-radius: 10px; z-index: 1000; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                <strong>Download Error</strong>
            </div>
            <p style="margin-bottom: 15px; line-height: 1.4;">${message}</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="retryDownload()" style="background: white; color: #dc3545; border: 1px solid white; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    🔄 Retry
                </button>
                <button onclick="closeErrorNotification()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Remove any existing error notifications
    const existingError = document.querySelector('.download-error-notification');
    if (existingError) {
        document.body.removeChild(existingError);
    }
    
    errorDiv.className = 'download-error-notification';
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 10000);
}

function retryDownload() {
    closeErrorNotification();
    downloadPDF();
}

function closeErrorNotification() {
    const errorDiv = document.querySelector('.download-error-notification');
    if (errorDiv && document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
    }
}

function editInvoice() {
    document.querySelector('.form-section').style.display = 'block';
    document.getElementById('invoicePreview').style.display = 'none';
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function shareWhatsApp() {
    try {
        // Hide action buttons during image generation
        const actionButtons = document.querySelector('.action-buttons');
        actionButtons.style.display = 'none';
        
        const invoiceContainer = document.querySelector('.invoice-container');
        
        if (!invoiceContainer) {
            throw new Error('Invoice container not found. Please generate the invoice first.');
        }
        
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.innerHTML = '📱 Preparing invoice image for WhatsApp...';
        loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #25D366; color: white; padding: 20px; border-radius: 10px; z-index: 1000; font-size: 16px;';
        loadingMsg.className = 'whatsapp-loading';
        document.body.appendChild(loadingMsg);
        
        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            throw new Error('Image generation library not loaded. Please refresh the page and try again.');
        }
        
        // Use html2canvas to capture the invoice as image
        html2canvas(invoiceContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: invoiceContainer.offsetWidth,
            height: invoiceContainer.offsetHeight
        }).then(canvas => {
            // Convert canvas to blob
            canvas.toBlob(function(blob) {
                if (!blob) {
                    throw new Error('Failed to generate invoice image. Please try again.');
                }
                
                // Get invoice details for filename
                const invoiceNumber = document.getElementById('displayInvoiceNumber').textContent || '001';
                const clientName = document.getElementById('displayClientName').textContent || 'Client';
                const filename = `Invoice-${invoiceNumber}-${clientName.replace(/\s+/g, '-')}.png`;
                
                // Create download link for the image
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                
                // Check if Web Share API is supported (for mobile devices)
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
                    // Use Web Share API (works on mobile)
                    const file = new File([blob], filename, { type: 'image/png' });
                    navigator.share({
                        title: `Invoice ${invoiceNumber} - ${clientName}`,
                        text: `Invoice from Unix-Net Technologies`,
                        files: [file]
                    }).then(() => {
                        console.log('Invoice shared successfully');
                    }).catch(err => {
                        console.log('Error sharing:', err);
                        fallbackShare(link, blob, filename);
                    });
                } else {
                    // Fallback for desktop or unsupported browsers
                    fallbackShare(link, blob, filename);
                }
                
                // Clean up
                const loadingElement = document.querySelector('.whatsapp-loading');
                if (loadingElement && document.body.contains(loadingElement)) {
                    document.body.removeChild(loadingElement);
                }
                actionButtons.style.display = 'block';
                
            }, 'image/png', 0.95);
            
        }).catch(error => {
            console.error('Error generating image:', error);
            
            // Clean up loading message
            const loadingElement = document.querySelector('.whatsapp-loading');
            if (loadingElement && document.body.contains(loadingElement)) {
                document.body.removeChild(loadingElement);
            }
            actionButtons.style.display = 'block';
            
            // Show error and fallback to text sharing
            showWhatsAppError('Failed to generate invoice image. Switching to text sharing.');
            setTimeout(() => {
                shareWhatsAppText();
            }, 2000);
        });
        
    } catch (error) {
        console.error('WhatsApp share error:', error);
        
        // Clean up any loading messages
        const loadingElement = document.querySelector('.whatsapp-loading');
        if (loadingElement && document.body.contains(loadingElement)) {
            document.body.removeChild(loadingElement);
        }
        
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'block';
        }
        
        showWhatsAppError(error.message);
    }
}

function showWhatsAppError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #dc3545; color: white; padding: 20px; border-radius: 10px; z-index: 1000; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 10px;">📱</span>
                <strong>WhatsApp Share Error</strong>
            </div>
            <p style="margin-bottom: 15px; line-height: 1.4;">${message}</p>
            <div style="display: flex; gap: 10px;">
                <button onclick="retryWhatsAppShare()" style="background: white; color: #dc3545; border: 1px solid white; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    🔄 Retry
                </button>
                <button onclick="shareWhatsAppText()" style="background: #25D366; color: white; border: 1px solid #25D366; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    📝 Text Share
                </button>
                <button onclick="closeWhatsAppError()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Remove any existing error notifications
    const existingError = document.querySelector('.whatsapp-error-notification');
    if (existingError) {
        document.body.removeChild(existingError);
    }
    
    errorDiv.className = 'whatsapp-error-notification';
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
        }
    }, 8000);
}

function retryWhatsAppShare() {
    closeWhatsAppError();
    shareWhatsApp();
}

function closeWhatsAppError() {
    const errorDiv = document.querySelector('.whatsapp-error-notification');
    if (errorDiv && document.body.contains(errorDiv)) {
        document.body.removeChild(errorDiv);
    }
}

function fallbackShare(link, blob, filename) {
    // Create a temporary container for instructions
    const instructionDiv = document.createElement('div');
    instructionDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center;">
                <h3 style="color: #25D366; margin-bottom: 20px;">📱 Share Invoice to WhatsApp</h3>
                <p style="margin-bottom: 20px; line-height: 1.5;">
                    1. Click "Download Image" below<br>
                    2. Open WhatsApp on your phone/computer<br>
                    3. Go to the chat where you want to send the invoice<br>
                    4. Click attach (📎) and select the downloaded image
                </p>
                <div style="margin: 20px 0;">
                    <button onclick="downloadInvoiceImage()" style="background: #25D366; color: white; border: none; padding: 15px 25px; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                        📥 Download Image
                    </button>
                    <button onclick="openWhatsApp()" style="background: #25D366; color: white; border: none; padding: 15px 25px; border-radius: 8px; font-size: 16px; cursor: pointer;">
                        📱 Open WhatsApp
                    </button>
                </div>
                <button onclick="closeInstructions()" style="background: #ccc; color: #333; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(instructionDiv);
    
    // Store the download link globally for the download function
    window.invoiceDownloadLink = link;
}

function downloadInvoiceImage() {
    if (window.invoiceDownloadLink) {
        window.invoiceDownloadLink.click();
    }
}

function openWhatsApp() {
    window.open('https://web.whatsapp.com/', '_blank');
}

function closeInstructions() {
    const instructionDiv = document.querySelector('div[style*="position: fixed"]').parentElement;
    if (instructionDiv) {
        document.body.removeChild(instructionDiv);
    }
}

function shareWhatsAppText() {
    // Fallback to text sharing (original function)
    const invoiceNumber = document.getElementById('displayInvoiceNumber').textContent || '001';
    const clientName = document.getElementById('displayClientName').textContent || 'Client';
    const totalDue = document.getElementById('displayTotalDue').textContent || 'RS.0';
    const invoiceDate = document.getElementById('displayInvoiceDate').textContent || '';
    const dueDate = document.getElementById('displayDueDate').textContent || '';
    
    const message = `🧾 *INVOICE FROM UNIX-NET TECHNOLOGIES*
    
📋 *Invoice Details:*
• Invoice #: ${invoiceNumber}
• Client: ${clientName}
• Invoice Date: ${invoiceDate}
• Due Date: ${dueDate}

💰 *Total Amount Due: ${totalDue}*

📞 *Contact:*
Unix-Net Technologies
For any queries, please contact us.

Thank you for your business! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Auto-calculate totals as user types
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('item-price') || e.target.classList.contains('item-qty')) {
        updateItemTotal(e.target.closest('.item-row'));
    }
});

function updateItemTotal(row) {
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const qty = parseInt(row.querySelector('.item-qty').value) || 1;
    // You could add a total display here if needed
}

function clearForm() {
    // Clear all form fields
    document.getElementById('invoiceDate').value = '';
    document.getElementById('dueDate').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('alreadyPaid').value = '0';
    document.getElementById('bankName').value = '';
    document.getElementById('accountName').value = '';
    document.getElementById('accountNumber').value = '';
    
    // Clear all invoice items except the first one
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="Description" class="item-desc" required>
            <input type="number" placeholder="Price" class="item-price" step="0.01" required>
            <input type="number" placeholder="Qty" class="item-qty" value="1" min="1" required>
            <button type="button" class="remove-item">Remove</button>
        </div>
    `;
    
    // Reset dates to today and next week
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    document.getElementById('invoiceDate').value = today.toISOString().split('T')[0];
    document.getElementById('dueDate').value = nextWeek.toISOString().split('T')[0];
    
    // Set next invoice number
    setNextInvoiceNumber();
    
    // Clear saved data
    localStorage.removeItem('currentInvoiceData');
    
    // Show success message
    const successMsg = document.createElement('div');
    successMsg.innerHTML = '✅ Form cleared successfully!';
    successMsg.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #28a745; color: white; padding: 15px 20px; border-radius: 5px; z-index: 1000; font-size: 14px;';
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
        document.body.removeChild(successMsg);
    }, 2000);
}

// Automatic Invoice Numbering System
function setNextInvoiceNumber() {
    let lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber') || '000';
    let nextNumber = (parseInt(lastInvoiceNumber) + 1).toString().padStart(3, '0');
    document.getElementById('invoiceNumber').value = nextNumber;
}

function saveInvoiceNumber() {
    const currentNumber = document.getElementById('invoiceNumber').value;
    localStorage.setItem('lastInvoiceNumber', currentNumber);
}

// Invoice Data Saving System
function saveInvoiceData() {
    const formData = {
        invoiceNumber: document.getElementById('invoiceNumber').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        dueDate: document.getElementById('dueDate').value,
        clientName: document.getElementById('clientName').value,
        clientAddress: document.getElementById('clientAddress').value,
        clientPhone: document.getElementById('clientPhone').value,
        alreadyPaid: document.getElementById('alreadyPaid').value,
        bankName: document.getElementById('bankName').value,
        accountName: document.getElementById('accountName').value,
        accountNumber: document.getElementById('accountNumber').value,
        items: []
    };
    
    // Save items
    const itemRows = document.querySelectorAll('.item-row');
    itemRows.forEach(row => {
        const desc = row.querySelector('.item-desc').value;
        const price = row.querySelector('.item-price').value;
        const qty = row.querySelector('.item-qty').value;
        
        if (desc || price || qty) {
            formData.items.push({ desc, price, qty });
        }
    });
    
    localStorage.setItem('currentInvoiceData', JSON.stringify(formData));
}

function loadSavedInvoiceData() {
    const savedData = localStorage.getItem('currentInvoiceData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        // Load basic fields (but keep auto-generated invoice number)
        document.getElementById('invoiceDate').value = data.invoiceDate || '';
        document.getElementById('dueDate').value = data.dueDate || '';
        document.getElementById('clientName').value = data.clientName || '';
        document.getElementById('clientAddress').value = data.clientAddress || '';
        document.getElementById('clientPhone').value = data.clientPhone || '';
        document.getElementById('alreadyPaid').value = data.alreadyPaid || '0';
        document.getElementById('bankName').value = data.bankName || '';
        document.getElementById('accountName').value = data.accountName || '';
        document.getElementById('accountNumber').value = data.accountNumber || '';
        
        // Load items
        if (data.items && data.items.length > 0) {
            const itemsContainer = document.getElementById('itemsContainer');
            itemsContainer.innerHTML = '';
            
            data.items.forEach(item => {
                const itemRow = document.createElement('div');
                itemRow.className = 'item-row';
                itemRow.innerHTML = `
                    <input type="text" placeholder="Description" class="item-desc" value="${item.desc || ''}" required>
                    <input type="number" placeholder="Price" class="item-price" value="${item.price || ''}" step="0.01" required>
                    <input type="number" placeholder="Qty" class="item-qty" value="${item.qty || '1'}" min="1" required>
                    <button type="button" class="remove-item">Remove</button>
                `;
                itemsContainer.appendChild(itemRow);
            });
        }
    }
}

// Save completed invoice to history
function saveCompletedInvoice(invoiceData) {
    let invoiceHistory = JSON.parse(localStorage.getItem('invoiceHistory') || '[]');
    
    const completedInvoice = {
        ...invoiceData,
        createdDate: new Date().toISOString(),
        id: Date.now()
    };
    
    invoiceHistory.unshift(completedInvoice); // Add to beginning
    
    // Keep only last 50 invoices
    if (invoiceHistory.length > 50) {
        invoiceHistory = invoiceHistory.slice(0, 50);
    }
    
    localStorage.setItem('invoiceHistory', JSON.stringify(invoiceHistory));
}