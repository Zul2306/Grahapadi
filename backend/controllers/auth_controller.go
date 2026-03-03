package controllers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"time"

	"warehouse/backend/config"
	"warehouse/backend/middleware"
	"warehouse/backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	NamaLengkap string `json:"nama_lengkap" binding:"required,min=2"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=6"`
	Role        string `json:"role"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

func generateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func sendResetPasswordEmail(toEmail, resetLink string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost == "" {
		smtpHost = os.Getenv("MAIL_HOST")
	}
	if smtpPort == "" {
		smtpPort = os.Getenv("MAIL_PORT")
	}
	if smtpUser == "" {
		smtpUser = os.Getenv("MAIL_USERNAME")
	}
	if smtpPass == "" {
		smtpPass = os.Getenv("MAIL_PASSWORD")
	}
	if smtpFrom == "" {
		smtpFrom = os.Getenv("MAIL_FROM_ADDRESS")
	}

	if smtpHost == "" || smtpPort == "" || smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP belum dikonfigurasi. Isi SMTP_* atau MAIL_* variables")
	}
	if smtpFrom == "" {
		smtpFrom = smtpUser
	}

	subject := "🔐 Reset Password - Integrated Inventory System"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Password</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @media only screen and (max-width: 600px) {
            .container { width: 100%% !important; }
            .content { padding: 20px !important; }
            .header { padding: 30px 20px !important; }
            .logo-icon { width: 70px !important; height: 70px !important; }
            .main-title { font-size: 28px !important; }
            .section-title { font-size: 20px !important; }
            .cta-button { padding: 14px 30px !important; font-size: 15px !important; }
            .info-box { padding: 16px !important; }
            .footer { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9;">
    <!-- Wrapper with Background Pattern -->
    <table width="100%%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #3b82f6 0%%, #8b5cf6 50%%, #ec4899 100%%); padding: 40px 10px;">
        <tr>
            <td align="center">
                <!-- Main Container with Shadow -->
                <table class="container" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;">
                    
                    <!-- Decorative Top Bar -->
                    <tr>
                        <td style="height: 6px; background: linear-gradient(90deg, #3b82f6 0%%, #8b5cf6 50%%, #ec4899 100%%);"></td>
                    </tr>
                    
                    <!-- Header with Icon -->
                    <tr>
                        <td class="header" style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(180deg, #f8fafc 0%%, #ffffff 100%%);">
                            <!-- Lock Icon with Glow -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
                                <tr>
                                    <td style="position: relative;">
                                        <div class="logo-icon" style="width: 100px; height: 100px; background: linear-gradient(135deg, #3b82f6 0%%, #2563eb 100%%); border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4), 0 0 0 8px rgba(59, 130, 246, 0.1);">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <h1 class="main-title" style="margin: 0 0 12px; color: #0f172a; font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.2;">
                                Reset Password
                            </h1>
                            <p style="margin: 0; color: #64748b; font-size: 17px; font-weight: 500;">
                                Integrated Inventory System
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td class="content" style="padding: 20px 40px 40px;">
                            <!-- Greeting with Emoji -->
                            <div style="background: linear-gradient(135deg, #eff6ff 0%%, #dbeafe 100%%); border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 1px solid #bfdbfe;">
                                <h2 class="section-title" style="margin: 0 0 12px; color: #1e40af; font-size: 22px; font-weight: 700;">
                                    👋 Halo!
                                </h2>
                                <p style="margin: 0; color: #1e3a8a; font-size: 15px; line-height: 1.6;">
                                    Kami menerima permintaan untuk <strong style="color: #1e40af;">reset password</strong> akun Anda. Untuk keamanan akun, silakan konfirmasi dengan mengklik tombol di bawah ini.
                                </p>
                            </div>
                            
                            <!-- CTA Button with Gradient -->
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #3b82f6 0%%, #2563eb 100%%); border-radius: 14px; box-shadow: 0 10px 40px rgba(59, 130, 246, 0.35);">
                                                    <a class="cta-button" href="%s" style="display: block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 700; letter-spacing: 0.3px;">
                                                        <table cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td style="padding-right: 12px; font-size: 22px; line-height: 0;">🔐</td>
                                                                <td style="color: #ffffff; white-space: nowrap;">Buat Password Baru</td>
                                                                <td style="padding-left: 12px; font-size: 18px; line-height: 0;">→</td>
                                                            </tr>
                                                        </table>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Timer Warning Box -->
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td class="info-box" style="background: linear-gradient(135deg, #fef3c7 0%%, #fde68a 100%%); border-left: 5px solid #f59e0b; border-radius: 12px; padding: 22px 25px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-right: 15px; font-size: 28px; line-height: 0; vertical-align: middle;">⏰</td>
                                                <td>
                                                    <p style="margin: 0 0 6px; color: #92400e; font-size: 15px; font-weight: 700;">Perhatian: Link Terbatas!</p>
                                                    <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.5;">
                                                        Link ini <strong>hanya berlaku selama 30 menit</strong> untuk menjaga keamanan akun Anda.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 12px; color: #475569; font-size: 14px; font-weight: 600;">
                                    📋 Atau salin link berikut:
                                </p>
                                <p style="margin: 0; padding: 14px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; color: #3b82f6; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace; line-height: 1.6;">
                                    %s
                                </p>
                            </div>
                            
                            <!-- Help Text -->
                            <p style="margin: 25px 0 0; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                Jika tombol tidak berfungsi, salin dan tempel URL di atas ke browser Anda.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Security Notice with Icon -->
                    <tr>
                        <td class="content" style="padding: 30px 40px; background: linear-gradient(180deg, #fef2f2 0%%, #fee2e2 100%%); border-top: 1px solid #fecaca;">
                            <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50" valign="top" style="padding-right: 20px;">
                                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);">
                                            <span style="font-size: 26px; line-height: 0;">🛡️</span>
                                        </div>
                                    </td>
                                    <td>
                                        <p style="margin: 0 0 10px; color: #7f1d1d; font-size: 16px; font-weight: 700;">
                                            ⚠️ Tidak Meminta Reset Password?
                                        </p>
                                        <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                            Jika Anda <strong>tidak melakukan permintaan ini</strong>, abaikan email ini atau segera hubungi tim support. Password Anda tetap aman dan tidak akan berubah.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent 0%%, #e2e8f0 50%%, transparent 100%%);"></td>
                    </tr>
                    
                    <!-- Footer with Branding -->
                    <tr>
                        <td class="footer" style="padding: 40px; text-align: center; background: #0f172a;">
                            <!-- Company Info -->
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
                                <tr>
                                    <td style="padding: 12px 24px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                                            POWERED BY
                                        </p>
                                        <p style="margin: 6px 0 0; color: #60a5fa; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">
                                            Integrated Inventory
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6;">
                                Email otomatis dari sistem manajemen inventori terpadu
                            </p>
                            <p style="margin: 0 0 25px; color: rgba(255,255,255,0.4); font-size: 12px;">
                                © 2026 Integrated Inventory System. All rights reserved.
                            </p>
                            
                            <!-- Support Link -->
                            <div style="padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600;">
                                    💬 Butuh Bantuan?
                                </p>
                                <a href="mailto:support@inventory.com" style="display: inline-block; color: #60a5fa; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; background: rgba(96, 165, 250, 0.1); border-radius: 8px; border: 1px solid rgba(96, 165, 250, 0.2);">
                                    support@inventory.com
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Bottom Spacing -->
                <table width="100%%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                    <tr>
                        <td align="center">
                            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 11px; padding: 0 10px;">
                                Email ini dikirim ke alamat yang terdaftar di sistem kami
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, resetLink, resetLink)

	msg := "MIME-version: 1.0;\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\r\n" +
		"From: " + smtpFrom + "\r\n" +
		"To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	return smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpFrom, []string{toEmail}, []byte(msg))
}

