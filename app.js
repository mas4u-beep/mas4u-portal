/**
 * mas4u Client Portal - Engine v7.0
 * Optimized for Speed & Future CRM Integration
 */

const App = {
    // 1. נתונים בסיסיים (State)
    state: {
        user: { name: "משתמש בדיקה", id: "12345" },
        activeMonth: new Date().getMonth() + 1,
        files: [], // קבצים שממתינים לשליחה
        isSyncing: false
    },

    // 2. אתחול המערכת
    init() {
        this.loadDraft();
        this.render();
        console.log("System Initialized");
        
        // האזנה לכפתור השליחה הראשי
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitToCRM());
        }
    },

    // 3. ניהול קבצים והעלאה מהירה (חוויית משתמש)
    async handleUpload(fileList) {
        // רטט קטן בנייד לתחושת לחיצה
        if (window.navigator.vibrate) window.navigator.vibrate(10);
        
        for (let file of fileList) {
            const fileId = Date.now() + Math.random();
            
            // יצירת אובייקט זמני להצגה מיידית
            const newFile = {
                id: fileId,
                name: file.name,
                status: 'processing', 
                amount: '',
                category: '',
                preview: null
            };

            this.state.files.push(newFile);
            this.render(); 

            // עיבוד התמונה (כיווץ) ברקע
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

    // פונקציית עזר לכיווץ תמונה
    compressImage(file, callback) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200;
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
                
                // החזרת התמונה המכווצת בפורמט Base64
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    },

    // 4. וולידציה (בדיקה שהכל מולא)
    validateFile(id) {
        const file = this.state.files.find(f => f.id === id);
        return file && file.amount > 0 && file.category !== '';
    },

    // 5. סימולציית CRM (הכנה לעתיד)
    async submitToCRM() {
        const readyFiles = this.state.files.filter(f => f.amount > 0 && f.category !== '');
        
        if (readyFiles.length === 0) {
            alert("נא למלא סכום וקטגוריה לפחות למסמך אחד");
            return;
        }

        this.state.isSyncing = true;
        this.render();

        // דימוי קריאת שרת (API)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // הסרת הקבצים שנשלחו מהרשימה
            this.state.files = this.state.files.filter(f => !readyFiles.includes(f));
            this.saveDraft();
            alert("המסמכים נשלחו בהצלחה למשרד!");
        } catch (err) {
            alert("שגיאה בסנכרון. הנתונים נשמרו בטיוטה.");
        } finally {
            this.state.isSyncing = false;
            this.render();
        }
    },

    // 6. ניהול טיוטה (LocalStorage)
    saveDraft() {
        try {
            localStorage.setItem('mas4u_draft', JSON.stringify(this.state.files));
        } catch (e) {
            console.error("Storage full");
        }
    },

    loadDraft() {
        const draft = localStorage.getItem('mas4u_draft');
        if (draft) this.state.files = JSON.parse(draft);
    },

    // 7. עדכון ה-UI
    render() {
        const container = document.getElementById('app-root');
        if (!container) return;

        // כאן תבוא הפונקציה שבונה את ה-HTML של כרטיסיות הקבצים
        // (בשלב הבא נוכל להכניס כאן את ה-Template המלא)
        console.log("Current Files:", this.state.files);
        
        // עדכון סטטוס כפתור השליחה
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            if (this.state.isSyncing) {
                submitBtn.classList.add('loading');
                submitBtn.innerText = "שולח ל-CRM...";
            } else {
                submitBtn.classList.remove('loading');
                submitBtn.innerText = "שלח מסמכים למשרד";
            }
        }
    }
};

// הפעלת האפליקציה בטעינה
document.addEventListener('DOMContentLoaded', () => App.init());
