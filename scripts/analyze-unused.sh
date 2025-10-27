#!/bin/bash

echo "========================================="
echo "UNUSED COMPONENTS & ROUTES ANALYSIS"
echo "========================================="
echo ""

# Active routes from sidebar
echo "📍 ACTIVE ROUTES (from sidebar):"
echo "  ✓ /home"
echo "  ✓ /my-tasks"
echo "  ✓ /chat"
echo "  ✓ /compliance-check"
echo "  ✓ /contract-review"
echo "  ✓ /policy-generator"
echo "  ✓ /ai-agents"
echo "  ✓ /rulebase"
echo "  ✓ /upload-assets"
echo "  ✓ /history"
echo "  ✓ /users"
echo "  ✓ /how-to-use"
echo ""

echo "🗑️  UNUSED ROUTES (not in sidebar):"
echo "  ✗ /ai-policy-analyzer (and sub-routes)"
echo "  ✗ /chat-history"
echo "  ✗ /clear-cache"
echo "  ✗ /contract-templates/[contractId]"
echo "  ✗ /dashboard (replaced by /home)"
echo "  ✗ /dashboardstatic"
echo "  ✗ /fix-profile-data"
echo "  ✗ /idea-analyzer (commented in sidebar)"
echo "  ✗ /learn-modules"
echo "  ✗ /learn"
echo "  ✗ /policy-analyser (old spelling)"
echo "  ✗ /profile (not in sidebar)"
echo "  ✗ /search (not in sidebar)"
echo "  ✗ /settings (hidden in sidebar)"
echo "  ✗ /statistics"
echo ""

echo "📄 DOCUMENTATION FILES TO MOVE TO docs/:"
cd /Users/anujdwivedi/Desktop/kroolo/poligap_app
find . -maxdepth 1 -name "*.md" ! -name "README.md" ! -name "WARP.md" -type f | while read file; do
    echo "  • $(basename "$file")"
done
echo ""

echo "🔍 Scanning for unused component files..."
echo ""

# Check for components that might be unused
UNUSED_COMPONENTS=()

# Check common component patterns
for component in src/components/**/*.tsx; do
    if [ -f "$component" ]; then
        filename=$(basename "$component" .tsx)
        # Skip index files and ui components
        if [[ "$filename" != "index" && "$component" != *"/ui/"* ]]; then
            # Search for imports of this component
            imports=$(grep -r "from.*$filename" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
            if [ "$imports" -lt 2 ]; then
                UNUSED_COMPONENTS+=("$component")
            fi
        fi
    fi
done

echo "⚠️  POTENTIALLY UNUSED COMPONENTS:"
if [ ${#UNUSED_COMPONENTS[@]} -eq 0 ]; then
    echo "  None found!"
else
    for comp in "${UNUSED_COMPONENTS[@]}"; do
        echo "  • $comp"
    done
fi
echo ""

echo "========================================="
echo "CLEANUP RECOMMENDATIONS:"
echo "========================================="
echo ""
echo "1. Move .md files to docs/ folder:"
echo "   mkdir -p docs/legacy"
echo "   mv OPENAI_ASSISTANT_*.md docs/legacy/"
echo "   mv VERIFICATION_REPORT.md docs/reports/"
echo ""
echo "2. Remove unused route folders:"
echo "   rm -rf src/app/(app)/ai-policy-analyzer"
echo "   rm -rf src/app/(app)/dashboardstatic"
echo "   rm -rf src/app/(app)/fix-profile-data"
echo "   rm -rf src/app/(app)/learn-modules"
echo "   rm -rf src/app/(app)/learn"
echo "   rm -rf src/app/(app)/policy-analyser"
echo "   rm -rf src/app/(app)/statistics"
echo "   rm -rf src/app/(app)/clear-cache"
echo ""
echo "3. Consider consolidating:"
echo "   • /dashboard can be removed (using /home)"
echo "   • /chat-history might merge with /history"
echo "   • /search is not exposed in UI"
echo ""

echo "✅ Analysis complete!"
