/**
 * QR Code 适配器
 * 将全局 QRCode 库包装为 ES 模块
 */

// 加载 QRCode 库
async function loadQRCodeLibrary() {
    if (typeof QRCode !== 'undefined') {
        return QRCode;
    }
    
    return new Promise((resolve, reject) => {
        // 检查是否已经在加载中
        if (window._qrcodeLoading) {
            const checkInterval = setInterval(() => {
                if (typeof QRCode !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve(QRCode);
                }
            }, 100);
            
            // 设置超时
            setTimeout(() => {
                clearInterval(checkInterval);
                if (typeof QRCode !== 'undefined') {
                    resolve(QRCode);
                } else {
                    reject(new Error('QRCode library loading timeout'));
                }
            }, 5000);
            
            return;
        }
        
        window._qrcodeLoading = true;
        
        // 创建 script 标签加载 QRCode 库
        const script = document.createElement('script');
        script.src = '/utils/qrcode.js';
        script.onload = () => {
            window._qrcodeLoading = false;
            if (typeof QRCode !== 'undefined') {
                resolve(QRCode);
            } else {
                reject(new Error('QRCode library loaded but not defined'));
            }
        };
        script.onerror = (error) => {
            window._qrcodeLoading = false;
            reject(new Error('Failed to load QRCode library: ' + error));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * 在Canvas上绘制二维码
 * @param {CanvasRenderingContext2D} ctx Canvas上下文
 * @param {number} x 起始X坐标
 * @param {number} y 起始Y坐标
 * @param {number} size 二维码尺寸
 * @param {string} text 要编码的文本
 * @param {string} darkColor 深色模块颜色
 * @param {string} lightColor 浅色模块颜色
 */
export async function drawQRCode(ctx, x, y, size, text, darkColor = '#000000', lightColor = '#ffffff') {
    try {
        // 加载 QRCode 库
        const QRCode = await loadQRCodeLibrary();
        
        // 创建临时容器
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '0';
        container.style.top = '0';
        container.style.width = size + 'px';
        container.style.height = size + 'px';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
        
        return new Promise((resolve, reject) => {
            try {
                // 使用 QRCode 库
                const qrcode = new QRCode(container, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: darkColor,
                    colorLight: lightColor,
                    correctLevel: QRCode.CorrectLevel.M
                });
                
                // QRCode 库是同步的，所以不需要等待
                // 查找 canvas 元素
                const canvas = container.querySelector('canvas');
                if (canvas) {
                    // 将二维码绘制到目标 canvas
                    ctx.drawImage(canvas, x, y, size, size);
                    
                    // 清理
                    document.body.removeChild(container);
                    resolve(true);
                } else {
                    // 如果没有 canvas，尝试等待一下
                    setTimeout(() => {
                        const canvas = container.querySelector('canvas');
                        if (canvas) {
                            ctx.drawImage(canvas, x, y, size, size);
                            document.body.removeChild(container);
                            resolve(true);
                        } else {
                            throw new Error('QRCode canvas not found');
                        }
                    }, 100);
                }
            } catch (error) {
                // 清理
                if (container.parentNode) {
                    document.body.removeChild(container);
                }
                reject(error);
            }
        });
    } catch (error) {
        console.error('二维码生成失败:', error);
        
        // 绘制占位符
        ctx.fillStyle = lightColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = darkColor;
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', x + size / 2, y + size / 2);
        
        throw error;
    }
}

/**
 * 生成二维码矩阵
 * @param {string} text 要编码的文本
 * @param {number} typeNumber 二维码类型 (1-40)
 * @param {string} errorCorrectionLevel 纠错级别 ('L', 'M', 'Q', 'H')
 * @returns {number[][]} QR Code矩阵 (0=白, 1=黑)
 */
export async function generateQRMatrix(text, typeNumber = 4, errorCorrectionLevel = 'M') {
    const QRCode = await loadQRCodeLibrary();
    
    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '1px';
    container.style.height = '1px';
    container.style.opacity = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    
    try {
        // 创建 QRCode 实例
        const qrcode = new QRCode(container, {
            text: text,
            width: 1,
            height: 1,
            correctLevel: QRCode.CorrectLevel.M
        });
        
        // 获取 QRCode 模型
        const qrCodeModel = qrcode._oQRCode;
        const moduleCount = qrCodeModel.getModuleCount();
        const matrix = [];
        
        for (let row = 0; row < moduleCount; row++) {
            matrix[row] = [];
            for (let col = 0; col < moduleCount; col++) {
                matrix[row][col] = qrCodeModel.isDark(row, col) ? 1 : 0;
            }
        }
        
        return matrix;
    } finally {
        if (container.parentNode) {
            document.body.removeChild(container);
        }
    }
}

/**
 * 生成二维码图片的Data URL
 * @param {string} text 要编码的文本
 * @param {number} size 图片尺寸
 * @param {string} darkColor 深色模块颜色
 * @param {string} lightColor 浅色模块颜色
 * @returns {Promise<string>} Data URL
 */
export async function generateQRCodeDataURL(text, size = 200, darkColor = '#000000', lightColor = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    await drawQRCode(ctx, 0, 0, size, text, darkColor, lightColor);
    
    return canvas.toDataURL('image/png');
}