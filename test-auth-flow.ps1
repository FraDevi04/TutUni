#!/usr/bin/env pwsh

# TutUni AI - Authentication Flow Testing Script
# This script tests the complete authentication flow with sessions

Write-Host "TutUni AI - Authentication Flow Test" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FRONTEND_URL = "http://localhost:3000"
$BACKEND_URL = "http://localhost:8000"
$TEST_USER_EMAIL = "auth-flow-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_USER_PASSWORD = "AuthFlowTest123"
$TEST_USER_NAME = "Auth Flow Test User"

function Write-Success { param($message) Write-Host "[PASS] $message" -ForegroundColor Green }
function Write-Error { param($message) Write-Host "[FAIL] $message" -ForegroundColor Red }
function Write-Info { param($message) Write-Host "[INFO] $message" -ForegroundColor Blue }
function Write-Test { param($message) Write-Host "[TEST] $message" -ForegroundColor Magenta }

# Function to make authenticated requests with session
function Invoke-AuthenticatedRequest {
    param(
        [string]$url,
        [string]$method = "GET",
        [Microsoft.PowerShell.Commands.WebRequestSession]$session,
        [string]$body = "",
        [hashtable]$headers = @{}
    )
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            WebSession = $session
            UseBasicParsing = $true
            TimeoutSec = 15
        }
        
        if ($headers.Count -gt 0) { $params.Headers = $headers }
        if ($body -ne "") { 
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        return @{ Success = $true; Response = $response; StatusCode = $response.StatusCode }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $_.Exception.Response.StatusCode.value__ }
    }
}

Write-Test "Step 1: Testing initial session state (should be unauthenticated)"
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

try {
    $sessionCheck = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/api/auth/session" -session $session
    if ($sessionCheck.StatusCode -eq 401) {
        Write-Success "Initial session check: Unauthenticated as expected"
    } else {
        Write-Error "Initial session check: Expected 401, got $($sessionCheck.StatusCode)"
    }
} catch {
    Write-Error "Initial session check failed: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 2: User Registration"
$registrationData = @{
    name = $TEST_USER_NAME
    email = $TEST_USER_EMAIL
    password = $TEST_USER_PASSWORD
} | ConvertTo-Json

try {
    $registerResult = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/api/auth/register" -method "POST" -body $registrationData -session $session
    if ($registerResult.Success) {
        Write-Success "User registration successful"
    } else {
        Write-Error "User registration failed: $($registerResult.Error)"
    }
} catch {
    Write-Error "Registration request failed: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 3: User Login via NextAuth"
# First, get the login page to extract any CSRF tokens
try {
    $loginPageResult = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/login" -session $session
    if ($loginPageResult.Success) {
        Write-Success "Login page accessible"
    } else {
        Write-Error "Login page not accessible: $($loginPageResult.Error)"
    }
} catch {
    Write-Error "Login page check failed: $($_.Exception.Message)"
}

# Test NextAuth signin endpoint
Write-Test "Step 4: Testing NextAuth signin endpoint"
try {
    $nextAuthSignin = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/api/auth/signin" -session $session
    if ($nextAuthSignin.Success) {
        Write-Success "NextAuth signin endpoint accessible"
    } else {
        Write-Info "NextAuth signin endpoint status: $($nextAuthSignin.StatusCode)"
    }
} catch {
    Write-Info "NextAuth signin endpoint check: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 5: Direct Backend Authentication"
$loginData = @{
    email = $TEST_USER_EMAIL
    password = $TEST_USER_PASSWORD
} | ConvertTo-Json

try {
    $backendLogin = Invoke-WebRequest -Uri "$BACKEND_URL/auth/login" -Method "POST" -Body $loginData -ContentType "application/json" -UseBasicParsing
    if ($backendLogin.StatusCode -eq 200) {
        $authResponse = $backendLogin.Content | ConvertFrom-Json
        Write-Success "Backend authentication successful"
        Write-Info "Access token received: $($authResponse.access_token.Substring(0, 20))..."
        
        # Test authenticated backend endpoint
        $authHeaders = @{ "Authorization" = "Bearer $($authResponse.access_token)" }
        $userProfile = Invoke-WebRequest -Uri "$BACKEND_URL/auth/me" -Headers $authHeaders -UseBasicParsing
        if ($userProfile.StatusCode -eq 200) {
            $profile = $userProfile.Content | ConvertFrom-Json
            Write-Success "User profile retrieved: $($profile.name) ($($profile.email))"
        } else {
            Write-Error "Failed to retrieve user profile"
        }
    } else {
        Write-Error "Backend authentication failed: $($backendLogin.StatusCode)"
    }
} catch {
    Write-Error "Backend authentication error: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 6: Testing Frontend Authentication Status"
# Check if we can access the session endpoint after backend login
try {
    $sessionAfterLogin = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/api/auth/session" -session $session
    if ($sessionAfterLogin.StatusCode -eq 401) {
        Write-Info "Frontend session still unauthenticated (expected - no NextAuth login yet)"
    } elseif ($sessionAfterLogin.StatusCode -eq 200) {
        Write-Success "Frontend session authenticated!"
        $sessionData = $sessionAfterLogin.Response.Content | ConvertFrom-Json
        Write-Info "Session user: $($sessionData.user.name) ($($sessionData.user.email))"
    } else {
        Write-Error "Unexpected session status: $($sessionAfterLogin.StatusCode)"
    }
} catch {
    Write-Error "Session check after login failed: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 7: Testing Protected Routes"
# Test dashboard access
try {
    $dashboardResult = Invoke-AuthenticatedRequest -url "$FRONTEND_URL/dashboard" -session $session
    if ($dashboardResult.StatusCode -eq 200) {
        Write-Info "Dashboard accessible (Status: 200)"
        # Check if it contains login redirect or actual dashboard content
        if ($dashboardResult.Response.Content -like "*login*" -or $dashboardResult.Response.Content -like "*sign*") {
            Write-Info "Dashboard content suggests redirect to login"
        } else {
            Write-Success "Dashboard shows actual content (user might be logged in)"
        }
    } elseif ($dashboardResult.StatusCode -in @(302, 307)) {
        Write-Success "Dashboard correctly redirects unauthenticated users"
    } else {
        Write-Error "Dashboard unexpected status: $($dashboardResult.StatusCode)"
    }
} catch {
    Write-Error "Dashboard test failed: $($_.Exception.Message)"
}

Write-Host ""

Write-Test "Step 8: Manual Browser Test Instructions"
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "To complete the authentication test, please:" -ForegroundColor Yellow
Write-Host "1. Open your browser and go to: $FRONTEND_URL/login" -ForegroundColor Yellow
Write-Host "2. Login with these credentials:" -ForegroundColor Yellow
Write-Host "   Email: $TEST_USER_EMAIL" -ForegroundColor Yellow
Write-Host "   Password: $TEST_USER_PASSWORD" -ForegroundColor Yellow
Write-Host "3. After login, try to access: $FRONTEND_URL/dashboard" -ForegroundColor Yellow
Write-Host "4. Check if you can see the dashboard or get redirected to login" -ForegroundColor Yellow
Write-Host ""
Write-Host "If login works and you can access the dashboard, the authentication is working!" -ForegroundColor Green
Write-Host "If you get redirected to login, there might be an issue with the session handling." -ForegroundColor Red

Write-Host ""
Write-Host "Authentication Flow Test Completed" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan 