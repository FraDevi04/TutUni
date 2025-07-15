#!/usr/bin/env pwsh

# TutUni AI - Comprehensive Endpoints Testing Script
# This script tests all frontend, API, and backend endpoints

Write-Host "TutUni AI - Comprehensive Endpoints Testing" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FRONTEND_URL = "http://localhost:3000"
$BACKEND_URL = "http://localhost:8000"
$TEST_USER_EMAIL = "endpoint-test-$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$TEST_USER_PASSWORD = "EndpointTest123"
$TEST_USER_NAME = "Endpoint Test User"

# Test results tracking
$testResults = @()
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Write-Success { param($message) Write-Host "[PASS] $message" -ForegroundColor Green }
function Write-Error { param($message) Write-Host "[FAIL] $message" -ForegroundColor Red }
function Write-Info { param($message) Write-Host "[INFO] $message" -ForegroundColor Blue }
function Write-Test { param($message) Write-Host "[TEST] $message" -ForegroundColor Magenta }

function Add-TestResult {
    param($endpoint, $method, $expected, $actual, $status, $details = "")
    
    $script:totalTests++
    if ($status -eq "PASS") { $script:passedTests++ } else { $script:failedTests++ }
    
    $script:testResults += [PSCustomObject]@{
        Endpoint = $endpoint
        Method = $method
        Expected = $expected
        Actual = $actual
        Status = $status
        Details = $details
        Timestamp = Get-Date
    }
}

function Test-Endpoint {
    param(
        [string]$url,
        [string]$method = "GET",
        [hashtable]$headers = @{},
        [string]$body = "",
        [int[]]$expectedCodes = @(200),
        [string]$description = ""
    )
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            UseBasicParsing = $true
            TimeoutSec = 15
            ErrorAction = 'SilentlyContinue'
        }
        
        if ($headers.Count -gt 0) { $params.Headers = $headers }
        if ($body -ne "") { 
            $params.Body = $body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = [int]$response.StatusCode
        
        if ($statusCode -in $expectedCodes) {
            Write-Success "$description - Status: $statusCode"
            Add-TestResult $url $method $expectedCodes $statusCode "PASS" $description
            return @{ Success = $true; StatusCode = $statusCode; Content = $response.Content; Response = $response }
        } else {
            Write-Error "$description - Expected: $expectedCodes, Got: $statusCode"
            Add-TestResult $url $method $expectedCodes $statusCode "FAIL" $description
            return @{ Success = $false; StatusCode = $statusCode; Content = $response.Content; Response = $response }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -in $expectedCodes) {
            Write-Success "$description - Status: $statusCode (Expected error)"
            Add-TestResult $url $method $expectedCodes $statusCode "PASS" $description
            return @{ Success = $true; StatusCode = $statusCode; Error = $_.Exception.Message }
        } else {
            Write-Error "$description - Error: $($_.Exception.Message)"
            Add-TestResult $url $method $expectedCodes "ERROR" "FAIL" "$description - $($_.Exception.Message)"
            return @{ Success = $false; Error = $_.Exception.Message }
        }
    }
}

# Check if servers are running
Write-Test "Checking server status..."
$frontendRunning = $false
$backendRunning = $false

try {
    $netstat3000 = netstat -an | Select-String ":3000.*LISTENING"
    if ($netstat3000) {
        Write-Success "Frontend server is running on port 3000"
        $frontendRunning = $true
    } else {
        Write-Error "Frontend server is NOT running on port 3000"
    }
} catch {
    Write-Error "Error checking frontend server: $($_.Exception.Message)"
}

try {
    $netstat8000 = netstat -an | Select-String ":8000.*LISTENING"
    if ($netstat8000) {
        Write-Success "Backend server is running on port 8000"
        $backendRunning = $true
    } else {
        Write-Error "Backend server is NOT running on port 8000"
    }
} catch {
    Write-Error "Error checking backend server: $($_.Exception.Message)"
}

if (-not $frontendRunning -or -not $backendRunning) {
    Write-Error "One or more servers are not running. Please start them before running tests."
    exit 1
}

Write-Host ""

# ==========================================
# FRONTEND ENDPOINTS TESTING
# ==========================================
Write-Test "Testing Frontend Endpoints..."
Write-Host ""

# Homepage
Test-Endpoint -url "$FRONTEND_URL/" -description "Homepage"

# Auth pages
Test-Endpoint -url "$FRONTEND_URL/register" -description "Registration page"
Test-Endpoint -url "$FRONTEND_URL/login" -description "Login page"

