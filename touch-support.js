// Mobile Touch Support for Drag & Drop Games
// 加呢個 script 去每個遊戲既 </body> 前，等手機用到

(function() {
    // 檢查係咪 mobile/tablet
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) return; // Desktop 唔洗
    
    // Wait for DOM
    if.readyState === ' (documentloading') {
        document.addEventListener('DOMContentLoaded', initTouchSupport);
    } else {
        initTouchSupport();
    }
    
    function initTouchSupport() {
        // Add tap-to-drag functionality
        enableTapDrag();
        
        // Add visual hint for mobile users
        addMobileHint();
    }
    
    function enableTapDrag() {
        // 將所有 draggable 元素變成可以 tap
        const draggables = document.querySelectorAll('[draggable="true"], .draggable, .word-card, .word-item');
        
        draggables.forEach(el => {
            el.style.cursor = 'pointer';
            
            // Touch start - select element
            el.addEventListener('touchstart', function(e) {
                e.preventDefault();
                this.classList.add('selected');
                
                // Store initial position
                this.dataset.touchStartTime = Date.now();
            }, { passive: false });
            
            // Touch end - drop to target
            el.addEventListener('touchend', function(e) {
                e.preventDefault();
                this.classList.remove('selected');
                
                const touch = e.changedTouches[0];
                
                // Find element at drop position
                const droppedElement = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (droppedElement) {
                    // Check if it's a valid drop zone
                    const dropZone = droppedElement.closest('.drop-zone, .target, [data-drop="true"]');
                    
                    if (dropZone) {
                        // Simulate drop event
                        const dropEvent = new CustomEvent('touchdrop', {
                            bubbles: true,
                            detail: { 
                                draggedElement: this,
                                dropZone: dropZone 
                            }
                        });
                        dropZone.dispatchEvent(dropEvent);
                        
                        // Also try to trigger standard drop
                        try {
                            dropZone.dispatchEvent(new Event('drop', { bubbles: true }));
                        } catch(e) {}
                    }
                }
            }, { passive: false });
        });
        
        // Add drop zone highlighting during drag
        document.addEventListener('touchmove', function(e) {
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            
            // Remove old highlights
            document.querySelectorAll('.drop-zone, .target').forEach(z => z.style.outline = '');
            
            if (element) {
                const dropZone = element.closest('.drop-zone, .target, [data-drop="true"]');
                if (dropZone) {
                    dropZone.style.outline = '3px dashed #4A90E2';
                    dropZone.style.background = 'rgba(74, 144, 226, 0.2)';
                }
            }
        }, { passive: true });
    }
    
    function addMobileHint() {
        // Add a hint for mobile users
        const hint = document.createElement('div');
        hint.id = 'mobile-hint';
        hint.innerHTML = '📱 手機用戶：tap 選擇，然後 tap 目標位置';
        hint.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 9999;
            animation: fadeOut 5s forwards;
            pointer-events: none;
        `;
        document.body.appendChild(hint);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeOut {
                0%, 70% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Remove hint after animation
        setTimeout(() => hint.remove(), 5000);
    }
})();
