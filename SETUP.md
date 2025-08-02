# MedXamion Setup Instructions

## Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/rizrmd/medxamion.git
cd medxamion
```

2. Install dependencies:
```bash
bun install
```

3. Generate API client files:
```bash
bun gen
```

4. Copy environment variables:
```bash
cp .env.example .env
```

5. Update the `.env` file with your database credentials

6. Run database migrations:
```bash
cd shared
bun prisma migrate dev
```

## Development

To start the development server:
```bash
bun dev
```

## Notes

- The `frontend/src/lib/gen` directory is gitignored and must be generated locally using `bun gen`
- Make sure PostgreSQL is running before starting the development server