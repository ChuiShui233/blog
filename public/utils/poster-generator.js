export async function generatePoster({
    title,
    author,
    date,
    siteName,
    url,
    primaryColor = '#6366f1',
    backgroundColor = '#ffffff',
    coverImage,
    description = ''
}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    
    const simplePrimary = simplifyColor(primaryColor, '#6366f1');
    
    if (coverImage) {
        try {
            const coverImg = await loadImage(coverImage);
            drawCoverImage(ctx, coverImg, width, height);
        } catch (error) {
            console.error('封面图片加载失败:', error);
            drawGradientBackground(ctx, width, height, simplePrimary);
        }
    } else {
        drawGradientBackground(ctx, width, height, simplePrimary);
    }
    
    const gradientOverlay = ctx.createLinearGradient(0, height * 0.4, 0, height);
    gradientOverlay.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientOverlay.addColorStop(0.3, 'rgba(0, 0, 0, 0.5)');
    gradientOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradientOverlay;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(siteName, 60, 60);
    
    // 从URL提取网站域名
    let siteDomain = siteName;
    try {
        const urlObj = new URL(url);
        siteDomain = urlObj.hostname.replace(/^www\./, '');
    } catch (error) {
        // 如果URL解析失败，使用siteName
        console.warn('无法从URL提取域名，使用siteName:', error);
    }
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    // 根据域名长度动态调整矩形宽度
    const domainTextWidth = ctx.measureText(siteDomain).width;
    const rectWidth = Math.max(120, domainTextWidth + 40);
    const rectX = width - rectWidth - 60;
    drawRoundedRect(ctx, rectX, 55, rectWidth, 50, 25);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(siteDomain, width - rectWidth / 2 - 60, 80);
    
    const titleY = height * 0.6;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const maxTitleWidth = width - 120;
    const titleLines = wrapText(ctx, title, maxTitleWidth, 72);
    const titleHeight = titleLines.length * 90;
    
    titleLines.forEach((line, index) => {
        ctx.fillText(line, 60, titleY + index * 90);
    });
    
    if (description) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '36px sans-serif';
        const descY = titleY + titleHeight + 30;
        const descLines = wrapText(ctx, description, maxTitleWidth, 36);
        
        descLines.slice(0, 2).forEach((line, index) => {
            ctx.fillText(line, 60, descY + index * 48);
        });
    }
    
    const bottomY = height - 80;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(95, bottomY - 15, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = author.charAt(0).toUpperCase();
    ctx.fillText(initial, 95, bottomY - 15);
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(author, 160, bottomY - 30);
    
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(date, 160, bottomY + 5);
    
    try {
        const { drawQRCode } = await import('./qrcode-adapter.js');
        const qrSize = 140;
        const qrX = width - qrSize - 60;
        const qrY = bottomY - qrSize - 15;
        
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
        ctx.fill();
        
        await drawQRCode(ctx, qrX, qrY, qrSize, url, '#000000', '#ffffff');
    } catch (error) {
        console.error('二维码生成失败:', error);
    }
    
    return canvas.toDataURL('image/png');
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawCoverImage(ctx, img, width, height) {
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = img.width * (height / img.height);
        offsetX = (width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = width;
        drawHeight = img.height * (width / img.width);
        offsetX = 0;
        offsetY = (height - drawHeight) / 2;
    }
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function drawGradientBackground(ctx, width, height, primaryColor) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, primaryColor);
    gradient.addColorStop(1, shadeColor(primaryColor, -30));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
}

function shadeColor(color, percent) {
    if (!color.startsWith('#')) return color;
    let num = parseInt(color.slice(1), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    R = Math.max(Math.min(255, R), 0);
    G = Math.max(Math.min(255, G), 0);
    B = Math.max(Math.min(255, B), 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function wrapText(ctx, text, maxWidth, fontSize) {
    const chars = text.split('');
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = char;
        } else {
            currentLine = testLine;
        }
    }
    lines.push(currentLine);
    return lines;
}

function simplifyColor(color, defaultColor) {
    if (!color) return defaultColor;
    if (color.includes('var(') || color.includes('oklch(')) {
        return defaultColor;
    }
    if (color.startsWith('#')) {
        const hex = color.slice(1);
        if (/^[0-9A-Fa-f]{3}$/.test(hex) || /^[0-9A-Fa-f]{6}$/.test(hex)) {
            return color;
        }
    }
    if (color.startsWith('rgb')) {
        return color;
    }
    return defaultColor;
}

export function downloadPoster(dataUrl, filename = 'blog-poster') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function sharePoster(dataUrl, title, text) {
    if (navigator.share && navigator.canShare) {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], 'poster.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: title,
                    text: text
                });
                return true;
            }
        } catch (error) {
            console.error('分享失败:', error);
        }
    }
    return false;
}
