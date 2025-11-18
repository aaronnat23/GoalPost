@echo off
echo Installing core dependencies for SEO Platform MVP...
echo.

REM Core dependencies
echo [1/6] Installing Prisma ORM...
call npm install prisma @prisma/client

echo.
echo [2/6] Installing authentication (Auth.js)...
call npm install next-auth@beta

echo.
echo [3/6] Installing UI libraries...
call npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-slot
call npm install class-variance-authority clsx tailwind-merge lucide-react

echo.
echo [4/6] Installing drag and drop...
call npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

echo.
echo [5/6] Installing state management and data fetching...
call npm install @tanstack/react-query zustand
call npm install axios

echo.
echo [6/6] Installing job queue and utilities...
call npm install bullmq ioredis
call npm install date-fns zod

echo.
echo Installing dev dependencies...
call npm install -D @types/node prisma tsx ts-node bcryptjs
call npm install -D @types/bcryptjs

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo Next steps:
echo 1. Set up PostgreSQL database
echo 2. Create .env.local file
echo 3. Run: npx prisma init
echo.
pause