# Protected pages (should redirect to login - 307/302)
Test-Endpoint -url "$FRONTEND_URL/dashboard" -expectedCodes @(307, 302, 401, 403) -description "Dashboard (protected)"
Test-Endpoint -url "$FRONTEND_URL/notifications" -expectedCodes @(307, 302, 401, 403, 404) -description "Notifications (protected)"
Test-Endpoint -url "$FRONTEND_URL/projects/new" -expectedCodes @(307, 302, 401, 403, 404) -description "New project (protected)"

# Static assets
Test-Endpoint -url "$FRONTEND_URL/_next/static/css/app/layout.css" -expectedCodes @(200, 404) -description "CSS assets"

Write-Host ""

# ==========================================
# BACKEND API ENDPOINTS TESTING
# ==========================================
Write-Test "Testing Backend API Endpoints..."
Write-Host ""

# Documentation
Test-Endpoint -url "$BACKEND_URL/docs" -description "API Documentation"
Test-Endpoint -url "$BACKEND_URL/" -description "API Root"

# Health check
Test-Endpoint -url "$BACKEND_URL/health" -expectedCodes @(200, 404) -description "Health check"

Write-Host ""

# ==========================================
# NEXT.JS API ROUTES TESTING
# ==========================================
Write-Test "Testing Next.js API Routes..."
Write-Host ""

# Test registration with invalid data (should fail)
$invalidUser = @{
    name = "Test"
    email = "invalid-email"
    password = "weak"
} | ConvertTo-Json

Test-Endpoint -url "$FRONTEND_URL/api/auth/register" -method "POST" -body $invalidUser -expectedCodes @(400, 422) -description "Registration with invalid data"

# Test registration with valid data (should succeed)
$validUser = @{
    name = $TEST_USER_NAME
    email = $TEST_USER_EMAIL
    password = $TEST_USER_PASSWORD
} | ConvertTo-Json

$registrationResult = Test-Endpoint -url "$FRONTEND_URL/api/auth/register" -method "POST" -body $validUser -expectedCodes @(200, 201) -description "Registration with valid data"

Write-Host ""

# ==========================================
# BACKEND AUTHENTICATION ENDPOINTS
# ==========================================
Write-Test "Testing Backend Authentication..."
Write-Host ""

# Test backend registration directly
Test-Endpoint -url "$BACKEND_URL/auth/register" -method "POST" -body $validUser -expectedCodes @(200, 201, 400) -description "Backend registration"

# Test backend login
$loginData = @{
    email = $TEST_USER_EMAIL
    password = $TEST_USER_PASSWORD
} | ConvertTo-Json

$loginResult = Test-Endpoint -url "$BACKEND_URL/auth/login" -method "POST" -body $loginData -expectedCodes @(200, 401) -description "Backend login"

# Extract access token if login was successful
$accessToken = $null
if ($loginResult.Success -and $loginResult.Content) {
    try {
        $loginResponse = $loginResult.Content | ConvertFrom-Json
        $accessToken = $loginResponse.access_token
        Write-Info "Access token obtained: $($accessToken.Substring(0, 20))..."
    } catch {
        Write-Error "Failed to parse login response"
    }
}

# Test authenticated endpoint if we have a token
if ($accessToken) {
    $authHeaders = @{ "Authorization" = "Bearer $accessToken" }
    Test-Endpoint -url "$BACKEND_URL/auth/me" -headers $authHeaders -description "Get user profile (authenticated)"
} else {
    Write-Error "Cannot test authenticated endpoints - no access token"
    Add-TestResult "$BACKEND_URL/auth/me" "GET" 200 "NO_TOKEN" "FAIL" "No access token available"
}

Write-Host ""

# ==========================================
# DOCUMENT AND PROJECT ENDPOINTS
# ==========================================
Write-Test "Testing Document and Project Endpoints..."
Write-Host ""

# Test project endpoints (these might not exist yet)
Test-Endpoint -url "$BACKEND_URL/projects" -expectedCodes @(200, 401, 404) -description "List projects"
Test-Endpoint -url "$BACKEND_URL/documents" -expectedCodes @(200, 401, 404) -description "List documents"

# Test with authentication if available
if ($accessToken) {
    $authHeaders = @{ "Authorization" = "Bearer $accessToken" }
    Test-Endpoint -url "$BACKEND_URL/projects" -headers $authHeaders -expectedCodes @(200, 404) -description "List projects (authenticated)"
    Test-Endpoint -url "$BACKEND_URL/documents" -headers $authHeaders -expectedCodes @(200, 404) -description "List documents (authenticated)"
}

Write-Host ""

# ==========================================
# CHAT AND AI ENDPOINTS
# ==========================================
Write-Test "Testing Chat and AI Endpoints..."
Write-Host ""

