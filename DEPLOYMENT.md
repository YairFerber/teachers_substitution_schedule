
# 🚀 Deployment Guide: Next.js + Turso (LibSQL) on Vercel

This guide will help you deploy your Teacher Schedule App to a live URL so your friend can access it.
Because your app uses SQLite, the best way to deploy it to the cloud is using **Turso** (a cloud SQLite provider) and **Vercel** (for hosting the app).

## Prerequisites

1.  **Vercel Account**: [Sign up here](https://vercel.com/signup) (Free).
2.  **Turso Account**: [Sign up here](https://turso.tech) (Free).
3.  **GitHub Account**: You need to push your code to a GitHub repository.

---

## Step 1: Set up the Database (Turso)

1.  **Install Turso CLI** (on your Mac):
    ```bash
    brew install tursodatabase/tap/turso
    ```
2.  **Login to Turso**:
    ```bash
    turso auth login
    ```
3.  **Create a Database**:
    ```bash
    turso db create teacher-schedule-db
    ```
4.  **Get the Database URL**:
    ```bash
    turso db show teacher-schedule-db --url
    ```
    *Copy the URL (starts with `libsql://...`)*.
5.  **Get the Auth Token**:
    ```bash
    turso db tokens create teacher-schedule-db
    ```
    *Copy the long token string*.

6.  **Push your Schema to Turso**:
    In your project terminal, run this command (replace values with yours):
    ```bash
    TURSO_DATABASE_URL="libsql://your-db-url.turso.io" TURSO_AUTH_TOKEN="your-token" npx prisma db push
    ```
    *This creates the tables in your cloud database.*

---

## Step 2: Push Code to GitHub

1.  Create a new repository on GitHub.
2.  Run these commands in your project folder:
    ```bash
    git init
    git add .
    git commit -m "Ready for deploy"
    git branch -M main
    git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
    git push -u origin main
    ```

---

## Step 3: Deploy to Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import your GitHub repository.
3.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Root Directory**: `./` (default).
4.  **Environment Variables** (CRITICAL):
    Expand the "Environment Variables" section and add:

    | Name | Value |
    | :--- | :--- |
    | `DATABASE_URL` | Your Turso URL (`libsql://...`) |
    | `TURSO_AUTH_TOKEN` | Your Turso Token |
    | `AUTH_SECRET` | Generate a random string (run `openssl rand -base64 32` in terminal to get one) |
    | `AUTH_TRUST_HOST` | `true` |

5.  Click **Deploy**.

---

## Step 4: Post-Deployment Setup (Seeding Data)

1.  **Seed Data**: Since this is a fresh database, it will be empty. You will need to create the admin user so you can log in.
    
    Ideally, run the seed command locally against your production database:
    ```bash
    DATABASE_URL="libsql://your-db-url.turso.io" TURSO_AUTH_TOKEN="your-token" npx prisma db seed
    ```
    *(Replacing with your actual URL and Token again)*

2.  **Done!** Send the Vercel URL to your friend.

---

## Troubleshooting

*   **"Prisma Client not initialized"**: Ensure `TURSO_AUTH_TOKEN` is correct.
*   **Login Error**: Check `AUTH_SECRET` matches what you set in Vercel.
*   **500 Error**: Check Vercel logs. Usually means missing Environment Variables.
