/**
 * mas4u Client Portal - Final Production Engine
 * Includes Full UI Rendering, State Management & CRM Sync Simulation
 */

const App = {
    // 1. נתונים בסיסיים
    state: {
        user: { name: "אורח יקר", id: "8842" },
        files: [], // הקבצים של המשתמש
        isSyncing: false
    },

    // 2. אתחול המערכת בטעינת הדף
    init() {
        this.loadDraft();
        this.render();
        console.log("System Ready & Loaded");
    },

    // 3. טיפול בהעלאת קבצים / צילום מהמצלמה
    async handleUpload(fileList) {
        // רטט קל בסמארטפון לתחושת תגובתיות
        if (window.navigator.vibrate) window.navigator.vibrate(15);
        
        for (let file of fileList) {
            const fileId = 'file_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            
            // יצירת הקובץ במצב "טעינה"
            const newFile = {
                id: fileId,
                name: file.name || "מסמך מצולם",
                status: 'processing', 
                amount: '',
                category: '',
                preview: null
            };

            this.state.files.push(newFile);
            this.render(); // ציור מיידי על המסך

            // כיווץ התמונה מאחורי הקלעים לחיסכון במקום ומהירות
            this.compressImage(file, (compressedData) => {
                const index = this.state.files.findIndex(f => f.id === fileId);
                if (index !== -1) {
                    this.state.files[index].preview = compressedData;
                    this.state.files[index].status = 'ready';
                    this.saveDraft();
                    this.render();
                }
            });
        }
    },

    // 4. עדכון פרטי מסמך (סכום / קטגוריה)
    updateFile(id, field, value) {
        const file = this.state.files.find(f => f.id === id);
        if (file) {
            file[field] = value;
            this.saveDraft();
            this.render();
        }
    },

    // מחיקת מסמך
    deleteFile(id) {
        if(confirm("למחוק מסמך זה?")) {
            this.state.files = this.state.files.filter(f => f.id !== id);
            this.saveDraft();
            this.render();
        }
    },

    // פונקציית כיווץ תמונות (שומר על חבילת הגלישה של הלקוח)
    compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // מוקטן למהירות שיא
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                callback(canvas.toDataURL('image/jpeg', 0.6));
            };
        };
    },

    // 5. שליחה ל-CRM
    async submitToCRM() {
        // בודק אם כל הקבצים מולאו כראוי
        const validFiles = this.state.files.filter(f => f.amount > 0 && f.category !== '');
        
        if (validFiles.length === 0 || validFiles.length !== this.state.files.length) {
            alert("שים לב: יש למלא סכום וקטגוריה עבור כל המסמכים לפני השליחה.");
            return;
        }

        this.state.isSyncing = true;
        this.render();

        try {
            // דימוי של שרת שעובד (2 שניות)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.state.files = []; // ריקון הרשימה אחרי הצלחה
            this.saveDraft();
            
            // יצירת קונפטי או הודעת הצלחה יפה (כרגע Alert)
            alert("המסמכים הועלו בהצלחה ונקלטו במשרד!");
        } catch (err) {
            alert("תקלה ברשת. הנתונים שמורים, נסה שוב מאוחר יותר.");
        } finally {
            this.state.isSyncing = false;
            this.render();
        }
    },

    // 6. שמירה לזיכרון הדפדפן (למקרה שהאפליקציה נסגרת בטעות)
    saveDraft() {
        try {
            localStorage.setItem('mas4u_draft', JSON.stringify(this.state.files));
        } catch (e) {
            console.warn("Storage full, unable to save draft.");
        }
    },

    loadDraft() {
        const draft = localStorage.getItem('mas4u_draft');
        if (draft) this.state.files = JSON.parse(draft);
    },

    // 7. המנוע הויזואלי - מצייר את הממשק מחדש אחרי כל שינוי
    render() {
        const container = document.getElementById('file-list-container');
        const stickyBar = document.getElementById('sticky-bar');
        const submitBtn = document.querySelector('.submit-btn');

        if (!container) return;

        // ציור הקבצים
        container.innerHTML = ''; 
        const categories = ['הכנסה', 'הוצאה', 'קופה קטנה'];

        this.state.files.forEach(file => {
            const isProc = file.status === 'processing';
            
            // בניית הקטגוריות
            const catsHtml = categories.map(cat => 
                `<div class="cpill ${file.category === cat ? 'sel' : ''}" 
                      onclick="${!isProc ? `App.updateFile('${file.id}', 'category', '${cat}')` : ''}">
                    ${cat}
                </div>`
            ).join('');

            // יצירת הכרטיסייה
            const card = document.createElement('div');
            card.className = `file-card ${isProc ? 'processing' : ''}`;
            
            card.innerHTML = `
                <button class="del-btn" onclick="App.deleteFile('${file.id}')" ${isProc ? 'style="display:none"' : ''}>✕</button>
                <div class="fthumb">
                    ${file.preview ? `<img src="${file.preview}" alt="doc">` : ''}
                </div>
                <div class="fbody">
                    <div class="fname">${file.name}</div>
                    <div class="amt-row">
                        <span style="font-weight:900; color:var(--muted)">₪</span>
                        <input type="number" placeholder="0.00" value="${file.amount}" 
                               oninput="App.updateFile('${file.id}', 'amount', this.value)"
                               ${isProc ? 'disabled' : ''}>
                    </div>
                    <div class="cat-pills">
                        ${catsHtml}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // שליטה על בר השליחה התחתון (מופיע רק כשיש קבצים)
        if (stickyBar) {
            if (this.state.files.length > 0) {
                stickyBar.classList.add('show');
            } else {
                stickyBar.classList.remove('show');
            }
        }

        // שינוי כפתור בזמן שליחה
        if (submitBtn) {
            if (this.state.isSyncing) {
                submitBtn.classList.add('loading');
                submitBtn.innerText = "מעביר נתונים למשרד...";
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.innerText = "שלח מסמכים למשרד";
            }
        }
    }
};

// הפעלת האפליקציה בטעינת הדף
document.addEventListener('DOMContentLoaded', () => App.init());
