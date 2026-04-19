const baseTemplate = (title, content) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0F172A; color: #F1F5F9; border-radius: 8px; overflow: hidden; border: 1px solid #1E293B;">
    <div style="background-color: #1E293B; padding: 20px; text-align: center; border-bottom: 2px solid #6366F1;">
      <h1 style="color: #6366F1; margin: 0; font-size: 24px; letter-spacing: -0.5px;">SmartShelfX</h1>
      <p style="color: #22D3EE; margin: 5px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">AI-Powered Inventory Intelligence</p>
    </div>
    <div style="padding: 30px; background-color: #0F172A;">
      <h2 style="color: #F8FAFC; margin-top: 0; font-size: 20px; border-bottom: 1px solid #1E293B; padding-bottom: 10px;">${title}</h2>
      ${content}
    </div>
    <div style="text-align: center; padding: 15px; background-color: #1E293B; font-size: 12px; color: #94A3B8;">
      &copy; ${new Date().getFullYear()} SmartShelfX. All rights reserved. <br>
      <span style="opacity: 0.7;">This is an automated notification.</span>
    </div>
  </div>
`;

export const getPOCreatedEmailForVendor = (data) => {
    const content = `
        <p style="font-size: 16px;">Hello <strong>${data.vendorName}</strong>,</p>
        <p style="color: #CBD5E1;">A new Purchase Order (<strong>${data.poNumber}</strong>) has been generated and awaits your approval.</p>
        
        <div style="background-color: #1E293B; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #94A3B8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #94A3B8; width: 40%;">Product:</td><td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${data.productName}</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">SKU:</td><td style="padding: 8px 0; font-family: monospace; color: #38BDF8;">${data.sku}</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">Quantity:</td><td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${data.quantity}</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">Unit Price:</td><td style="padding: 8px 0; color: #F8FAFC;">$${data.unitPrice.toFixed(2)}</td></tr>
                <tr style="border-top: 1px solid #334155;"><td style="padding: 12px 0 8px 0; color: #94A3B8; font-weight: bold;">Total Amount:</td><td style="padding: 12px 0 8px 0; font-weight: bold; color: #10B981; font-size: 16px;">$${data.totalAmount.toFixed(2)}</td></tr>
            </table>
            ${data.internalNote ? `
            <div style="margin-top: 15px; padding: 10px; background-color: #0F172A; border-left: 3px solid #6366F1; font-size: 13px; color: #CBD5E1;">
                <strong>Note:</strong> ${data.internalNote}
            </div>` : ''}
        </div>

        <div style="text-align: center; margin: 35px 0;">
            <a href="${data.approveUrl}" style="background-color: #10B981; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 15px; border: 1px solid #059669; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">✅ APPROVE ORDER</a>
            <a href="${data.rejectUrl}" style="background-color: transparent; color: #F43F5E; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block; border: 1px solid #F43F5E; box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.1);">❌ REJECT ORDER</a>
        </div>
        
        <p style="font-size: 12px; color: #64748B; text-align: center;">
            Created by ${data.createdByName} on ${new Date().toLocaleDateString()}
        </p>
    `;
    return baseTemplate(`📦 New Purchase Order ${data.poNumber} — Action Required`, content);
};

export const getPOApprovedEmailForManager = (data) => {
    const content = `
        <p style="font-size: 16px;">Hello <strong>${data.managerName}</strong>,</p>
        <p style="color: #CBD5E1;">Purchase Order <strong>${data.poNumber}</strong> has been officially <span style="color: #10B981; font-weight: bold;">APPROVED</span> by the vendor.</p>
        
        <div style="background-color: #1E293B; border: 1px solid #10B981; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 8px 0; color: #94A3B8; width: 40%;">Vendor:</td><td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${data.vendorName}</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">Product:</td><td style="padding: 8px 0; font-weight: bold; color: #F8FAFC;">${data.productName}</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">Total Order:</td><td style="padding: 8px 0; color: #F8FAFC;">${data.quantity} units ($${data.totalAmount.toFixed(2)})</td></tr>
                <tr><td style="padding: 8px 0; color: #94A3B8;">Expected Delivery:</td><td style="padding: 8px 0; font-weight: bold; color: #38BDF8;">${data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toLocaleDateString() : 'Pending Confirmation'}</td></tr>
            </table>
            ${data.vendorNote ? `
            <div style="margin-top: 15px; padding: 10px; background-color: #0F172A; border-left: 3px solid #10B981; font-size: 13px; color: #CBD5E1;">
                <strong>Vendor Comment:</strong> ${data.vendorNote}
            </div>` : ''}
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.viewUrl}" style="background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">View Full Purchase Order</a>
        </div>
    `;
    return baseTemplate(`✅ PO ${data.poNumber} Approved by ${data.vendorName}`, content);
};

export const getPORejectedEmailForManager = (data) => {
    const content = `
        <p style="font-size: 16px;">Hello <strong>${data.managerName}</strong>,</p>
        <p style="color: #CBD5E1;">Purchase Order <strong>${data.poNumber}</strong> has been <span style="color: #F43F5E; font-weight: bold;">REJECTED</span> by the vendor.</p>
        
        <div style="background-color: rgba(245, 158, 11, 0.1); border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #FCD34D; font-size: 14px; display: flex; align-items: center;">⚠️ Rejection Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 15px;">
                <tr><td style="padding: 4px 0; color: #D4D4D8; width: 40%;">Vendor:</td><td style="padding: 4px 0; font-weight: bold; color: #F8FAFC;">${data.vendorName}</td></tr>
                <tr><td style="padding: 4px 0; color: #D4D4D8;">Product:</td><td style="padding: 4px 0; font-weight: bold; color: #F8FAFC;">${data.productName}</td></tr>
            </table>
            <div style="background-color: #0F172A; padding: 15px; border-radius: 6px; color: #FCA5A5; font-weight: 500; font-style: italic;">
                "${data.rejectionReason || 'No specific reason provided by vendor.'}"
            </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${data.viewUrl}" style="background-color: #1E293B; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block; border: 1px solid #64748B;">View Details & Issue New PO</a>
        </div>
    `;
    return baseTemplate(`❌ PO ${data.poNumber} Rejected by Vendor`, content);
};

export const getPOReceivedEmailForVendor = (data) => {
    const content = `
        <p style="font-size: 16px;">Hello <strong>${data.vendorName}</strong>,</p>
        <p style="color: #CBD5E1;">This is a confirmation that Purchase Order <strong>${data.poNumber}</strong> has been successfully <span style="color: #10B981; font-weight: bold;">RECEIVED</span> at our facility.</p>
        
        <div style="background-color: #1E293B; border-left: 4px solid #10B981; border-radius: 4px; padding: 15px 20px; margin: 25px 0;">
            <ul style="margin: 0; padding-left: 20px; color: #F8FAFC; font-size: 14px; line-height: 1.6;">
                <li><strong>Product:</strong> ${data.productName}</li>
                <li><strong>Quantity Received:</strong> ${data.quantity} units</li>
                <li><strong>Received At:</strong> ${new Date(data.receivedAt).toLocaleString()}</li>
                <li><strong>Processed By:</strong> ${data.receivedByName}</li>
            </ul>
        </div>

        <p style="color: #94A3B8; font-size: 14px;">Thank you for your prompt fulfillment. The stock has been officially admitted into our inventory system.</p>
    `;
    return baseTemplate(`📬 PO ${data.poNumber} Marked as Received`, content);
};

export const getPOCancelledEmail = (data) => {
    const content = `
        <p style="font-size: 16px;">Hello <strong>${data.recipientName}</strong>,</p>
        <p style="color: #CBD5E1;">Please be advised that Purchase Order <strong>${data.poNumber}</strong> for <strong>${data.productName}</strong> has been <span style="color: #F43F5E; font-weight: bold;">CANCELLED</span>.</p>
        
        <div style="background-color: #1E293B; border-left: 4px solid #F43F5E; border-radius: 4px; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 10px 0; color: #94A3B8; font-size: 13px;">Cancellation Details:</p>
            <p style="margin: 0 0 5px 0; color: #F8FAFC; font-size: 14px;"><strong>Cancelled By:</strong> ${data.cancelledByName}</p>
            <p style="margin: 0; color: #F8FAFC; font-size: 14px;"><strong>Reason:</strong> ${data.reason || 'No specific reason provided.'}</p>
        </div>

        <p style="color: #94A3B8; font-size: 14px;">If you have already processed or dispatched this order, please contact the purchasing department immediately.</p>
    `;
    return baseTemplate(`🚫 PO ${data.poNumber} Has Been Cancelled`, content);
};

export const getWeeklyReportEmail = (data) => {
    const { period, highlights, vsLastWeek } = data;
    
    // Formatting helpers
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    const formatDelta = (val) => {
        if (val > 0) return `<span style="color: #10B981; font-weight: bold;">▲ +${val.toFixed(1)}%</span>`;
        if (val < 0) return `<span style="color: #EF4444; font-weight: bold;">▼ ${val.toFixed(1)}%</span>`;
        return `<span style="color: #94A3B8; font-weight: bold;">— 0%</span>`;
    };

    const content = `
        <div style="text-align: center; margin-bottom: 25px;">
            <div style="display: inline-block; background-color: #38BDF8; color: #0F172A; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 10px;">
                ${formatDate(period.start)} – ${formatDate(period.end)}
            </div>
        </div>

        <!-- KPI Row -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; text-align: center;">
            <tr>
                <td style="padding: 15px 10px; background-color: #1E293B; border-radius: 8px; width: 25%; border: 2px solid #0F172A;">
                    <div style="font-size: 20px; margin-bottom: 5px;">📦</div>
                    <div style="font-size: 18px; font-weight: bold; color: #F8FAFC;">${highlights.totalTransactions}</div>
                    <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Transactions</div>
                </td>
                <td style="padding: 15px 10px; background-color: #1E293B; border-radius: 8px; width: 25%; border: 2px solid #0F172A;">
                    <div style="font-size: 20px; margin-bottom: 5px;">📥</div>
                    <div style="font-size: 18px; font-weight: bold; color: #10B981;">${highlights.totalStockIn}</div>
                    <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Units In</div>
                </td>
                <td style="padding: 15px 10px; background-color: #1E293B; border-radius: 8px; width: 25%; border: 2px solid #0F172A;">
                    <div style="font-size: 20px; margin-bottom: 5px;">📤</div>
                    <div style="font-size: 18px; font-weight: bold; color: #38BDF8;">${highlights.totalStockOut}</div>
                    <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">Units Out</div>
                </td>
                <td style="padding: 15px 10px; background-color: #1E293B; border-radius: 8px; width: 25%; border: 2px solid #0F172A;">
                    <div style="font-size: 20px; margin-bottom: 5px;">🛒</div>
                    <div style="font-size: 18px; font-weight: bold; color: #F59E0B;">${highlights.newPOs}</div>
                    <div style="font-size: 11px; color: #94A3B8; text-transform: uppercase;">New POs</div>
                </td>
            </tr>
        </table>

        <!-- vs Last Week Row -->
        <div style="background-color: #1E293B; border-radius: 8px; padding: 15px; margin-bottom: 25px; border-left: 3px solid #6366F1;">
            <p style="margin: 0 0 10px 0; color: #CBD5E1; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Performance vs Last Week</p>
            <table style="width: 100%; font-size: 14px;">
                <tr>
                    <td style="color: #94A3B8; padding: 4px 0;">Transactions:</td><td style="text-align: right;">${formatDelta(vsLastWeek.transactionsDelta)}</td>
                </tr>
                <tr>
                    <td style="color: #94A3B8; padding: 4px 0;">Stock Value:</td><td style="text-align: right;">${formatDelta(vsLastWeek.stockValueDelta)}</td>
                </tr>
                <tr>
                    <td style="color: #94A3B8; padding: 4px 0;">PO Value:</td><td style="text-align: right;">${formatDelta(vsLastWeek.poValueDelta)}</td>
                </tr>
            </table>
        </div>

        <!-- Low Stock Alert Section -->
        ${highlights.lowStockProducts && highlights.lowStockProducts.length > 0 ? `
        <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid #F59E0B; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #F59E0B; font-size: 14px;">⚠️ ${highlights.lowStockProducts.length} products need attention:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(245, 158, 11, 0.2); color: #94A3B8;">
                    <th style="padding: 6px 0;">Product</th>
                    <th style="padding: 6px 0;">SKU</th>
                    <th style="padding: 6px 0;">Stock</th>
                </tr>
                ${highlights.lowStockProducts.slice(0, 5).map(p => `
                <tr>
                    <td style="padding: 6px 0; color: #F8FAFC;">${p.name}</td>
                    <td style="padding: 6px 0; color: #94A3B8; font-family: monospace;">${p.sku}</td>
                    <td style="padding: 6px 0; color: ${p.currentStock === 0 ? '#EF4444' : '#F59E0B'}; font-weight: bold;">${p.currentStock}</td>
                </tr>
                `).join('')}
            </table>
            ${highlights.lowStockProducts.length > 5 ? `<p style="font-size: 11px; color: #94A3B8; margin: 10px 0 0 0;">...and ${highlights.lowStockProducts.length - 5} more.</p>` : ''}
        </div>
        ` : ''}

        <!-- Top Moving Products -->
        ${highlights.topMovingProducts && highlights.topMovingProducts.length > 0 ? `
        <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px solid #10B981; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #10B981; font-size: 14px;">🚀 Top performing products this week:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
                <tr style="border-bottom: 1px solid rgba(16, 185, 129, 0.2); color: #94A3B8;">
                    <th style="padding: 6px 0;">Product</th>
                    <th style="padding: 6px 0;">SKU</th>
                    <th style="padding: 6px 0; text-align: right;">Units Out</th>
                </tr>
                ${highlights.topMovingProducts.slice(0, 5).map(p => `
                <tr>
                    <td style="padding: 6px 0; color: #F8FAFC;">${p.name}</td>
                    <td style="padding: 6px 0; color: #94A3B8; font-family: monospace;">${p.sku}</td>
                    <td style="padding: 6px 0; text-align: right; color: #10B981; font-weight: bold;">${p.totalOut}</td>
                </tr>
                `).join('')}
            </table>
        </div>
        ` : ''}

        <!-- Critical Alerts -->
        ${highlights.criticalAlerts > 0 ? `
        <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid #EF4444; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <h3 style="margin: 0; color: #EF4444; font-size: 14px; text-align: center;">🚨 ${highlights.criticalAlerts} critical alert(s) require immediate action</h3>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/analytics" style="background-color: #6366F1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block;">📊 View Full Dashboard</a>
        </div>
        <p style="font-size: 11px; color: #64748B; text-align: center; margin-top: 30px;">
            You are receiving this email because you are registered as an Admin. 
            <br>To unsubscribe, update your notification preferences in settings.
        </p>
    `;
    return baseTemplate(`Weekly Inventory Report`, content);
};
