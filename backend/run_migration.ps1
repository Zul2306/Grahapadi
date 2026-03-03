# PowerShell script to run SQL migration
# This script adds user invitation columns to the users table

$DB_HOST = "127.0.0.1"
$DB_PORT = "5432"
$DB_USER = "postgres"
$DB_NAME = "inventory"
$DB_PASSWORD = ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Adding User Invitation Columns" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Read SQL file
$sqlFile = Join-Path $PSScriptRoot "add_user_columns.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "ERROR: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw

Write-Host "Connecting to database: $DB_NAME@$DB_HOST:$DB_PORT" -ForegroundColor Yellow
Write-Host ""

# Try using psql if available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlPath) {
    Write-Host "Using psql..." -ForegroundColor Green
    $env:PGPASSWORD = $DB_PASSWORD
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $sqlFile
    $env:PGPASSWORD = $null
} else {
    Write-Host "psql not found. Using .NET PostgreSQL client..." -ForegroundColor Yellow
    
    # Try using Npgsql if available
    try {
        Add-Type -Path "C:\Program Files\PostgreSQL\*\lib\Npgsql.dll" -ErrorAction Stop
        
        $connString = "Host=$DB_HOST;Port=$DB_PORT;Username=$DB_USER;Password=$DB_PASSWORD;Database=$DB_NAME"
        $conn = New-Object Npgsql.NpgsqlConnection($connString)
        $conn.Open()
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sqlContent
        $cmd.ExecuteNonQuery() | Out-Null
        
        Write-Host "Migration completed successfully!" -ForegroundColor Green
        
        $conn.Close()
    } catch {
        Write-Host ""
        Write-Host "ERROR: Could not connect to database" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "Please run the SQL manually:" -ForegroundColor Yellow
        Write-Host "1. Open pgAdmin or your PostgreSQL client" -ForegroundColor White
        Write-Host "2. Connect to database 'inventory'" -ForegroundColor White
        Write-Host "3. Execute the SQL from: $sqlFile" -ForegroundColor White
        Write-Host ""
        Write-Host "Or install PostgreSQL command line tools (psql)" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