// Login handles user authentication
// POST /api/auth/login
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var user models.User
	result := config.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Invalid email or password",
		})
		return
	}

	token, err := middleware.GenerateToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Login successful",
		"data": gin.H{
			"token":      token,
			"expires_in": 86400, // 24 hours in seconds
			"user": gin.H{
				"id":    user.ID,
				"nama_lengkap": user.NamaLengkap,
				"email": user.Email,
				"role":  user.Role,
			},
		},
	})
}

// Register creates a new user (admin only in production)
// POST /api/auth/register
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Check if email already exists
	var existing models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Email already registered",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to hash password",
		})
		return
	}

	role := "staff"
	if req.Role != "" {
		role = req.Role
	}

	user := models.User{
		NamaLengkap: req.NamaLengkap,
		Email:       req.Email,
		Password:    string(hashedPassword),
		Role:        role,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create user",
			"error":   err.Error(),
		})
		return
	}

	// Verify the user was actually created by reading it back
	var checkUser models.User
	if err := config.DB.Where("email = ?", user.Email).First(&checkUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "User insert returned success but data not found in database",
			"error":   err.Error(),
			"debug": gin.H{
				"inserted_id": user.ID,
				"email":       user.Email,
			},
		})
		return
	}

	// Count total users to verify
	var totalUsers int64
	config.DB.Model(&models.User{}).Count(&totalUsers)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User registered successfully",
		"data": gin.H{
			"id":           checkUser.ID,
			"nama_lengkap": checkUser.NamaLengkap,
			"email":        checkUser.Email,
			"role":         checkUser.Role,
			"created_at":   checkUser.CreatedAt,
		},
		"debug": gin.H{
			"total_users_in_db": totalUsers,
		},
	})
}

