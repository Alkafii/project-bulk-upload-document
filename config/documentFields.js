export const REQUIRED_DOCUMENTS = [
          "Form_Pendaftaran_API", "Memo_Bisnis", "BRD", "Form_Deployment", "Outline_SIT", "BA_UAT", "Memo_IT",
          "Surat_Permohonan_Verifikasi", "Surat_Kebenaran", "Surat_Kesesuaian", "Matriks_Penjelasan_SOP", "SOP_Penyedia",
          "24 - API Virtual Account - Inquiry - Positif", "24 - API Virtual Account - Inquiry - Negatif",
          "25 - API Virtual Account - Payment - Positif", "25 - API Virtual Account - Payment - Negatif",
          "26 - API Virtual Account - Inquiry Status - Positif", "26 - API Virtual Account - Inquiry Status - Negatif",
          "27 - API Virtual Account - Create VA - Positif", "27 - API Virtual Account - Create VA - Negatif",
          "30 - API Virtual Account - Inquiry VA - Positif", "30 - API Virtual Account - Inquiry VA - Negatif",
          "28 - API Virtual Account - Update VA - Positif", "28 - API Virtual Account - Update VA - Negatif",
          "25 - API Virtual Account - Payment VA - Positif", "25 - API Virtual Account - Payment VA - Negatif",
          "47 - API Generate QR MPM - Positif", "47 - API Generate QR MPM - Negatif", "51 - API Query Payment - Positif",
          "51 - API Query Payment - Negatif", "52 - API Payment Notification - Positif", "52 - API Payment Notification - Negatif",
          "BA_Uji_Fungsi", "Hasil_Uji_Fungsi"
        ];

export const UPLOAD_FIELDS = REQUIRED_DOCUMENTS.map( (name) => ({
    name, maxCount: 1
}));