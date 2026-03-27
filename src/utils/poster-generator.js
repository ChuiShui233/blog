/**
 * 生成博客文章分享海报
 * @param {Object} options 海报选项
 * @param {string} options.title 文章标题
 * @param {string} options.author 作者名称
 * @param {string} options.date 发布日期
 * @param {string} options.siteName 网站名称
 * @param {string} options.url 文章URL
 * @param {string} options.primaryColor 主色（十六进制）
 * @param {string} options.backgroundColor 背景色（十六进制）
 * @returns {Promise<string>} 返回图片Data URL
 */
export async function generatePoster({
    title,
    author,
    date,
    siteName,
    url,
    primaryColor = '#6366f1',
    backgroundColor = '#ffffff'
}) {
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 海报尺寸：1080x1350 (Instagram分享尺寸)
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    
    // 绘制背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制渐变背景装饰
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, `${primaryColor}20`); // 20%透明度
    gradient.addColorStop(1, `${primaryColor}05`); // 5%透明度
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 绘制顶部装饰元素
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(width / 2, -200, 400, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制网站名称
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(siteName, width / 2, 80);
    
    // 绘制标题
    ctx.fillStyle = '#1f2937'; // 深灰色
    ctx.font = 'bold 64px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    
    // 标题换行处理
    const maxTitleWidth = width - 160; // 左右留白
    const titleLines = wrapText(ctx, title, maxTitleWidth, 64);
    const titleHeight = titleLines.length * 80;
    const titleY = 300;
    
    titleLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, titleY + index * 80);
    });
    
    // 绘制分隔线
    ctx.strokeStyle = `${primaryColor}80`; // 50%透明度
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, titleY + titleHeight + 60);
    ctx.lineTo(width - 120, titleY + titleHeight + 60);
    ctx.stroke();
    
    // 绘制作者信息
    ctx.fillStyle = '#6b7280'; // 中灰色
    ctx.font = '36px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`作者：${author}`, width / 2, titleY + titleHeight + 140);
    
    // 绘制发布日期
    ctx.fillText(`发布于：${date}`, width / 2, titleY + titleHeight + 200);
    
    // 绘制URL
    ctx.fillStyle = primaryColor;
    ctx.font = '32px "Roboto Mono", monospace';
    ctx.fillText(url.replace(/^https?:\/\//, ''), width / 2, titleY + titleHeight + 280);
    
    // 绘制底部装饰
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.arc(width / 2, height + 200, 400, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制提示文字
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px "Roboto", sans-serif';
    ctx.fillText('扫描二维码阅读全文', width / 2, height + 50);
    
    // 生成二维码占位（实际使用需要二维码库）
    ctx.fillStyle = '#000000';
    ctx.fillRect(width / 2 - 100, height - 300, 200, 200);
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px "Roboto", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('二维码', width / 2, height - 380);
    
    // 返回Data URL
    return canvas.toDataURL('image/png');
}

/**
 * 文本换行辅助函数
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {string} text 文本内容
 * @param {number} maxWidth 最大宽度
 * @param {number} fontSize 字体大小
 * @returns {string[]} 换行后的文本数组
 */
function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    
    // 如果行数过多，截断并添加省略号
    if (lines.length > 4) {
        const truncated = lines.slice(0, 4);
        truncated[3] = truncated[3].slice(0, -3) + '...';
        return truncated;
    }
    
    return lines;
}

/**
 * 下载海报图片
 * @param {string} dataUrl 图片Data URL
 * @param {string} filename 文件名（不含扩展名）
 */
export function downloadPoster(dataUrl, filename = 'blog-poster') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 分享到社交媒体（如果支持Web Share API）
 * @param {string} dataUrl 图片Data URL
 * @param {string} title 分享标题
 * @param {string} text 分享文本
 */
export async function sharePoster(dataUrl, title, text) {
    if (navigator.share && navigator.canShare) {
        try {
            // 将Data URL转换为Blob
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