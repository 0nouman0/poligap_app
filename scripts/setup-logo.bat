@echo off
echo ============================================
echo POLIGAP Logo Setup
echo ============================================
echo.
echo To complete the logo update:
echo.
echo 1. Save your POLIGAP logo image as: poligap-logo.png
echo 2. Place it in the folder: public\assets\
echo.
echo Current logo location:
echo %CD%\public\assets\
echo.
echo Your logo should be saved as:
echo %CD%\public\assets\poligap-logo.png
echo.
echo After placing the logo file:
echo - Run: npm run dev (for development)
echo - Or run: npm run build (for production)
echo.
echo ============================================
echo Press any key to open the assets folder...
pause > nul
explorer "%CD%\public\assets"