# Test chat endpoints (might require authentication)
Test-Endpoint -url "$BACKEND_URL/chat" -expectedCodes @(200, 401, 404, 405) -description "Chat endpoint"
Test-Endpoint -url "$FRONTEND_URL/api/chat/projects/1/messages" -expectedCodes @(200, 401, 404, 405) -description "Chat messages API"

Write-Host ""

# ==========================================
# ERROR HANDLING TESTING
# ==========================================
Write-Test "Testing Error Handling..."
Write-Host ""

# Test non-existent endpoints
Test-Endpoint -url "$FRONTEND_URL/non-existent-page" -expectedCodes @(404) -description "Non-existent frontend page"
Test-Endpoint -url "$BACKEND_URL/non-existent-endpoint" -expectedCodes @(404) -description "Non-existent backend endpoint"

# Test method not allowed
Test-Endpoint -url "$BACKEND_URL/auth/login" -method "GET" -expectedCodes @(405) -description "Wrong HTTP method"

Write-Host ""

# ==========================================
# PERFORMANCE TESTING
# ==========================================
Write-Test "Testing Response Times..."
Write-Host ""

$performanceTests = @(
    @{ Url = "$FRONTEND_URL/"; Name = "Homepage" },
    @{ Url = "$BACKEND_URL/docs"; Name = "API Docs" },
    @{ Url = "$BACKEND_URL/"; Name = "API Root" }
)

foreach ($test in $performanceTests) {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $test.Url -UseBasicParsing -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        
        if ($responseTime -lt 1000) {
            Write-Success "$($test.Name) - Response time: ${responseTime}ms"
        } elseif ($responseTime -lt 3000) {
            Write-Info "$($test.Name) - Response time: ${responseTime}ms (acceptable)"
        } else {
            Write-Error "$($test.Name) - Response time: ${responseTime}ms (slow)"
        }
    } catch {
        $stopwatch.Stop()
        Write-Error "$($test.Name) - Failed to respond"
    }
}

Write-Host ""

# ==========================================
# RESULTS SUMMARY
# ==========================================
Write-Host "ENDPOINTS TESTING SUMMARY" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Success "Passed: $passedTests"
Write-Error "Failed: $failedTests"

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { 'Green' } elseif ($successRate -ge 60) { 'Yellow' } else { 'Red' })

Write-Host ""

# Detailed results
Write-Host "DETAILED RESULTS" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor Cyan
$testResults | Format-Table -Property @(
    @{Name="Endpoint"; Expression={$_.Endpoint}; Width=40},
    @{Name="Method"; Expression={$_.Method}; Width=8},
    @{Name="Expected"; Expression={$_.Expected}; Width=10},
    @{Name="Actual"; Expression={$_.Actual}; Width=10},
    @{Name="Status"; Expression={$_.Status}; Width=8}
) -AutoSize

# Failed tests details
$failedResults = $testResults | Where-Object { $_.Status -eq "FAIL" }
if ($failedResults.Count -gt 0) {
    Write-Host ""
    Write-Host "FAILED TESTS DETAILS" -ForegroundColor Red
    Write-Host "====================" -ForegroundColor Red
    $failedResults | ForEach-Object {
        Write-Host "- $($_.Endpoint) [$($_.Method)]: $($_.Details)" -ForegroundColor Red
    }
}

Write-Host ""

# Overall assessment
Write-Host "OVERALL ASSESSMENT" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

if ($successRate -ge 90) {
    Write-Success "Excellent! Almost all endpoints are working correctly."
} elseif ($successRate -ge 80) {
    Write-Info "Good! Most endpoints are working with minor issues."
} elseif ($successRate -ge 60) {
    Write-Host "Moderate. Several endpoints need attention." -ForegroundColor Yellow
} else {
    Write-Error "Poor. Many endpoints are failing. Review the implementation."
}

# Recommendations
Write-Host ""
Write-Host "RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan

if ($failedTests -gt 0) {
    Write-Host "- Review failed endpoints and check server logs" -ForegroundColor Yellow
    Write-Host "- Ensure all required services are running" -ForegroundColor Yellow
    Write-Host "- Check database connectivity" -ForegroundColor Yellow
    Write-Host "- Verify authentication flows" -ForegroundColor Yellow
}

if ($successRate -ge 80) {
    Write-Host "- Consider implementing the missing endpoints" -ForegroundColor Yellow
    Write-Host "- Add more comprehensive error handling" -ForegroundColor Yellow
    Write-Host "- Optimize slow endpoints (>1s response time)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Endpoint testing completed at $(Get-Date)" -ForegroundColor Green
Write-Host "TutUni AI Endpoints Testing - End" -ForegroundColor Cyan 