// ForgotPassword sends reset password link to user's email
// POST /api/v1/auth/forgot-password
func ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var user models.User
	err := config.DB.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "Jika email terdaftar, link reset password akan dikirim",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to process request",
		})
		return
	}

	token, err := generateResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate reset token",
		})
		return
	}

	resetToken := models.PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(30 * time.Minute),
	}

	if err := config.DB.Create(&resetToken).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to store reset token",
		})
		return
	}

	frontendBaseURL := os.Getenv("FRONTEND_BASE_URL")
	if frontendBaseURL == "" {
		frontendBaseURL = "http://localhost:3000"
	}

	resetLink := fmt.Sprintf("%s/auth/new-input-password?token=%s", frontendBaseURL, token)

	if err := sendResetPasswordEmail(user.Email, resetLink); err != nil {
		log.Printf("Failed to send reset password email to %s: %v", user.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to send reset password email",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Jika email terdaftar, link reset password akan dikirim",
	})
}

// ResetPassword sets new password using reset token
// POST /api/v1/auth/reset-password
func ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var resetToken models.PasswordResetToken
	if err := config.DB.Where("token = ?", req.Token).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Token reset tidak valid",
		})
		return
	}

	if resetToken.UsedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Token reset sudah digunakan",
		})
		return
	}

	if time.Now().After(resetToken.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Token reset sudah kedaluwarsa",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to hash password",
		})
		return
	}

	if err := config.DB.Model(&models.User{}).Where("id = ?", resetToken.UserID).Update("password", string(hashedPassword)).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update password",
		})
		return
	}

	now := time.Now()
	if err := config.DB.Model(&resetToken).Update("used_at", &now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to finalize reset token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password berhasil diperbarui",
	})
}

// GetProfile returns the authenticated user's profile
// GET /api/auth/profile
func GetProfile(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"id":           user.ID,
			"nama_lengkap": user.NamaLengkap,
			"email":        user.Email,
			"role":         user.Role,
			"created_at":   user.CreatedAt,
		},
	})
}

// ChangePassword updates the authenticated user's password
// PUT /api/auth/change-password
func ChangePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Old password is incorrect",
		})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to hash password",
		})
		return
	}

	config.DB.Model(&user).Update("password", string(hashedPassword))

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// GetAllUsers returns all users (admin only)
// GET /api/users
func GetAllUsers(c *gin.Context) {
	var users []models.User
	config.DB.Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    users,
		"total":   len(users),
	})
}

