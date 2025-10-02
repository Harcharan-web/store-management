# Store Management System

A professional store management system built with Next.js 15, React 19, PostgreSQL, Drizzle ORM, and NextAuth. This system helps you manage inventory, track sales, handle rentals, and maintain customer records for your building materials store.

## Features

- **Product Management**: Add, edit, and track products available for sale or rent
- **Customer Management**: Maintain customer profiles with purchase and rental history
- **Sales Tracking**: Record and manage sales transactions
- **Rental Management**: Track rental items with dates, charges, and return status
- **Authentication**: Secure login system with NextAuth
- **Server-Side Pagination**: Efficient data loading and display
- **Optimized Performance**: Uses React.memo, useMemo, useCallback, and Suspense

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth v5
- **Styling**: Tailwind CSS v4

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   └── login/             # Authentication page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── products/         # Product-specific components
│   └── layout/           # Layout components
├── db/                   # Database configuration
│   ├── schema/          # Drizzle ORM schemas
│   └── index.ts         # Database client
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/              # TypeScript type definitions
└── scripts/            # Utility scripts
```

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update with your configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/store_management

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# App Configuration
NODE_ENV=development
```

To generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE store_management;
```

### 4. Generate and Run Migrations

Generate the database schema:

```bash
npm run db:generate
```

Push the schema to your database:

```bash
npm run db:push
```

### 5. Create Admin User

Run the admin creation script:

```bash
npm run seed:admin
```

This will create an admin user with:
- Email: `admin@store.com`
- Password: `admin123`

**Important**: Change this password after your first login!

The script will check if an admin already exists and prevent duplicates.

### 6. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## Database Scripts

- `npm run db:generate` - Generate migrations from schema
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database (development)
- `npm run db:studio` - Open Drizzle Studio GUI
- `npm run seed:admin` - Create admin user (email: admin@store.com, password: admin123)

## Usage Guide

### Managing Products

1. Navigate to **Dashboard > Products**
2. Click **Add Product** to create a new product
3. Fill in product details:
   - Basic info (name, SKU, category, unit)
   - Product type (sale, rent, or both)
   - Pricing (sale price and/or rental rates)
   - Stock information
4. Products can be edited or deleted from the product list

### Managing Customers

1. Navigate to **Dashboard > Customers**
2. Add customer profiles with contact information
3. Customer records persist for future transactions
4. Search and filter customers easily

### Recording Sales

1. Navigate to **Dashboard > Sales**
2. Select a customer (or create a new one)
3. Add products to the sale
4. Set payment details (method, status, amount)
5. Generate invoice

### Managing Rentals

1. Navigate to **Dashboard > Rentals**
2. Select customer and rental products
3. Set rental period (start and expected return dates)
4. Configure rental rates (daily, weekly, or monthly)
5. Track security deposits and charges
6. Record returns and calculate late fees if applicable

## Features in Detail

### Product Types

- **Sale Only**: Products available only for purchase
- **Rent Only**: Products available only for rental
- **Both**: Products available for both sale and rental

### Rental Pricing

- Daily rate
- Weekly rate
- Monthly rate
- Security deposit tracking
- Late fee calculation
- Damage charges

### Payment Tracking

- Multiple payment methods (cash, card, UPI, bank transfer, cheque)
- Payment status (paid, partial, pending)
- Amount due tracking

### Security Features

- Password hashing with bcrypt
- Session-based authentication
- Protected API routes
- Role-based access control (admin, user)

## Development Best Practices

This project follows professional development practices:

- **Component-based architecture** with clear separation of concerns
- **Custom hooks** for API calls and business logic
- **TypeScript** for type safety
- **Server-side pagination** for efficient data loading
- **React optimization** with memo, useMemo, useCallback
- **Suspense boundaries** for better loading states
- **Clean code structure** with dedicated directories for types, utils, hooks

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database exists and credentials are correct

### Authentication Issues

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

## Future Enhancements

Potential features to add:

- Dashboard analytics and reports
- Inventory alerts for low stock
- Invoice PDF generation
- Email notifications
- Barcode scanning
- Multi-store support
- Export data to Excel/CSV
- SMS notifications for rental returns
- Payment gateway integration

## License

This project is for personal/commercial use.

## Support

For issues or questions, please refer to the documentation or contact the development team.