// GetUserByID returns a user by ID
// GET /api/users/:id
func GetUserByID(c *gin.Context) {
	id := c.Param("id")

	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"success": false,
				"message": "User not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to retrieve user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    user,
	})
}

// DeleteUser soft-deletes a user
// DELETE /api/users/:id
func DeleteUser(c *gin.Context) {
	id := c.Param("id")

	// Check if user is currently logged in (prevent self-deletion)
	userID, exists := c.Get("userID")
	if exists && fmt.Sprint(userID) == id {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "Cannot delete your own account",
		})
		return
	}

	// Check if user exists
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	// Try to delete user
	result := config.DB.Delete(&models.User{}, id)
	if result.Error != nil {
		// Check if it's a foreign key constraint error
		if strings.Contains(result.Error.Error(), "violates foreign key constraint") ||
			strings.Contains(result.Error.Error(), "violates not-null constraint") {
			c.JSON(http.StatusConflict, gin.H{
				"success": false,
				"message": "Cannot delete user. User has related records (transactions, stock opname, etc)",
				"error":   "User is referenced in other tables",
			})
			return
		}

		// Other database errors
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete user",
			"error":   result.Error.Error(),
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User deleted successfully",
	})
}
// sendSetupPasswordEmail sends an email to set up password for new user
func sendSetupPasswordEmail(toEmail, namaLengkap, setupLink string) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpFrom := os.Getenv("SMTP_FROM")

	if smtpHost == "" {
		smtpHost = os.Getenv("MAIL_HOST")
	}
	if smtpPort == "" {
		smtpPort = os.Getenv("MAIL_PORT")
	}
	if smtpUser == "" {
		smtpUser = os.Getenv("MAIL_USERNAME")
	}
	if smtpPass == "" {
		smtpPass = os.Getenv("MAIL_PASSWORD")
	}
	if smtpFrom == "" {
		smtpFrom = os.Getenv("MAIL_FROM_ADDRESS")
	}

	if smtpHost == "" || smtpPort == "" || smtpUser == "" || smtpPass == "" {
		return fmt.Errorf("SMTP belum dikonfigurasi. Isi SMTP_* atau MAIL_* variables")
	}
	if smtpFrom == "" {
		smtpFrom = smtpUser
	}

	subject := "🎉 Selamat Datang - Setup Password Akun Anda"
	body := fmt.Sprintf(`
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Setup Password</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        @media only screen and (max-width: 600px) {
            .container { width: 100%% !important; }
            .content { padding: 20px !important; }
            .header { padding: 30px 20px !important; }
            .logo-icon { width: 70px !important; height: 70px !important; }
            .main-title { font-size: 28px !important; }
            .section-title { font-size: 20px !important; }
            .cta-button { padding: 14px 30px !important; font-size: 15px !important; }
            .info-box { padding: 16px !important; }
            .footer { padding: 25px 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9;">
    <table width="100%%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%%, #059669 50%%, #047857 100%%); padding: 40px 10px;">
        <tr>
            <td align="center">
                <table class="container" width="100%%" cellpadding="0" cellspacing="0" style="max-width: 640px; background: #ffffff; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;">
                    
                    <tr>
                        <td style="height: 6px; background: linear-gradient(90deg, #10b981 0%%, #059669 50%%, #047857 100%%);"></td>
                    </tr>
                    
                    <tr>
                        <td class="header" style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(180deg, #f0fdf4 0%%, #ffffff 100%%);">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
                                <tr>
                                    <td>
                                        <div class="logo-icon" style="width: 100px; height: 100px; background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); border-radius: 50%%; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.4), 0 0 0 8px rgba(16, 185, 129, 0.1);">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 12L11 14L15 10M21 12A9 9 0 1 1 3 12A9 9 0 0 1 21 12Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <h1 class="main-title" style="margin: 0 0 12px; color: #0f172a; font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.2;">
                                Selamat Datang!
                            </h1>
                            <p style="margin: 0; color: #64748b; font-size: 17px; font-weight: 500;">
                                Integrated Inventory System
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="content" style="padding: 20px 40px 40px;">
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%%, #dcfce7 100%%); border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 1px solid #bbf7d0;">
                                <h2 class="section-title" style="margin: 0 0 12px; color: #065f46; font-size: 22px; font-weight: 700;">
                                    👋 Halo %s!
                                </h2>
                                <p style="margin: 0; color: #047857; font-size: 15px; line-height: 1.6;">
                                    Anda telah ditambahkan sebagai pengguna di <strong>Integrated Inventory System</strong>. Silakan atur password Anda untuk mulai menggunakan sistem.
                                </p>
                            </div>
                            
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); border-radius: 14px; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.35);">
                                                    <a class="cta-button" href="%s" style="display: block; padding: 18px 50px; color: #ffffff; text-decoration: none; font-size: 17px; font-weight: 700; letter-spacing: 0.3px;">
                                                        <table cellpadding="0" cellspacing="0">
                                                            <tr>
                                                                <td style="padding-right: 12px; font-size: 22px; line-height: 0;">🔐</td>
                                                                <td style="color: #ffffff; white-space: nowrap;">Atur Password</td>
                                                                <td style="padding-left: 12px; font-size: 18px; line-height: 0;">→</td>
                                                            </tr>
                                                        </table>
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td class="info-box" style="background: linear-gradient(135deg, #fef3c7 0%%, #fde68a 100%%); border-left: 5px solid #f59e0b; border-radius: 12px; padding: 22px 25px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);">
                                        <table cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding-right: 15px; font-size: 28px; line-height: 0; vertical-align: middle;">⏰</td>
                                                <td>
                                                    <p style="margin: 0 0 6px; color: #92400e; font-size: 15px; font-weight: 700;">Link Terbatas!</p>
                                                    <p style="margin: 0; color: #b45309; font-size: 14px; line-height: 1.5;">
                                                        Link ini <strong>hanya berlaku selama 24 jam</strong>. Segera atur password Anda.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 12px; color: #475569; font-size: 14px; font-weight: 600;">
                                    📋 Atau salin link berikut:
                                </p>
                                <p style="margin: 0; padding: 14px; background: #ffffff; border: 2px dashed #cbd5e1; border-radius: 8px; color: #10b981; font-size: 11px; word-break: break-all; font-family: 'Courier New', monospace; line-height: 1.6;">
                                    %s
                                </p>
                            </div>
                            
                            <p style="margin: 25px 0 0; text-align: center; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                                Jika tombol tidak berfungsi, salin dan tempel URL di atas ke browser Anda.
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td class="content" style="padding: 30px 40px; background: linear-gradient(180deg, #f0fdf4 0%%, #dcfce7 100%%); border-top: 1px solid #86efac;">
                            <table width="100%%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50" valign="top" style="padding-right: 20px;">
                                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #10b981 0%%, #059669 100%%); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);">
                                            <span style="font-size: 26px; line-height: 0;">ℹ️</span>
                                        </div>
                                    </td>
                                    <td>
                                        <p style="margin: 0 0 10px; color: #065f46; font-size: 16px; font-weight: 700;">
                                            Informasi Penting
                                        </p>
                                        <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
                                            Password tidak dapat direset setelah 24 jam. Jika link sudah kadaluarsa, hubungi admin untuk mendapatkan link baru.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="height: 1px; background: linear-gradient(90deg, transparent 0%%, #e2e8f0 50%%, transparent 100%%);"></td>
                    </tr>
                    
                    <tr>
                        <td class="footer" style="padding: 40px; text-align: center; background: #0f172a;">
                            <table cellpadding="0" cellspacing="0" style="margin: 0 auto 25px;">
                                <tr>
                                    <td style="padding: 12px 24px; background: rgba(255,255,255,0.05); border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
                                        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                                            POWERED BY
                                        </p>
                                        <p style="margin: 6px 0 0; color: #10b981; font-size: 18px; font-weight: 800; letter-spacing: -0.5px;">
                                            Integrated Inventory
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.6;">
                                Email otomatis dari sistem manajemen inventori terpadu
                            </p>
                            <p style="margin: 0 0 25px; color: rgba(255,255,255,0.4); font-size: 12px;">
                                © 2026 Integrated Inventory System. All rights reserved.
                            </p>
                            
                            <div style="padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.1);">
                                <p style="margin: 0 0 8px; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 600;">
                                    💬 Butuh Bantuan?
                                </p>
                                <a href="mailto:support@inventory.com" style="display: inline-block; color: #10b981; text-decoration: none; font-size: 14px; font-weight: 600; padding: 10px 20px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2);">
                                    support@inventory.com
                                </a>
                            </div>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, namaLengkap, setupLink, setupLink)

	msg := "MIME-version: 1.0;\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\r\n" +
		"From: " + smtpFrom + "\r\n" +
		"To: " + toEmail + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body

	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	return smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpFrom, []string{toEmail}, []byte(msg))
}

// CreateUserInvitation creates a new pending user and sends setup password email
// POST /api/auth/create-user-invitation
func CreateUserInvitation(c *gin.Context) {
	type CreateUserRequest struct {
		Nama        string `json:"nama" binding:"required,min=2"`
		NamaLengkap string `json:"nama_lengkap" binding:"required,min=2"`
		Email       string `json:"email" binding:"required,email"`
		Role        string `json:"role"`
	}

	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Check if email already exists
	var existing models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Email already registered",
		})
		return
	}

	// Check if nama already exists
	if err := config.DB.Where("nama = ?", req.Nama).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"success": false,
			"message": "Username already exists",
		})
		return
	}

	// Generate setup token
	token, err := generateResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate token",
		})
		return
	}

	role := "staff"
	if req.Role != "" {
		role = req.Role
	}

	// Create pending user
	user := models.User{
		Nama:          req.Nama,
		NamaLengkap:   req.NamaLengkap,
		Email:         req.Email,
		Role:          role,
		Status:        "pending",
		SetupToken:    token,
		SetupTokenExp: time.Now().Add(24 * time.Hour),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create user",
			"error":   err.Error(),
		})
		return
	}

	// Get frontend base URL
	frontendBaseURL := os.Getenv("FRONTEND_BASE_URL")
	if frontendBaseURL == "" {
		frontendBaseURL = "http://localhost:3000"
	}

	// Generate setup link
	setupLink := fmt.Sprintf("%s/auth/setup-password?token=%s", frontendBaseURL, token)

	// Send email asynchronously in background
	go func(email, nama, link string) {
		if err := sendSetupPasswordEmail(email, nama, link); err != nil {
			log.Printf("Failed to send setup password email to %s: %v", email, err)
		} else {
			log.Printf("Setup password email sent successfully to %s", email)
		}
	}(req.Email, req.NamaLengkap, setupLink)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User invitation sent successfully. Please check your email.",
		"data": gin.H{
			"id":    user.ID,
			"nama":  user.Nama,
			"email": user.Email,
			"status": user.Status,
		},
	})
}

// SetupPassword sets password for a pending user using setup token
// POST /api/auth/setup-password
func SetupPassword(c *gin.Context) {
	type SetupPasswordRequest struct {
		Token    string `json:"token" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
	}

	var req SetupPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	// Find user by setup token
	var user models.User
	result := config.DB.Where("setup_token = ?", req.Token).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Invalid or expired token",
		})
		return
	}

	// Check if token has expired
	if time.Now().After(user.SetupTokenExp) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Token has expired",
		})
		return
	}

	// Check if user is already active
	if user.Status == "active" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "User already active",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to hash password",
		})
		return
	}

	// Update user: set password, status to active, clear setup token
	if err := config.DB.Model(&user).Updates(map[string]interface{}{
		"password":         string(hashedPassword),
		"status":           "active",
		"setup_token":      "",
		"setup_token_exp":  nil,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update user",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password setup successful. Please login to continue.",
	})
}